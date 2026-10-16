import hashlib,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('sync_checked_public',Path(__file__).with_name('sync_checked_public.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class MirrorTest(unittest.TestCase):
 def test_public_allowlist_never_touches_private_code_atlas_or_paid_course_data(self):
  for name in ['../x','/index.html','.github/workflows/a.yml','source/secret.py','personal-atlas/index.html','courses/en-a2/data.json','courses/fr-a2/data.json.gz','hosting.json','key-reserve.json','scripts/x.py']:
   self.assertFalse(m.approved(name),name)
  for name in ['index.html','access-service.json','licensed-design.js','courses/en-a2/course.js','assets/fonts/a.woff2','themes/new-world.mjs']:
   self.assertTrue(m.approved(name),name)
 def fixture(self,root,broken=False):
  files={'index.html':b'new page','access-service.json':b'{}','licensed-design.js':b'new design'}
  hashes={p:hashlib.sha256(v).hexdigest() for p,v in files.items()}
  manifest=json.dumps({'sourceCommit':m.FIRST_SOURCE,'files':hashes}).encode()
  def get(name,limit=m.MAX_FILE):
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
if __name__=='__main__':unittest.main()
