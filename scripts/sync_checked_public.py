"""Mirror the checked public website; never downloads private source or courses."""
import concurrent.futures
import email.utils
import gzip
import io
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import tempfile
import urllib.parse
import urllib.request

ORIGIN='https://syolana-pilot-b1gugflkb4qcgf2vftor.website.yandexcloud.net/'
FIRST_SOURCE='1f24cf42c8d0e8edf5b5cd8a2c960bbd52e4c7b8'
STATE='_deploy/checked-source.json'
FOLDERS={'assets','themes','courses','owner-vault','español-songs','partner-demo','partners','legacy-scripts','runtime','partner','studio','editor','course-packages','audio-library'}
ROOT_TYPES={'.html','.css','.js','.mjs','.json','.txt','.svg','.ico'}
MAX_FILE=32*1024*1024

def approved(name):
    path=PurePosixPath(name)
    if not name or path.is_absolute() or '..' in path.parts or str(path)!=name or '\\' in name:return False
    if any(part.startswith('.') for part in path.parts):return False
    if len(path.parts)==1:
        return path.suffix in ROOT_TYPES and name not in {'key-reserve.json','hosting.json','package.json','package-lock.json'}
    if path.parts[0] not in FOLDERS:return False
    if path.parts[0]=='courses' and (len(path.parts)<3 or path.parts[1]!='en-a1'):
        return path.name in {'access.js','audio.js','course.js','course.css','curriculum.js','presentation.js','trainers.js'}
    return path.suffix in ROOT_TYPES|{'.png','.jpg','.jpeg','.webp','.woff','.woff2','.ogg','.mp3','.m4a','.aac','.wav','.syolicense'}

def get(name,limit=MAX_FILE,revision=""):
    url=ORIGIN+urllib.parse.quote(name,safe='/')+('?v='+urllib.parse.quote(revision,safe='') if revision else '')
    req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=40) as response:
        if urllib.parse.urlsplit(response.url).netloc!=urllib.parse.urlsplit(ORIGIN).netloc:raise ValueError('Unexpected redirect')
        raw=response.read(limit+1)
        if len(raw)>limit:raise ValueError('Public file exceeds limit')
        encoding=response.headers.get('Content-Encoding','').lower()
        if encoding=='gzip':
            with gzip.GzipFile(fileobj=io.BytesIO(raw)) as stream:raw=stream.read(limit+1)
        elif encoding not in ('','identity'):raise ValueError('Unexpected public encoding')
        if len(raw)>limit:raise ValueError('Decoded public file exceeds limit')
        return raw,response.headers

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None

def sync(root):
    root=Path(root).resolve();state_path=root/STATE
    old=json.loads(state_path.read_text()) if state_path.is_file() else {}
    raw,headers=get('_deploy/site-version.json',2*1024*1024);manifest=json.loads(raw)
    source=manifest.get('sourceCommit','')
    if not re.fullmatch(r'[0-9a-f]{40}',source):raise ValueError('Missing checked source')
    modified=int(email.utils.parsedate_to_datetime(headers['Last-Modified']).timestamp())
    if old.get('sourceCommit')==source:return False
    if not old and source!=FIRST_SOURCE:
        print('Waiting for the first reviewed source to finish publication.');return False
    if old and modified<=old['lastModified']:return False
    hashes=manifest.get('files')
    if not isinstance(hashes,dict) or len(hashes)>5000:raise ValueError('Invalid public manifest')
    cleanup=manifest.get('cleanup',{})
    retired=set(manifest.get('retired',[])+manifest.get('retiredThemeFiles',[])+cleanup.get('deleted',[])+cleanup.get('replaced',[]))
    selected={name:value for name,value in hashes.items() if approved(name) and name not in retired}
    if not {'index.html','access-service.json','licensed-design.js'}<=selected.keys():raise ValueError('Incomplete public release')
    if any(not re.fullmatch(r'[0-9a-f]{64}',value) for value in selected.values()):raise ValueError('Invalid public checksum')
    changes={name:value for name,value in selected.items() if digest(root/name)!=value}
    for name in changes:
        previous=old.get('files',{}).get(name)
        if previous and digest(root/name) not in (previous,None):
            raise ValueError('Public changes need review before replacing '+name)
        target=root/name
        if target.is_symlink() or any(parent.is_symlink() for parent in target.parents):raise ValueError('Symlink in public target')
    with tempfile.TemporaryDirectory() as temporary:
        staging=Path(temporary)
        def download(item):
            name,expected=item;data,_=get(name,revision=expected)
            if hashlib.sha256(data).hexdigest()!=expected:raise ValueError('Public checksum mismatch: '+name)
            target=staging/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
            return len(data)
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            total=sum(pool.map(download,changes.items()))
        if total>256*1024*1024:raise ValueError('Public release exceeds limit')
        # A second receipt prevents mixing two releases during publication.
        latest=json.loads(get('_deploy/site-version.json',2*1024*1024)[0])
        if latest.get('sourceCommit')!=source:raise ValueError('A newer release is being published; retry later')
        for name in changes:
            target=root/name;target.parent.mkdir(parents=True,exist_ok=True);os.replace(staging/name,target)
    state_path.parent.mkdir(exist_ok=True)
    state_path.write_text(json.dumps({'sourceCommit':source,'lastModified':modified,'files':selected},sort_keys=True)+'\n')
    print('Checked public release prepared:',source,'files:',len(changes))
    return True

if __name__=='__main__':
    changed=sync(Path.cwd())
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'],'a') as output:output.write('changed='+str(changed).lower()+'\n')
