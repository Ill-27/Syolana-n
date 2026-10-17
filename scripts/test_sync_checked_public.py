import hashlib,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('sync_checked_public',Path(__file__).with_name('sync_checked_public.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class MirrorTest(unittest.TestCase):
 def test_public_allowlist_never_touches_private_code_atlas_or_paid_course_data(self):
  for name in ['../x','/index.html','.github/workflows/a.yml','source/secret.py','personal-atlas/index.html','courses/en-a2/data.json','courses/fr-a2/data.json.gz','courses/private.json','courses/en-a2/private/access.js','courses/unreviewed/access.js','hosting.json','key-reserve.json','scripts/x.py','partners/core-version.json','partners/entitlements.json','legal-info/index.html']:
   self.assertFalse(m.approved(name),name)
  for name in ['index.html','access-service.json','licensed-design.js','courses/en-a2/course.js','courses/subscription-access.js','courses/payment-ui.js','courses/single-tab.js','courses/partner-registry-ui.js','assets/fonts/a.woff2','themes/new-world.mjs']:
   self.assertTrue(m.approved(name),name)
 def fixture(self,root,broken=False):
  files={'index.html':b'new page','access-service.json':b'{}','licensed-design.js':b'new design'}
  hashes={p:hashlib.sha256(v).hexdigest() for p,v in files.items()}
  manifest=json.dumps({'sourceCommit':m.FIRST_SOURCE,'files':hashes}).encode()
  def get(name,limit=m.MAX_FILE,**kwargs):
   return (manifest if name.startswith('_deploy/') else b'bad' if broken else files[name]),{'Last-Modified':'Fri, 16 Oct 2026 08:00:00 GMT'}
  return get
 def test_checksum_failure_keeps_existing_files_and_next_release_is_verified(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);(root/'index.html').write_text('before')
   with patch.object(m,'get',self.fixture(root,True)):
    with self.assertRaises(ValueError):m.sync(root)
   self.assertEqual((root/'index.html').read_text(),'before');self.assertFalse((root/m.STATE).exists())
   with patch.object(m,'get',self.fixture(root)):
    self.assertTrue(m.sync(root));self.assertFalse(m.sync(root))
   self.assertEqual((root/'index.html').read_text(),'new page')
 def test_disclosure_remains_accessible_without_copying_personal_text_into_the_mirror(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);calls=[]
   files={'index.html':b'page','access-service.json':b'{}','licensed-design.js':b'design',m.DISCLOSURE:b'personal disclosure content'}
   receipt=json.dumps({'sourceCommit':m.FIRST_SOURCE,'files':{name:hashlib.sha256(data).hexdigest() for name,data in files.items()}}).encode()
   def get(name,*args,**kwargs):
    calls.append(name);return (receipt if name.startswith('_deploy/') else files[name]),{'Last-Modified':'Fri, 16 Oct 2026 08:00:00 GMT'}
   with patch.object(m,'get',get):self.assertTrue(m.sync(root))
   actual=(root/m.DISCLOSURE).read_bytes();self.assertEqual(actual,m.DISCLOSURE_SHELL);self.assertIn(b'noindex',actual);self.assertIn(b'<iframe',actual);self.assertNotIn(b'personal disclosure content',actual);self.assertNotIn(m.DISCLOSURE,calls)
 def test_same_release_repairs_previously_omitted_shared_course_modules(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);calls=[]
   files={'index.html':b'page','access-service.json':b'{}','licensed-design.js':b'design',**{'courses/'+name:('checked '+name).encode() for name in m.SHARED_COURSE_FILES}}
   hashes={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
   (root/m.STATE).parent.mkdir();(root/m.STATE).write_text(json.dumps({'sourceCommit':m.FIRST_SOURCE,'lastModified':1792137600,'files':{}}))
   receipt=json.dumps({'sourceCommit':m.FIRST_SOURCE,'files':hashes}).encode()
   def get(name,*args,**kwargs):
    calls.append(name);return (receipt if name.startswith('_deploy/') else files[name]),{'Last-Modified':'Fri, 16 Oct 2026 08:00:00 GMT'}
   with patch.object(m,'get',get):
    self.assertTrue(m.sync(root));self.assertFalse(m.sync(root))
   for name in m.SHARED_COURSE_FILES:self.assertEqual((root/'courses'/name).read_bytes(),files['courses/'+name])
   self.assertEqual(json.loads((root/m.STATE).read_text())['mirrorPolicyVersion'],m.MIRROR_POLICY_VERSION)
if __name__=='__main__':unittest.main()

