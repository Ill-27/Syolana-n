"""Publish reviewed public files to the existing bucket with short-lived OIDC.

No account, key, bucket, paid server, ACL or billing setting is created here.
The IAM federation and bucket-scoped upload permission need one-time setup.
"""
import argparse
import concurrent.futures
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BUCKET = 'syolana-pilot-b1gugflkb4qcgf2vftor'
ORIGIN = f'https://{BUCKET}.website.yandexcloud.net/'
MANIFEST = '_deploy/site-version.json'
RUNTIME = {'access.js','audio.js','course.js','course.css','curriculum.js','presentation.js','trainers.js'}

def http(url, *, data=None, headers=None, method=None):
    request=urllib.request.Request(url,data=data,headers=headers or {},method=method)
    with urllib.request.urlopen(request,timeout=45) as response:return response.read()

def bundle():
    public=ROOT/'dist/public'
    if not (public/'index.html').is_file():raise RuntimeError('Build the public site first')
    for name in ('platform','launch','source','.github','private_lessons'):
        if (public/name).exists():raise RuntimeError('Private path in public bundle: '+name)
    for course in ('en-a2','es-a1'):
        folder=public/'courses'/course
        if folder.exists() and any(p.is_dir() or p.name not in RUNTIME for p in folder.iterdir()):
            raise RuntimeError('Paid course data must stay private: '+course)
    files={p.relative_to(public).as_posix():p for p in public.rglob('*') if p.is_file()}
    if any(p.is_symlink() for p in public.rglob('*')):raise RuntimeError('Symlink in bundle')
    if sum(p.stat().st_size for p in files.values())>1073741824:raise RuntimeError('Bundle is too large')
    # The demo must use the same Russian origin as the site.
    demo=public/'partner-demo/integration.json'
    if demo.is_file():
        config=json.loads(demo.read_text());config.update(coreUrl=ORIGIN+'partner-core.js',licenseEndpoint=ORIGIN+'partners/entitlements.json')
        demo.write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
        entitlements=public/'partners/entitlements.json'
        entitlements.write_text(json.dumps({'version':1,'partners':{'demo-partner':{'active':True,'allowedHosts':[BUCKET+'.website.yandexcloud.net'],'features':config['features']}}},ensure_ascii=False,indent=2)+'\n')
        files[entitlements.relative_to(public).as_posix()]=entitlements
    return files

def iam_token():
    service=os.environ.get('YC_SITE_SERVICE_ACCOUNT_ID','')
    if not re.fullmatch(r'[a-z0-9]{15,30}',service):raise RuntimeError('Missing service account setting')
    endpoint=os.environ.get('ACTIONS_ID_TOKEN_REQUEST_URL','')
    u=urllib.parse.urlsplit(endpoint)
    if u.scheme!='https' or not (u.hostname or '').endswith('.actions.githubusercontent.com'):
        raise RuntimeError('Expected the GitHub OIDC endpoint')
    query=urllib.parse.parse_qsl(u.query);query.append(('audience','https://github.com/Ill-27'))
    oidc_url=urllib.parse.urlunsplit((u.scheme,u.netloc,u.path,urllib.parse.urlencode(query),''))
    oidc=json.loads(http(oidc_url,headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}))['value']
    body=urllib.parse.urlencode({'grant_type':'urn:ietf:params:oauth:grant-type:token-exchange','requested_token_type':'urn:ietf:params:oauth:token-type:access_token','audience':service,'subject_token':oidc,'subject_token_type':'urn:ietf:params:oauth:token-type:id_token'}).encode()
    token=json.loads(http('https://auth.yandex.cloud/oauth/token',data=body,headers={'Content-Type':'application/x-www-form-urlencoded'},method='POST'))['access_token']
    return token

def publish(*,check=False,cloud_shell=False):
    files=bundle();sha=os.environ.get('SYOLANA_SOURCE_SHA','')
    hashes={key:hashlib.sha256(path.read_bytes()).hexdigest() for key,path in files.items()}
    if check:
        print(json.dumps({'publicFiles':len(files),'bytes':sum(p.stat().st_size for p in files.values()),'privateBoundary':'passed'}));return
    if not re.fullmatch(r'[a-f0-9]{40}',sha):raise RuntimeError('Missing reviewed source commit')
    repo=os.environ.get('SYOLANA_GITHUB_REPOSITORY','')
    if repo!='Ill-27/Syolana-n':raise RuntimeError('Unexpected source repository')
    latest=json.loads(http('https://api.github.com/repos/'+repo+'/git/ref/heads/main',headers={'Accept':'application/vnd.github+json'}))['object']['sha']
    if latest!=sha:print('A newer checked commit will publish this site; skipping the older build.');return
    old={}
    try:old=json.loads(http(ORIGIN+MANIFEST+'?current=1')).get('files',{})
    except urllib.error.HTTPError as e:
        if e.code!=404:raise
    except json.JSONDecodeError:
        # The existing website can return its HTML error page before its first manifest.
        old={}
    changed=[key for key in files if old.get(key)!=hashes[key]]
    if cloud_shell:
        current=json.loads(subprocess.run(['yc','storage','bucket','get','--name',BUCKET,'--full','--format','json'],check=True,capture_output=True,text=True).stdout)
        flags=current.get('anonymous_access_flags',{})
        if current.get('folder_id')!='b1gmi3vca1csrl1o3om7' or not flags.get('read') or flags.get('list') or flags.get('config_read'):
            raise RuntimeError('Unexpected existing bucket configuration')
        token=subprocess.run(['yc','iam','create-token'],check=True,capture_output=True,text=True).stdout.strip()
    else:token=iam_token()
    def upload(key,data,content_type,cache='no-cache'):
        url='https://storage.yandexcloud.net/'+BUCKET+'/'+urllib.parse.quote(key,safe='/')
        http(url,data=data,method='PUT',headers={'Authorization':'Bearer '+token,'Content-Type':content_type,'Cache-Control':cache})
    def one(key):
        kind=mimetypes.guess_type(key)[0] or 'application/octet-stream'
        if key.endswith(('.js','.mjs')):kind='text/javascript; charset=utf-8'
        if key.endswith('.css'):kind='text/css; charset=utf-8'
        if key.endswith('.html'):kind='text/html; charset=utf-8'
        upload(key,files[key].read_bytes(),kind)
    # New dependencies arrive before the entry pages. Jobs never run concurrently.
    assets=[k for k in changed if not k.endswith('.html')]
    pages=[k for k in changed if k.endswith('.html') and k!='index.html']
    for batch in (assets,pages):
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(one,batch))
    if 'index.html' in changed:one('index.html')
    manifest={'schema':'syolana.public-deployment.v1','sourceCommit':sha,'files':hashes}
    upload(MANIFEST,json.dumps(manifest,separators=(',',':')).encode(),'application/json')
    observed=json.loads(http(ORIGIN+MANIFEST+'?verify='+sha))
    if observed.get('sourceCommit')!=sha:raise RuntimeError('The public site still shows an older release')
    print(json.dumps({'status':'verified','sourceCommit':sha,'uploadedFiles':len(changed),'url':ORIGIN}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--cloud-shell',action='store_true');args=parser.parse_args()
    try:publish(check=args.check,cloud_shell=args.cloud_shell)
    except Exception as exc:
        # Identify the failing service without logging query strings, bodies or credentials.
        if isinstance(exc,urllib.error.HTTPError):
            detail=f'{urllib.parse.urlsplit(exc.url).hostname} returned HTTP {exc.code}'
        else:detail=str(exc)
        raise SystemExit(f'Publication failed: {type(exc).__name__}: {detail}')
