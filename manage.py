"""Administrative tasks. Never expose this script as an HTTP endpoint."""
import argparse, getpass, shutil, sqlite3, sys
from pathlib import Path
import server

p=argparse.ArgumentParser(description='Syolana administration')
sub=p.add_subparsers(dest='command',required=True)
for name in ('create-admin','reset-password'):
    cmd=sub.add_parser(name);cmd.add_argument('email')
backup=sub.add_parser('backup');backup.add_argument('destination')
prune=sub.add_parser('prune');prune.add_argument('--days',type=int,default=30)
args=p.parse_args()
if args.command in ('create-admin','reset-password'):
    email=server.email_value(args.email)
    password=getpass.getpass('Новый пароль (минимум 10 символов): ')
    if len(password)<10 or password!=getpass.getpass('Повторите пароль: '):sys.exit('Пароли не совпадают или слишком короткие.')
    with server.db() as c:
        if args.command=='create-admin':
            if c.execute('SELECT 1 FROM users WHERE email=?',(email,)).fetchone():sys.exit('Пользователь уже существует; роль автоматически не изменяется.')
            c.execute("INSERT INTO users(id,email,password,role,terms_version,created) VALUES(?,?,?,'admin',?,?)",(server.ident(),email,server.password_hash(password),server.TERMS_VERSION,server.now()))
        else:
            u=c.execute('SELECT id FROM users WHERE email=?',(email,)).fetchone()
            if not u:sys.exit('Пользователь не найден.')
            c.execute('UPDATE users SET password=? WHERE id=?',(server.password_hash(password),u['id']))
            c.execute('DELETE FROM sessions WHERE user_id=?',(u['id'],))
            server.event(c,u['id'],'password_reset_by_operator')
    print('Готово.')
elif args.command=='backup':
    dest=Path(args.destination).resolve()
    if dest.exists():sys.exit('Укажите новый пустой путь для резервной копии.')
    dest.mkdir(parents=True,mode=0o700)
    with server.db() as source, sqlite3.connect(dest/'syolana.sqlite3') as target:source.backup(target)
    shutil.copytree(server.DATA/'uploads',dest/'uploads')
    print('Создана резервная копия. Храните её в защищённом месте вне основного сервера.')
elif args.command=='prune':
    if args.days<7:sys.exit('Минимальный срок хранения неиспользуемых файлов — 7 дней.')
    removed=0
    with server.db() as c:
        references='\n'.join(str(r[k] or '') for table in ('posts','sites') for r in c.execute('SELECT draft,pending,published FROM '+table) for k in ('draft','pending','published'))
        for a in c.execute('SELECT * FROM assets WHERE created<?',(server.now()-args.days*86400,)).fetchall():
            if a['filename'] not in references:
                (server.DATA/'uploads'/a['filename']).unlink(missing_ok=True);c.execute('DELETE FROM assets WHERE id=?',(a['id'],));removed+=1
        c.execute('DELETE FROM sessions WHERE expires<?',(server.now(),))
    print('Неиспользуемых файлов удалено:',removed)
