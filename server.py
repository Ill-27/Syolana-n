"""Syolana pilot: WSGI service. Production: HTTPS reverse proxy + Gunicorn.

No credentials belong in public/. SQLite/uploads are outside the static root.
The service is intended for a small, single-server pilot, not an unlimited host.
"""
from __future__ import annotations
import base64, calendar, hashlib, hmac, html, io, ipaddress, json, mimetypes, os, re, secrets, sqlite3, time, traceback, uuid, zipfile
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parent
PUBLIC = Path(os.environ.get('PUBLIC_DIR', str(ROOT.parent / 'dist' / 'public'))).resolve()
PRIVATE_LESSONS = Path(os.environ.get('PRIVATE_LESSONS_DIR', str(ROOT.parent / 'dist' / 'private_lessons'))).resolve()
DATA = Path(os.environ.get('DATA_DIR', str(ROOT / 'data'))).resolve()
ORIGIN = os.environ.get('PUBLIC_ORIGIN', 'http://127.0.0.1:8787').rstrip('/')
LOCAL = urlparse(ORIGIN).hostname in ('127.0.0.1', 'localhost', '::1')
SECURE = ORIGIN.startswith('https://')
TERMS_VERSION = os.environ.get('TERMS_VERSION', 'pilot-preview-2026-09-29')
REGISTRATION_OPEN = os.environ.get('REGISTRATION_OPEN', '1' if LOCAL else '0') == '1'
MAX_BODY = 29 * 1024 * 1024
MAX_FILE = 20 * 1024 * 1024
MAX_QUOTA = 200 * 1024 * 1024
MAX_TEXT = 2_000_000
PRICE = int(os.environ.get('CURRENT_PRICE_KOPECKS','100000'))  # server-owned, never taken from client
SESSION_SECONDS = 7 * 86400
PAYMENT_SETTINGS = ('YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET', 'RECEIPT_VAT_CODE', 'RECEIPT_TAX_SYSTEM_CODE', 'RECEIPT_PAYMENT_MODE')

def now(): return int(time.time())
def ident(): return uuid.uuid4().hex
def js(x): return json.dumps(x, ensure_ascii=False, separators=(',', ':'))
def unpack(x): return json.loads(x) if x else None

class Problem(Exception):
    def __init__(self, message, status=400): self.message, self.status = message, status

def db():
    c = sqlite3.connect(DATA / 'syolana.sqlite3', timeout=20)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c

def initialize():
    DATA.mkdir(parents=True, exist_ok=True)
    os.chmod(DATA, 0o700)
    (DATA / 'uploads').mkdir(exist_ok=True)
    with db() as c:
        c.execute('PRAGMA journal_mode=WAL')
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'author',terms_version TEXT,created INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          csrf TEXT NOT NULL,expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS sites(user_id TEXT PRIMARY KEY REFERENCES users(id),slug TEXT UNIQUE NOT NULL,
          draft TEXT NOT NULL,published TEXT,pending TEXT,review_status TEXT NOT NULL DEFAULT 'draft',
          review_version TEXT,review_note TEXT,trial_ends INTEGER,paid_until INTEGER,locked_until INTEGER,
          suspended INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL,locked_price INTEGER);
        CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
          draft TEXT NOT NULL,published TEXT,pending TEXT,review_status TEXT NOT NULL DEFAULT 'draft',
          review_version TEXT,review_note TEXT,updated INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS posts_owner ON posts(user_id);
        CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
          filename TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,created INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,action TEXT NOT NULL,
          target TEXT,detail TEXT,created INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,url TEXT NOT NULL,email TEXT NOT NULL,
          reason TEXT NOT NULL,created INTEGER NOT NULL,closed INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
          provider_id TEXT UNIQUE,url TEXT,state TEXT NOT NULL,amount INTEGER NOT NULL,created INTEGER NOT NULL,
          applied INTEGER NOT NULL DEFAULT 0,refunded INTEGER NOT NULL DEFAULT 0);
        ''')
        if 'locked_price' not in [r['name'] for r in c.execute('PRAGMA table_info(sites)')]:
            c.execute('ALTER TABLE sites ADD COLUMN locked_price INTEGER')

def password_hash(password):
    salt = secrets.token_bytes(16)
    result = hashlib.scrypt(password.encode(), salt=salt, n=32768, r=8, p=1, maxmem=64*1024*1024)
    return salt.hex() + ':' + result.hex()

def password_valid(password, encoded):
    try:
        salt, digest = encoded.split(':')
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=32768, r=8, p=1, maxmem=64*1024*1024)
        return hmac.compare_digest(actual.hex(), digest)
    except (ValueError, TypeError): return False

def plain(value, maximum, label, required=False):
    if not isinstance(value, str): raise Problem('Некорректное поле: ' + label)
    value = value.strip().replace('\x00', '')
    if len(value) > maximum or (required and not value): raise Problem('Проверьте поле: ' + label)
    return value

def email_value(value):
    value = plain(value, 254, 'email', True).lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value): raise Problem('Укажите корректный email.')
    return value

def safe_url(value):
    value = plain(value or '', 1500, 'ссылка')
    if not value: return ''
    parsed = urlparse(value)
    if not parsed.scheme and value.startswith('/media/') and re.fullmatch(r'/media/[a-f0-9]{32}\.[a-z0-9]+',value): return value
    if parsed.scheme != 'https' or not parsed.netloc or parsed.username or parsed.password:
        raise Problem('Внешние ссылки должны начинаться с https://.')
    return value

def event(c, user_id, action, target='', detail=''):
    c.execute('INSERT INTO events(user_id,action,target,detail,created) VALUES(?,?,?,?,?)', (user_id,action,target,detail,now()))

def limit(c, key, maximum, seconds):
    key = hashlib.sha256(key.encode()).hexdigest()
    c.execute('DELETE FROM rate_limits WHERE reset < ?', (now(),))
    c.execute('INSERT INTO rate_limits(key,count,reset) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1', (key,now()+seconds))
    row = c.execute('SELECT count FROM rate_limits WHERE key=?',(key,)).fetchone()
    c.commit()  # count unsuccessful requests too
    if row['count'] > maximum: raise Problem('Слишком много попыток. Повторите позже.',429)

def access(site):
    until = max(site['trial_ends'] or 0, site['paid_until'] or 0)
    return {'active':not bool(site['suspended']) and until > now(),'accessUntil':until}

def clean_site(row):
    if not row:return None
    result = dict(row)
    for k in ('draft','published','pending'): result[k] = unpack(result[k])
    result.pop('user_id',None)
    return result

def clean_post(row):
    result = dict(row)
    for k in ('draft','published','pending'):result[k] = unpack(result[k])
    result.pop('user_id',None)
    return result

def public_meta(p, post_id):
    return {k:p.get(k,'') for k in ('title','description','cover','kind','mediaUrl')} | {'id':post_id,'chapters':[{'title':ch['title']} for ch in p['chapters']]}

def check_owned_asset(c, uid, value):
    if not value:return
    p=urlparse(value)
    path=p.path
    if (not p.netloc or p.netloc == urlparse(ORIGIN).netloc) and path.startswith('/media/'):
        if not c.execute('SELECT 1 FROM assets WHERE filename=? AND user_id=?',(path.split('/')[-1],uid)).fetchone():
            raise Problem('Медиафайл не принадлежит этому аккаунту.',403)

def post_payload(c, uid, data):
    kind = data.get('kind')
    if kind not in ('book','post','music','portfolio'):raise Problem('Неизвестный тип публикации.')
    chapters = data.get('chapters')
    if not isinstance(chapters,list) or not 1 <= len(chapters) <= 500:raise Problem('Нужно от 1 до 500 глав.')
    result=[];total=0
    for ch in chapters:
        if not isinstance(ch,dict):raise Problem('Некорректная глава.')
        text=plain(ch.get('text'),MAX_TEXT,'текст',True);total+=len(text)
        mood=ch.get('mood','auto')
        if mood not in ('auto','neutral','calm','hope','tension','wonder'):raise Problem('Неизвестное настроение.')
        result.append({'title':plain(ch.get('title'),160,'название главы',True),'text':text,'mood':mood})
    if total>MAX_TEXT:raise Problem('Публикация может содержать до 2 миллионов символов.')
    cover=safe_url(data.get('cover',''));media=safe_url(data.get('mediaUrl',''))
    check_owned_asset(c,uid,cover);check_owned_asset(c,uid,media)
    if cover:
        # Covers are uploaded to this instance; external tracking images are not allowed.
        path=urlparse(cover).path
        if not path.startswith('/media/') or (urlparse(cover).netloc and urlparse(cover).netloc != urlparse(ORIGIN).netloc):
            raise Problem('Загрузите обложку через кнопку выбора файла.')
        a=c.execute('SELECT mime FROM assets WHERE filename=? AND user_id=?',(path.split('/')[-1],uid)).fetchone()
        if not a or not a['mime'].startswith('image/'):raise Problem('Обложка должна быть изображением.')
    return {'title':plain(data.get('title'),160,'название',True),'description':plain(data.get('description',''),1000,'описание'),
            'kind':kind,'chapters':result,'cover':cover,'mediaUrl':media}

def payment_ready():
    return (os.environ.get('PAYMENTS_ENABLED')=='1' and os.environ.get('LEGAL_READY')=='1' and SECURE
            and all(os.environ.get(k) for k in PAYMENT_SETTINGS))

def provider_request(path, payload=None, key=None):
    if not re.fullmatch(r'(?:payments(?:/[a-zA-Z0-9-]+)?|refunds/[a-zA-Z0-9-]+)',path):raise Problem('Некорректный платёж.',400)
    auth=base64.b64encode((os.environ.get('YOOKASSA_SHOP_ID','')+':'+os.environ.get('YOOKASSA_SECRET','')).encode()).decode()
    headers={'Authorization':'Basic '+auth,'Content-Type':'application/json'}
    if key:headers['Idempotence-Key']=key
    req=Request('https://api.yookassa.ru/v3/'+path,data=js(payload).encode() if payload is not None else None,headers=headers)
    try:
        with urlopen(req,timeout=20) as response:return json.load(response)
    except (URLError,HTTPError,ValueError):raise Problem('Платёжный сервис временно недоступен. Попробуйте позже.',502)

def add_month(stamp):
    d=datetime.fromtimestamp(stamp,timezone.utc);year=d.year+(1 if d.month==12 else 0);month=1 if d.month==12 else d.month+1
    return int(d.replace(year=year,month=month,day=min(d.day,calendar.monthrange(year,month)[1])).timestamp())

def price_for(site):
    return site['locked_price'] if (site['locked_until'] or 0)>now() and site['locked_price'] else PRICE

def export_site(c,uid):
    """A portable text site, with no Syolana logo, scripts or required platform connection."""
    row=c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone()
    if not row:raise Problem('Сначала создайте страницу автора.')
    profile=unpack(row['draft']);esc=html.escape;buffer=io.BytesIO()
    def page(title,content):
        return '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><style>body{max-width:800px;margin:40px auto;padding:0 22px;font:20px/1.7 Georgia,serif;background:#fafaf7;color:#222}a{color:#4a3972}img,video{max-width:100%}h1{line-height:1.2}p{white-space:pre-line}article{margin:35px 0}</style><main>'+content+'</main></html>'
    def portable_url(value):
        if urlparse(value or '').path.startswith('/media/'):
            return 'media/'+urlparse(value).path.split('/')[-1]
        return value or ''
    index='<h1>'+esc(profile['name'])+'</h1><p>'+esc(profile.get('bio',''))+'</p>'
    with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
        for p in c.execute('SELECT id,draft FROM posts WHERE user_id=? ORDER BY updated DESC',(uid,)):
            book=unpack(p['draft']);filename=p['id']+'.html';index+='<article><h2><a href="'+filename+'">'+esc(book['title'])+'</a></h2><p>'+esc(book['description'])+'</p></article>'
            body='<a href="index.html">В каталог</a><h1>'+esc(book['title'])+'</h1>'
            if book.get('cover'):body+='<img src="'+esc(portable_url(book['cover']),quote=True)+'" alt="Обложка">'
            body+='<nav><ol>'+''.join('<li><a href="#ch'+str(i)+'">'+esc(ch['title'])+'</a></li>' for i,ch in enumerate(book['chapters']))+'</ol></nav>'
            for i,ch in enumerate(book['chapters']):body+='<article id="ch'+str(i)+'"><h2>'+esc(ch['title'])+'</h2>'+''.join('<p>'+esc(t)+'</p>' for t in ch['text'].split('\n\n'))+'</article>'
            if book.get('mediaUrl'):body+='<p><a href="'+esc(portable_url(book['mediaUrl']),quote=True)+'">Приложенный материал</a></p>'
            z.writestr(filename,page(book['title'],body))
        z.writestr('index.html',page(profile['name'],index))
        for a in c.execute('SELECT filename FROM assets WHERE user_id=?',(uid,)):
            path=DATA/'uploads'/a['filename']
            if path.is_file():z.write(path,'media/'+a['filename'])
    return buffer.getvalue()

def apply_payment(c, p):
    """Only pass a fresh, authenticated GET response from YooKassa here."""
    if p.get('status')!='succeeded' or p.get('paid') is not True:return
    if p.get('test') is True and os.environ.get('ALLOW_TEST_PAYMENTS')!='1':raise Problem('Тестовый платёж не даёт реальный доступ.',400)
    pid=p.get('id','');local_id=p.get('metadata',{}).get('local_id','')
    row=c.execute('SELECT * FROM payments WHERE id=?',(local_id,)).fetchone()
    if not row:raise Problem('Неизвестный платёж.',400)
    if row['provider_id'] and row['provider_id']!=pid:raise Problem('Идентификатор платежа не совпадает.',400)
    if p.get('amount')!={'value':f"{row['amount']/100:.2f}",'currency':'RUB'}:raise Problem('Сумма платежа не совпадает.',400)
    if p.get('metadata',{}).get('user_id')!=row['user_id']:raise Problem('Плательщик не совпадает.',400)
    recipient=p.get('recipient',{})
    if str(recipient.get('account_id',''))!=os.environ.get('YOOKASSA_SHOP_ID',''):raise Problem('Получатель платежа не совпадает.',400)
    c.execute('BEGIN IMMEDIATE')
    row=c.execute('SELECT * FROM payments WHERE id=?',(local_id,)).fetchone()
    if row['applied'] or row['refunded']:
        c.commit();return
    site=c.execute('SELECT * FROM sites WHERE user_id=?',(row['user_id'],)).fetchone()
    if not site:raise Problem('Страница автора не найдена.',400)
    until=add_month(max(now(),site['paid_until'] or 0,site['trial_ends'] or 0))
    locked=site['locked_until'] or now()+365*86400
    locked_price=site['locked_price'] if (site['locked_until'] or 0)>now() and site['locked_price'] else row['amount']
    c.execute('UPDATE sites SET paid_until=?,locked_until=?,locked_price=? WHERE user_id=?',(until,locked,locked_price,row['user_id']))
    c.execute("UPDATE payments SET provider_id=?,state='succeeded',applied=1 WHERE id=?",(pid,local_id))
    event(c,row['user_id'],'payment_applied',local_id,str(until));c.commit()

class App:
    def __init__(self, env):
        self.env=env;self.method=env.get('REQUEST_METHOD','GET');self.path=env.get('PATH_INFO','/');self.query=parse_qs(env.get('QUERY_STRING',''));self.headers=[];self.user=None;self.csrf='';self.session_token=''
        try:self.path=self.path.encode('latin1').decode('utf-8')
        except (UnicodeEncodeError,UnicodeDecodeError):pass
        self.c=db()
        cookies=SimpleCookie()
        try:cookies.load(env.get('HTTP_COOKIE',''))
        except Exception:pass
        token=cookies.get('sy_session')
        if token:
            self.session_token=hashlib.sha256(token.value.encode()).hexdigest()
            row=self.c.execute('SELECT s.csrf,u.* FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=? AND s.expires>?',(self.session_token,now())).fetchone()
            if row:self.user=dict(row);self.csrf=row['csrf']

    def body(self):
        try:length=int(self.env.get('CONTENT_LENGTH') or 0)
        except ValueError:raise Problem('Некорректная длина запроса.')
        if length<0 or length>MAX_BODY:raise Problem('Файл слишком большой.',413)
        if not self.env.get('CONTENT_TYPE','').startswith('application/json'):raise Problem('Ожидается JSON.',415)
        try:data=json.loads(self.env['wsgi.input'].read(length))
        except (ValueError,UnicodeError):raise Problem('Некорректный JSON.')
        if not isinstance(data,dict):raise Problem('Ожидается объект JSON.')
        return data

    def require(self, admin=False):
        if not self.user:raise Problem('Войдите в аккаунт.',401)
        if admin and self.user['role']!='admin':raise Problem('Требуется доступ администратора.',403)
        return self.user['id']

    def check_mutation(self):
        if self.env.get('HTTP_ORIGIN')!=ORIGIN:raise Problem('Недопустимый источник запроса.',403)
        if self.user and not hmac.compare_digest(self.env.get('HTTP_X_CSRF_TOKEN',''),self.csrf):raise Problem('Обновите страницу и повторите действие.',403)

    def user_view(self):
        return {k:self.user[k] for k in ('id','email','role')} if self.user else None

    def new_session(self, user):
        raw=secrets.token_urlsafe(32);self.csrf=secrets.token_urlsafe(32);self.user=dict(user)
        if self.session_token:self.c.execute('DELETE FROM sessions WHERE token=?',(self.session_token,))
        self.c.execute('DELETE FROM sessions WHERE expires<?',(now(),))
        self.c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(hashlib.sha256(raw.encode()).hexdigest(),user['id'],self.csrf,now()+SESSION_SECONDS))
        self.headers.append(('Set-Cookie','sy_session='+raw+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+str(SESSION_SECONDS)+('; Secure' if SECURE else '')))
        self.c.commit()
        return {'user':self.user_view(),'csrf':self.csrf}

    def public_site(self,slug):
        site=self.c.execute('SELECT * FROM sites WHERE slug=?',(slug,)).fetchone()
        if not site or not site['published']:raise Problem('Страница пока не опубликована.',404)
        if site['suspended']:raise Problem('Доступ к этой странице временно ограничен.',451)
        return site

    def respond_api(self):
        path=self.path.removeprefix('/api/');c=self.c;method=self.method
        if method not in ('GET','POST'):raise Problem('Метод не поддерживается.',405)
        if method=='POST' and path!='webhooks/yookassa':self.check_mutation()
        ip=self.env.get('REMOTE_ADDR','unknown')
        if os.environ.get('TRUST_PRIVATE_PROXY')=='1':
            try:
                peer=ipaddress.ip_address(ip)
                if peer.is_private or peer.is_loopback:
                    ip=str(ipaddress.ip_address(self.env.get('HTTP_X_SYOLANA_CLIENT_IP',ip)))
            except ValueError:pass
        if path=='status' and method=='GET':return {'service':'syolana','registrationOpen':REGISTRATION_OPEN,'termsVersion':TERMS_VERSION,'paymentsEnabled':payment_ready()}
        if path=='session' and method=='GET':return {'user':self.user_view(),'csrf':self.csrf}
        if path in ('auth/register','auth/login') and method=='POST':
            limit(c,'auth-ip:'+ip,30,900);data=self.body();email=email_value(data.get('email'))
            limit(c,'auth-email:'+email,12,900);password=plain(data.get('password'),128,'пароль',True)
            if path=='auth/register':
                if not REGISTRATION_OPEN:raise Problem('Регистрация пока закрыта.',403)
                if len(password)<10:raise Problem('Минимальная длина пароля — 10 символов.')
                if data.get('agreed') is not True or data.get('termsVersion')!=TERMS_VERSION:raise Problem('Примите актуальные условия пилота.')
                uid=ident()
                try:c.execute('INSERT INTO users(id,email,password,terms_version,created) VALUES(?,?,?,?,?)',(uid,email,password_hash(password),TERMS_VERSION,now()));c.commit()
                except sqlite3.IntegrityError:raise Problem('Не удалось создать аккаунт. Попробуйте войти или свяжитесь с поддержкой.',409)
                row=c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone()
            else:
                row=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
                # Equivalent expensive hash for unknown accounts limits obvious timing differences.
                encoded=row['password'] if row else ('00'*16+':'+'00'*64)
                if not password_valid(password,encoded) or not row:raise Problem('Неверный email или пароль.',401)
            return self.new_session(row)
        if path=='auth/logout' and method=='POST':
            c.execute('DELETE FROM sessions WHERE token=?',(self.session_token,));c.commit()
            self.headers.append(('Set-Cookie','sy_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'+('; Secure' if SECURE else '')));return {'ok':True}
        if path=='studio' and method=='GET':
            uid=self.require();site=c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone()
            return {'priceRub':(price_for(site) if site else PRICE)/100,'site':clean_site(site),'posts':[clean_post(p) for p in c.execute('SELECT * FROM posts WHERE user_id=? ORDER BY updated DESC',(uid,))],**(access(site) if site else {'active':False,'accessUntil':0})}
        if path=='site' and method=='POST':
            uid=self.require();data=self.body();slug=plain(data.get('slug'),40,'адрес',True)
            if not re.fullmatch(r'[a-z0-9][a-z0-9-]{2,39}',slug) or slug in ('admin','api','syolana','studio','support'):raise Problem('Выберите другой адрес: 3–40 латинских букв, цифр или дефисов.')
            payload={k:plain(data.get(k,''),n,k,k=='name') for k,n in [('name',100),('category',100),('bio',3000)]};payload['link']=safe_url(data.get('link',''))
            current=c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone();version=ident()
            if current and slug!=current['slug']:raise Problem('Изменение адреса в пилоте выполняется через поддержку.')
            try:
                c.execute('''INSERT INTO sites(user_id,slug,draft,pending,review_status,review_version,created) VALUES(?,?,?,?,'pending',?,?)
                ON CONFLICT(user_id) DO UPDATE SET draft=excluded.draft,pending=excluded.pending,review_status='pending',review_version=excluded.review_version,review_note=NULL''',(uid,slug,js(payload),js(payload),version,now()))
                event(c,uid,'site_submitted',slug);c.commit()
            except sqlite3.IntegrityError:raise Problem('Этот адрес уже занят.',409)
            return {'ok':True,'slug':slug}
        if path=='posts' and method=='POST':
            uid=self.require();data=self.body()
            if not c.execute('SELECT 1 FROM sites WHERE user_id=?',(uid,)).fetchone():raise Problem('Сначала создайте страницу автора.')
            post_id=data.get('id');payload=post_payload(c,uid,data)
            if post_id:
                current=c.execute('SELECT * FROM posts WHERE id=? AND user_id=?',(post_id,uid)).fetchone()
                if not current:raise Problem('Публикация не найдена.',404)
                c.execute("UPDATE posts SET draft=?,updated=?,review_status=CASE WHEN pending IS NOT NULL THEN 'pending' ELSE 'draft' END WHERE id=? AND user_id=?",(js(payload),now(),post_id,uid))
            else:
                c.execute('BEGIN IMMEDIATE')
                if c.execute('SELECT count(*) n FROM posts WHERE user_id=?',(uid,)).fetchone()['n']>=50:raise Problem('В пилоте доступно до 50 публикаций.')
                post_id=ident();c.execute('INSERT INTO posts(id,user_id,draft,updated) VALUES(?,?,?,?)',(post_id,uid,js(payload),now()))
            c.commit();return {'id':post_id}
        match=re.fullmatch(r'posts/([a-f0-9]{32})/submit',path)
        if match and method=='POST':
            uid=self.require();data=self.body()
            if data.get('rights') is not True:raise Problem('Подтвердите наличие прав на материал.')
            row=c.execute('SELECT * FROM posts WHERE id=? AND user_id=?',(match[1],uid)).fetchone()
            if not row:raise Problem('Публикация не найдена.',404)
            c.execute("UPDATE posts SET pending=draft,review_version=?,review_status='pending',review_note=NULL WHERE id=? AND user_id=?",(ident(),match[1],uid));event(c,uid,'post_submitted_rights_confirmed',match[1],TERMS_VERSION);c.commit();return {'ok':True}
        if path=='assets' and method=='POST':
            uid=self.require();limit(c,'upload:'+uid,60,3600);data=self.body()
            if not isinstance(data.get('data'),str):raise Problem('Не получен файл.')
            try:raw=base64.b64decode(data['data'],validate=True)
            except Exception:raise Problem('Некорректный файл.')
            if not raw or len(raw)>MAX_FILE:raise Problem('Файл должен быть от 1 байта до 20 МБ.',413)
            ext,mime=None,None
            if raw.startswith(b'\x89PNG\r\n\x1a\n'):ext,mime='png','image/png'
            elif raw.startswith(b'\xff\xd8\xff'):ext,mime='jpg','image/jpeg'
            elif raw[:4]==b'RIFF' and raw[8:12]==b'WEBP':ext,mime='webp','image/webp'
            elif raw[4:8]==b'ftyp':ext,mime='mp4','video/mp4'
            elif raw.startswith(b'ID3') or (len(raw)>2 and raw[0]==255 and raw[1]&224==224):ext,mime='mp3','audio/mpeg'
            if not ext:raise Problem('Допустимы PNG, JPEG, WEBP, MP4 и MP3. HTML и SVG не принимаются.')
            c.execute('BEGIN IMMEDIATE')
            size=c.execute('SELECT COALESCE(SUM(size),0) s FROM assets WHERE user_id=?',(uid,)).fetchone()['s']
            if size+len(raw)>MAX_QUOTA:raise Problem('Достигнут лимит 200 МБ для пилота.',413)
            asset_id=ident();filename=asset_id+'.'+ext;target=DATA/'uploads'/filename
            with target.open('xb') as f:f.write(raw)
            c.execute('INSERT INTO assets VALUES(?,?,?,?,?,?)',(asset_id,uid,filename,mime,len(raw),now()));c.commit();return {'url':'/media/'+filename,'size':len(raw)}
        if path=='export' and method=='GET':
            uid=self.require();site=c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone()
            return {'version':1,'exportedAt':now(),'site':clean_site(site),'posts':[clean_post(p) for p in c.execute('SELECT * FROM posts WHERE user_id=?',(uid,))],
                    'media':[{'url':'/media/'+a['filename'],'size':a['size'],'type':a['mime']} for a in c.execute('SELECT * FROM assets WHERE user_id=?',(uid,))]}
        if path=='catalog' and method=='GET':
            result=[]
            for row in c.execute('SELECT p.id,p.published,s.slug,s.published AS profile FROM posts p JOIN sites s ON s.user_id=p.user_id WHERE p.published IS NOT NULL AND s.published IS NOT NULL AND s.suspended=0 ORDER BY p.updated DESC LIMIT 150'):
                p=unpack(row['published'])
                if p['kind']=='book':result.append(public_meta(p,row['id'])|{'slug':row['slug'],'author':unpack(row['profile'])['name']})
            return {'books':result}
        match=re.fullmatch(r'public/([a-z0-9-]{3,40})(?:/post/([a-f0-9]{32}))?',path)
        if match and method=='GET':
            site=self.public_site(match[1]);profile=unpack(site['published']);common={'site':profile,**access(site)}
            if match[2]:
                row=c.execute('SELECT * FROM posts WHERE id=? AND user_id=? AND published IS NOT NULL',(match[2],site['user_id'])).fetchone()
                if not row:raise Problem('Публикация не найдена.',404)
                p=unpack(row['published'])
                try:chapter=int(self.query.get('chapter',['0'])[0])
                except ValueError:raise Problem('Некорректная глава.')
                if chapter<0 or chapter>=len(p['chapters']):raise Problem('Глава не найдена.',404)
                return common|{'post':public_meta(p,row['id']),'chapter':p['chapters'][chapter]}
            return common|{'posts':[public_meta(unpack(p['published']),p['id']) for p in c.execute('SELECT * FROM posts WHERE user_id=? AND published IS NOT NULL ORDER BY updated DESC',(site['user_id'],))]}
        if path=='reports' and method=='POST':
            if not REGISTRATION_OPEN and not LOCAL:raise Problem('Напишите на sy@syolana.com.',503)
            limit(c,'reports:'+ip,5,3600);data=self.body();url=safe_url(data.get('url'));email=email_value(data.get('email'));reason=plain(data.get('reason'),5000,'описание',True)
            if not url:raise Problem('Укажите адрес материала.')
            rid=ident();c.execute('INSERT INTO reports(id,url,email,reason,created) VALUES(?,?,?,?,?)',(rid,url,email,reason,now()));c.commit();return {'id':rid}
        if path=='admin/queue' and method=='GET':
            self.require(True);queue=[]
            for table,kind in [('sites','site'),('posts','post')]:
                for row in c.execute(f'SELECT t.*,u.email FROM {table} t JOIN users u ON u.id=t.user_id WHERE t.pending IS NOT NULL'):
                    queue.append({'type':kind,'id':row['user_id'] if kind=='site' else row['id'],'version':row['review_version'],'payload':unpack(row['pending']),'email':row['email']})
            return {'queue':queue,'reports':[dict(r) for r in c.execute('SELECT * FROM reports WHERE closed=0 ORDER BY created')]}
        if path=='admin/review' and method=='POST':
            admin=self.require(True);data=self.body();kind=data.get('type');decision=data.get('decision')
            if kind not in ('site','post') or decision not in ('approve','reject'):raise Problem('Некорректное решение.')
            table,column=('sites','user_id') if kind=='site' else ('posts','id')
            c.execute('BEGIN IMMEDIATE');row=c.execute(f'SELECT * FROM {table} WHERE {column}=?',(data.get('id'),)).fetchone()
            if not row or not row['pending'] or row['review_version']!=data.get('version'):raise Problem('Материал изменился. Обновите очередь.',409)
            note=plain(data.get('note',''),1000,'комментарий')
            if decision=='approve':
                c.execute(f"UPDATE {table} SET published=pending,pending=NULL,review_status='approved',review_note=? WHERE {column}=?",(note,data['id']))
                if kind=='site' and not row['trial_ends']:c.execute('UPDATE sites SET trial_ends=? WHERE user_id=?',(now()+7*86400,data['id']))
            else:c.execute(f"UPDATE {table} SET pending=NULL,review_status='rejected',review_note=? WHERE {column}=?",(note,data['id']))
            event(c,admin,'review_'+decision,data['id'],note);c.commit();return {'ok':True}
        match=re.fullmatch(r'admin/reports/([a-f0-9]{32})',path)
        if match and method=='POST':
            uid=self.require(True);c.execute('UPDATE reports SET closed=1 WHERE id=?',(match[1],));event(c,uid,'report_closed',match[1]);c.commit();return {'ok':True}
        if path=='admin/access' and method=='POST':
            uid=self.require(True);data=self.body();reason=plain(data.get('reason'),500,'основание',True);site=c.execute('SELECT * FROM sites WHERE slug=?',(data.get('slug'),)).fetchone()
            if not site:raise Problem('Автор не найден.',404)
            action=data.get('action')
            if action=='grant':
                days=data.get('days')
                if not isinstance(days,int) or not 1<=days<=366:raise Problem('Укажите от 1 до 366 дней.')
                c.execute('UPDATE sites SET paid_until=?,locked_until=COALESCE(locked_until,?) WHERE user_id=?',(max(now(),site['paid_until'] or 0,site['trial_ends'] or 0)+days*86400,now()+365*86400,site['user_id']))
            elif action in ('suspend','restore'):c.execute('UPDATE sites SET suspended=? WHERE user_id=?',(int(action=='suspend'),site['user_id']))
            else:raise Problem('Неизвестное действие.')
            event(c,uid,'access_'+action,site['user_id'],reason);c.commit();return {'ok':True}
        if path=='checkout' and method=='POST':
            uid=self.require();limit(c,'checkout:'+uid,15,3600)
            if not payment_ready():raise Problem('Онлайн-оплата пока не подключена.',503)
            site=c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone()
            if not site or not site['published'] or site['suspended']:raise Problem('Оплата доступна после одобрения страницы.',403)
            c.execute('BEGIN IMMEDIATE')
            row=c.execute("SELECT * FROM payments WHERE user_id=? AND state IN ('creating','pending') AND created>? ORDER BY created DESC LIMIT 1",(uid,now()-3600)).fetchone()
            if row:local_id=row['id']
            else:
                local_id=ident();c.execute("INSERT INTO payments(id,user_id,state,amount,created) VALUES(?,?,'creating',?,?)",(local_id,uid,price_for(site),now()))
            c.commit()
            if row and row['url']:return {'url':row['url']}
            amount=row['amount'] if row else price_for(site)
            payload={'amount':{'value':f'{amount/100:.2f}','currency':'RUB'},'capture':True,'confirmation':{'type':'redirect','return_url':ORIGIN+'/#/studio'},
                'description':'Syolana: доступ на один месяц','metadata':{'local_id':local_id,'user_id':uid},
                'receipt':{'customer':{'email':self.user['email']},'tax_system_code':int(os.environ['RECEIPT_TAX_SYSTEM_CODE']),
                  'items':[{'description':'Доступ к Syolana на один месяц','quantity':'1.00','amount':{'value':f'{amount/100:.2f}','currency':'RUB'},
                    'vat_code':int(os.environ['RECEIPT_VAT_CODE']),'payment_subject':'service','payment_mode':os.environ['RECEIPT_PAYMENT_MODE']}]}}
            p=provider_request('payments',payload,local_id);url=p.get('confirmation',{}).get('confirmation_url','');u=urlparse(url)
            if u.scheme!='https' or not any((u.hostname or '')==d or (u.hostname or '').endswith('.'+d) for d in ('yoomoney.ru','yookassa.ru')):raise Problem('Провайдер не вернул безопасную ссылку оплаты.',502)
            c.execute('UPDATE payments SET provider_id=?,state=?,url=? WHERE id=?',(p['id'],p['status'],url,local_id));c.commit();return {'url':url}
        if path=='webhooks/yookassa' and method=='POST':
            if not payment_ready():raise Problem('Платежи не подключены.',503)
            data=self.body();kind=data.get('event');obj=data.get('object',{});pid=obj.get('id','')
            if not re.fullmatch(r'[a-zA-Z0-9-]{10,64}',pid):raise Problem('Некорректный идентификатор.')
            # The incoming JSON is untrusted. No paid status is taken from it.
            if kind in ('payment.succeeded','payment.canceled'):
                p=provider_request('payments/'+pid)
                if p.get('id')!=pid:raise Problem('Идентификатор не совпадает.')
                if p.get('status')=='succeeded':apply_payment(c,p)
                elif p.get('status')=='canceled':
                    c.execute("UPDATE payments SET state='canceled' WHERE provider_id=? AND applied=0",(pid,));c.commit()
            elif kind=='refund.succeeded':
                refund=provider_request('refunds/'+pid)
                if refund.get('status')=='succeeded':
                    row=c.execute('SELECT * FROM payments WHERE provider_id=?',(refund.get('payment_id'),)).fetchone()
                    if row:
                        # Partial refund access is resolved manually, recorded and never silently double-applied.
                        event(c,row['user_id'],'refund_received',pid,js({'amount':refund.get('amount'),'payment':row['id']}));c.commit()
            return {'ok':True}
        if path=='learning-access' and method=='GET':
            uid=self.require();site=c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone()
            return {'active':bool(site and access(site)['active'])}
        match=re.fullmatch(r'premium/([a-z]{2})/(a2|b1|b2)/([a-z0-9-]+)',path)
        if match and method=='GET':
            uid=self.require();site=c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone()
            if not site or not access(site)['active']:raise Problem('Требуется активный доступ.',403)
            f=ROOT/'private_courses'/match[1]/match[2]/(match[3]+'.json')
            if not f.is_file():raise Problem('Этот урок ещё не опубликован.',404)
            return json.loads(f.read_text())
        raise Problem('Страница API не найдена.',404)

    def media(self):
        filename=self.path.removeprefix('/media/')
        if not re.fullmatch(r'[a-f0-9]{32}\.(png|jpg|webp|mp4|mp3)',filename):raise Problem('Файл не найден.',404)
        asset=self.c.execute('SELECT * FROM assets WHERE filename=?',(filename,)).fetchone()
        if not asset:raise Problem('Файл не найден.',404)
        owner=self.user and (self.user['id']==asset['user_id'] or self.user['role']=='admin')
        allowed=False
        if not owner:
            site=self.c.execute('SELECT * FROM sites WHERE user_id=?',(asset['user_id'],)).fetchone()
            if site and site['published'] and not site['suspended']:
                for row in self.c.execute('SELECT published FROM posts WHERE user_id=? AND published IS NOT NULL',(asset['user_id'],)):
                    p=unpack(row['published'])
                    if any(urlparse(p.get(k,'')).path==self.path for k in ('cover','mediaUrl')):allowed=True;break
        if not owner and not allowed:raise Problem('Файл недоступен.',404)
        return DATA/'uploads'/filename,asset['mime']

    def run(self):
        if self.path=='/api/export-site' and self.method=='GET':
            uid=self.require();limit(self.c,'export-site:'+uid,3,300)
            content=export_site(self.c,uid)
            self.headers.append(('Content-Disposition','attachment; filename="my-independent-site.zip"'))
            return 200,content,'application/zip'
        if self.path.startswith('/api/lessons/'):
            uid=self.require();site=self.c.execute('SELECT * FROM sites WHERE user_id=?',(uid,)).fetchone()
            if not site or not access(site)['active']:raise Problem('Требуется активный доступ.',403)
            key=self.path.removeprefix('/api/lessons/')
            if not re.fullmatch(r'[a-z]{2}/(a2|b1|b2)/(rules|words|practice)',key):raise Problem('Урок не найден.',404)
            file=PRIVATE_LESSONS/(key+'.html')
            if not file.is_file():raise Problem('Урок ещё не опубликован.',404)
            return 200,file.read_bytes(),'text/html; charset=utf-8'
        if self.path.startswith('/api/'):return 200,js(self.respond_api()).encode(),'application/json; charset=utf-8'
        if self.method not in ('GET','HEAD'):raise Problem('Метод не поддерживается.',405)
        if self.path.startswith('/media/'):path,mime=self.media()
        else:
            requested=self.path.lstrip('/') or 'index.html'
            path=(PUBLIC/requested).resolve()
            if not path.is_relative_to(PUBLIC.resolve()) or any(p.startswith('.') for p in Path(requested).parts):raise Problem('Файл не найден.',404)
            if not path.is_file():raise Problem('Файл не найден.',404)
            mime=mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
        if not path.is_file():raise Problem('Файл не найден.',404)
        size=path.stat().st_size;start=0;end=size-1;status=200
        # Range support is needed for mobile audio/video seeking.
        value=self.env.get('HTTP_RANGE','')
        if value and mime.startswith(('audio/','video/')):
            match=re.fullmatch(r'bytes=(\d+)-(\d*)',value)
            if not match:raise Problem('Некорректный диапазон.',416)
            start=int(match[1]);end=min(end,int(match[2])) if match[2] else end
            if start>end or start>=size:raise Problem('Диапазон недоступен.',416)
            status=206;self.headers.append(('Content-Range',f'bytes {start}-{end}/{size}'))
        self.headers.append(('Accept-Ranges','bytes'))
        with path.open('rb') as f:f.seek(start);content=f.read(end-start+1)
        return status,content,mime+('; charset=utf-8' if mime.startswith('text/') or mime in ('application/javascript','application/json') else '')

def application(env,start_response):
    app=None;headers=[]
    try:
        host=env.get('HTTP_HOST','')
        if host and host!=urlparse(ORIGIN).netloc:raise Problem('Недопустимый адрес сервера.',400)
        if not LOCAL and not SECURE:raise Problem('Для публикации требуется PUBLIC_ORIGIN с https://.',503)
        app=App(env);status,body,content_type=app.run();headers=app.headers
    except Problem as e:
        status=e.status;body=js({'error':e.message}).encode();content_type='application/json; charset=utf-8'
        if app:headers=app.headers
    except Exception:
        traceback.print_exc();status=500;body=js({'error':'Внутренняя ошибка. Попробуйте позже.'}).encode();content_type='application/json; charset=utf-8'
    finally:
        if app:app.c.close()
    security=[('Content-Type',content_type),('Content-Length',str(len(body))),('Cache-Control','no-store'),
      ('X-Content-Type-Options','nosniff'),('Referrer-Policy','strict-origin-when-cross-origin'),('X-Frame-Options','SAMEORIGIN' if app and app.path.startswith('/api/lessons/') or app and app.path.endswith('.html') else 'DENY'),
      ('Cross-Origin-Opener-Policy','same-origin'),('Permissions-Policy','camera=(), microphone=(), geolocation=()'),
      ('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; media-src 'self' https:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; frame-src 'self'; form-action 'self'")]
    if SECURE:security.append(('Strict-Transport-Security','max-age=31536000'))
    reasons={200:'OK',206:'Partial Content',400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',405:'Method Not Allowed',409:'Conflict',413:'Payload Too Large',415:'Unsupported Media Type',416:'Range Not Satisfiable',429:'Too Many Requests',451:'Unavailable For Legal Reasons',500:'Internal Server Error',502:'Bad Gateway',503:'Service Unavailable'}
    start_response(str(status)+' '+reasons.get(status,'Error'),security+headers)
    return [b'' if env.get('REQUEST_METHOD')=='HEAD' else body]

initialize()

if __name__=='__main__':
    from socketserver import ThreadingMixIn
    from wsgiref.simple_server import make_server,WSGIServer
    class ThreadServer(ThreadingMixIn,WSGIServer):daemon_threads=True
    port=int(os.environ.get('PORT','8787'))
    print('Syolana development server:',ORIGIN,flush=True)
    with make_server('127.0.0.1',port,application,server_class=ThreadServer) as httpd:httpd.serve_forever()
