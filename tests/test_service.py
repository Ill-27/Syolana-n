"""Run: python3 -m unittest discover -s tests -v (isolated temporary database)."""
import os,tempfile
TEMP=tempfile.TemporaryDirectory()
os.environ['DATA_DIR']=TEMP.name
os.environ['PUBLIC_ORIGIN']='http://127.0.0.1:8787'
os.environ['REGISTRATION_OPEN']='1'
import base64,io,json,unittest
from unittest.mock import patch
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"platform"))
import server as s

class Client:
 def __init__(self):self.cookie='';self.csrf=''
 def call(self,path,body=None,method=None,origin=True,csrf=True):
  raw=json.dumps(body).encode() if body is not None else b''
  path,_,query=path.partition('?')
  env={'REQUEST_METHOD':method or ('POST' if body is not None else 'GET'),'PATH_INFO':path,'QUERY_STRING':query,'CONTENT_TYPE':'application/json','CONTENT_LENGTH':str(len(raw)),'wsgi.input':io.BytesIO(raw),'HTTP_HOST':'127.0.0.1:8787','REMOTE_ADDR':'127.0.0.1','HTTP_COOKIE':self.cookie}
  if origin:env['HTTP_ORIGIN']=s.ORIGIN
  if csrf:env['HTTP_X_CSRF_TOKEN']=self.csrf
  out={}
  def start(status,headers):out['status']=int(status.split()[0]);out['headers']=dict(headers)
  data=b''.join(s.application(env,start))
  if 'Set-Cookie'in out['headers']:self.cookie=out['headers']['Set-Cookie'].split(';')[0]
  try:result=json.loads(data)
  except ValueError:result=data
  if isinstance(result,dict)and'csrf'in result:self.csrf=result['csrf']
  return out['status'],result

class ServiceTests(unittest.TestCase):
 def setUp(self):
  with s.db() as c:
   for table in ('events','payments','assets','posts','sites','sessions','reports','rate_limits','users'):c.execute('DELETE FROM '+table)
   c.execute("INSERT INTO users(id,email,password,role,created) VALUES('admin','admin@example.test',?,'admin',?)",(s.password_hash('local-admin-password'),s.now()))
  self.admin=Client();self.assertEqual(self.admin.call('/api/auth/login',{'email':'admin@example.test','password':'local-admin-password'})[0],200)
  self.a=Client();self.b=Client();self.register(self.a,'one');self.register(self.b,'two')
 def register(self,client,name):
  code,data=client.call('/api/auth/register',{'email':name+'@example.test','password':'long-test-password','agreed':True,'termsVersion':s.TERMS_VERSION});self.assertEqual(code,200);return data
 def site(self,client,slug):
  code,data=client.call('/api/site',{'name':'Автор '+slug,'slug':slug,'category':'Писатель','bio':'О моём творчестве','link':''});self.assertEqual(code,200)
 def post(self,client,title='Книга'):
  code,data=client.call('/api/posts',{'title':title,'description':'описание','kind':'book','chapters':[{'title':'Глава 1','text':'Текст <script>alert(1)</script> остаётся текстом.','mood':'auto'}],'cover':'','mediaUrl':''});self.assertEqual(code,200);return data['id']
 def approve_all(self):
  code,q=self.admin.call('/api/admin/queue');self.assertEqual(code,200)
  for row in q['queue']:
   self.assertEqual(self.admin.call('/api/admin/review',{'type':row['type'],'id':row['id'],'version':row['version'],'decision':'approve','note':''})[0],200)
 def test_trial_starts_on_approval(self):
  self.site(self.a,'author-one');_,before=self.a.call('/api/studio');self.assertIsNone(before['site']['trial_ends']);self.assertFalse(before['active']);self.approve_all();_,after=self.a.call('/api/studio');self.assertTrue(after['active']);self.assertAlmostEqual(after['site']['trial_ends']-s.now(),7*86400,delta=3)
 def test_tenant_isolation(self):
  self.site(self.a,'author-one');self.site(self.b,'author-two');pid=self.post(self.a)
  payload={'id':pid,'title':'Hacked','description':'','kind':'book','chapters':[{'title':'x','text':'x','mood':'neutral'}]}
  self.assertEqual(self.b.call('/api/posts',payload)[0],404);self.assertEqual(self.b.call('/api/posts/'+pid+'/submit',{'rights':True})[0],404)
  self.assertEqual(self.b.call('/api/studio')[1]['posts'],[])
 def test_csrf_and_origin(self):
  self.assertEqual(self.a.call('/api/site',{},csrf=False)[0],403);self.assertEqual(self.a.call('/api/site',{},origin=False)[0],403)
 def test_publication_moderation_snapshot(self):
  self.site(self.a,'author-one');pid=self.post(self.a);self.a.call('/api/posts/'+pid+'/submit',{'rights':True})
  # The author edits a draft after submitting; the pending snapshot is preserved.
  self.a.call('/api/posts',{'id':pid,'title':'Поздний черновик','description':'','kind':'book','chapters':[{'title':'Новая глава','text':'неодобренный текст','mood':'auto'}]})
  self.approve_all();code,public=Client().call('/api/public/author-one/post/'+pid);self.assertEqual(code,200);self.assertEqual(public['post']['title'],'Книга');self.assertIn('<script>',public['chapter']['text']);self.assertNotIn('неодобренный',str(public))
 def test_stale_review_conflict(self):
  self.site(self.a,'author-one');q=self.admin.call('/api/admin/queue')[1]['queue'][0];self.site(self.a,'author-one')
  self.assertEqual(self.admin.call('/api/admin/review',{'type':'site','id':q['id'],'version':q['version'],'decision':'approve','note':''})[0],409)
 def test_expiry_preserves_published_text(self):
  self.site(self.a,'author-one');pid=self.post(self.a);self.a.call('/api/posts/'+pid+'/submit',{'rights':True});self.approve_all()
  with s.db() as c:c.execute('UPDATE sites SET trial_ends=?,paid_until=NULL',(s.now()-1,))
  code,pub=Client().call('/api/public/author-one/post/'+pid);self.assertEqual(code,200);self.assertFalse(pub['active']);self.assertIn('Текст',pub['chapter']['text'])
 def test_premium_server_gate(self):
  self.assertEqual(Client().call('/api/premium/en/a2/test')[0],401);self.assertEqual(self.a.call('/api/premium/en/a2/test')[0],403);self.assertEqual(Client().call('/private_courses/en/a2/test.json')[0],404)
 def test_existing_paid_lessons_require_access(self):
  self.assertEqual(Client().call('/api/lessons/es/a2/rules')[0],401)
  self.assertEqual(self.a.call('/api/lessons/es/a2/rules')[0],403)
  self.site(self.a,'author-one');self.approve_all()
  status,body=self.a.call('/api/lessons/es/a2/rules');self.assertEqual(status,200)
  self.assertIn(b'legacy-bridge.js',body);self.assertNotIn(b'<script>',body)
  with s.db() as c:c.execute('UPDATE sites SET trial_ends=?,paid_until=NULL',(s.now()-1,))
  self.assertEqual(self.a.call('/api/lessons/es/a2/rules')[0],403)
  status,body=Client().call('/a2-spanish-rules.html');self.assertEqual(status,200)
  self.assertLess(len(body),1000);self.assertIn(b'legacy-redirect',body)
  self.assertEqual(Client().call('/private_lessons/es/a2/rules.html')[0],404)
 def test_original_non_ascii_media_paths(self):
  path='/español-songs/qué_es_poesía.mp3'
  # PEP3333 represents decoded UTF-8 path bytes as Latin-1 in WSGI environ.
  status,body=Client().call(path.encode('utf-8').decode('latin1'))
  self.assertEqual(status,200);self.assertGreater(len(body),100000)
 def test_admin_authorization(self):self.assertEqual(self.a.call('/api/admin/queue')[0],403)
 def test_upload_checks_and_privacy(self):
  self.site(self.a,'author-one')
  self.assertEqual(self.a.call('/api/assets',{'name':'evil.svg','data':base64.b64encode(b'<svg onload="evil()"/>').decode()})[0],400)
  png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
  code,a=self.a.call('/api/assets',{'name':'test.png','data':base64.b64encode(png).decode()});self.assertEqual(code,200);self.assertEqual(Client().call(a['url'])[0],404);self.assertEqual(self.a.call(a['url'])[0],200);self.assertEqual(self.b.call(a['url'])[0],404)
 def test_suspension(self):
  self.site(self.a,'author-one');self.approve_all();self.admin.call('/api/admin/access',{'slug':'author-one','action':'suspend','reason':'обоснованная жалоба'})
  self.assertEqual(Client().call('/api/public/author-one')[0],451);self.assertEqual(self.a.call('/api/export')[0],200)
 def test_payment_defaults_off(self):
  self.assertFalse(Client().call('/api/status')[1]['paymentsEnabled']);self.assertEqual(self.a.call('/api/checkout',{})[0],503)
 def test_payment_verification_and_idempotency(self):
  self.site(self.a,'author-one');self.approve_all();uid=self.a.call('/api/session')[1]['user']['id'];local=s.ident();pid='test-payment-id-1234'
  with s.db() as c:c.execute("INSERT INTO payments(id,user_id,state,amount,created) VALUES(?,?,'pending',100000,?)",(local,uid,s.now()))
  p={'id':pid,'status':'succeeded','paid':True,'test':False,'amount':{'value':'1000.00','currency':'RUB'},'metadata':{'local_id':local,'user_id':uid},'recipient':{'account_id':'shop-test'}}
  with patch.dict(os.environ,{'YOOKASSA_SHOP_ID':'shop-test'}):
   with s.db() as c:s.apply_payment(c,p)
   first=self.a.call('/api/studio')[1]['site']['paid_until']
   with s.db() as c:s.apply_payment(c,p)
   self.assertEqual(self.a.call('/api/studio')[1]['site']['paid_until'],first)
   bad=dict(p,amount={'value':'1.00','currency':'RUB'})
   with s.db() as c:
    with self.assertRaises(s.Problem):s.apply_payment(c,bad)
 def test_webhook_payload_not_trusted(self):
  self.site(self.a,'author-one');self.approve_all();uid=self.a.call('/api/session')[1]['user']['id'];local=s.ident();pid='fake-payment-id-1234'
  with s.db() as c:c.execute("INSERT INTO payments(id,user_id,state,amount,created) VALUES(?,?,'pending',100000,?)",(local,uid,s.now()))
  spoof={'event':'payment.succeeded','object':{'id':pid,'paid':True,'amount':{'value':'1000.00','currency':'RUB'}}}
  with patch.object(s,'payment_ready',return_value=True),patch.object(s,'provider_request',return_value={'id':pid,'status':'pending','paid':False}) as verify:
   self.assertEqual(Client().call('/api/webhooks/yookassa',spoof,origin=False)[0],200);verify.assert_called_once_with('payments/'+pid)
  self.assertIsNone(self.a.call('/api/studio')[1]['site']['paid_until'])
 def test_source_files_never_public(self):
  for path in ['/server.py','/.env','/../server.py','/data/syolana.sqlite3']:
   self.assertEqual(Client().call(path)[0],404)
 def test_portable_export_is_private_and_safe(self):
  import zipfile
  self.site(self.a,'author-one');self.post(self.a)
  self.assertEqual(Client().call('/api/export-site')[0],401)
  code,raw=self.a.call('/api/export-site');self.assertEqual(code,200)
  with zipfile.ZipFile(io.BytesIO(raw)) as z:
   books=[n for n in z.namelist() if n.endswith('.html') and n!='index.html'];self.assertEqual(len(books),1)
   html=z.read(books[0]).decode();self.assertIn('&lt;script&gt;',html);self.assertNotIn('<script>',html);self.assertNotIn('syolana.com',html)
 def test_locked_price_survives_new_public_price(self):
  self.site(self.a,'author-one')
  with s.db() as c:
   c.execute('UPDATE sites SET locked_until=?,locked_price=100000',(s.now()+86400,));row=c.execute('SELECT * FROM sites').fetchone()
   with patch.object(s,'PRICE',200000):self.assertEqual(s.price_for(row),100000)

if __name__=='__main__':unittest.main()
