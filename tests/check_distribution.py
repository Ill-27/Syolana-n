"""Validate the published website without rebuilding its private sources."""
import base64
import json
from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
roots = ('artivid', 'partner-demo', 'courses', 'themes', 'assets', 'owner-vault', 'runtime', 'partner', 'studio', 'editor')
files = list(root.glob('*.*')) + [p for name in roots for p in (root / name).rglob('*') if p.is_file()]
if '--javascript' in sys.argv:
    for path in sorted(set(files)):
        if path.suffix in ('.js', '.mjs'):
            print(path)
    raise SystemExit

def read(name):
    return json.loads((root / name).read_text(encoding='utf-8'))

assert '<base href="./"' in (root / 'index.html').read_text(), 'Website must support its project address'
for name in ('boot.js', 'api-transport.js', 'local-workshop.mjs', 'site-export.mjs', 'assets/vendor/three.module.min.js', 'assets/vendor/three-LICENSE.txt'):
    assert (root / name).is_file(), name
for path in files:
    if path.suffix == '.json':
        json.loads(path.read_text(encoding='utf-8'))

themes = read('themes/manifest.json')
assert len(themes) == 7 and len({theme['id'] for theme in themes}) == 7
for theme in themes:
    path = (root / 'themes' / theme['module']).resolve()
    assert path.is_relative_to(root) and path.is_file(), theme['module']
    assert theme['preview'].startswith('linear-gradient(')
for name in ('themes/manifest.json', 'themes/sky-camera.mjs', 'themes/sea-motion.mjs', 'themes/leaf-motion.mjs'):
    assert (root / name).read_bytes() == (root / 'artivid' / name).read_bytes(), name

manifest = read('owner-vault/manifest.json')
assert manifest['schema'] == 'syolana.owner-vault.v1' and manifest['iterations'] == 250000
assert len(base64.b64decode(manifest['salt'], validate=True)) == 32
assert len(base64.b64decode(manifest['iv'], validate=True)) == 12
assert len(base64.b64decode(manifest['ciphertext'], validate=True)) > 16
assert 'contentKey' not in manifest and 'key' not in manifest
for course in ('en-a2', 'es-a1', 'es-a2', 'fr-a1'):
    assert not (root / 'courses' / course / 'data.json').exists(), course
    record = read('owner-vault/' + course + '.json')
    assert record['schema'] == 'syolana.course.aesgcm.v1' and record['course'] == course
    assert len(base64.b64decode(record['ciphertext'], validate=True)) > 1000
    assert 'lessons' not in record and 'contentKey' not in record

access = read('access-service.json')
assert isinstance(access['ready'], bool)
assert not access['ready'] or access['origin'].startswith('https://')
assert read('artivid/access-service.json') == access
songs = read('song-details.json')
assert len(songs['songs']) == 3 and songs['rightsNote']
assert '__RELEASE__' not in (root / 'sw.js').read_text(), 'Service worker release must be sealed'
print('PASS: seven themes, both applications, protected courses, song metadata and published assets')
