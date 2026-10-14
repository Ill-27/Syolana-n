"""Build the public snapshot without copying repository or private state."""
from pathlib import Path
import shutil, subprocess, hashlib
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'dist/public'
FILES=['index.html', 'app.js', 'api.js', 'api-transport.js', 'boot.js', 'catalog.js', 'content.js', 'content-i18n.js', 'content-i18n-loader.js', 'copy-polish.js', 'course-api-bridge.js', 'course-branding.css', 'course-branding.js', 'course-branding.json', 'course-protection.js', 'course-trial-warning.js', 'device-access.js', 'discovery.js', 'feed.js', 'feed.json', 'flight.js', 'i18n.js', 'interface-translations.json', 'language-switcher.js', 'legacy-bridge.js', 'legacy-embed.css', 'legacy-redirect.js', 'local-workshop.mjs', 'managed-sites.css', 'managed-sites.js', 'owner-vault.mjs', 'partner-core.css', 'partner-core.js', 'player.js', 'polish.css', 'polish.js', 'positioning.js', 'public-data.js', 'public-polish.js', 'reader-translations.json', 'reader-ui.js', 'refinements.js', 'render-ui.js', 'heading-layout.js', 'site-export.mjs', 'sketch-builder.js', 'sketch-model.mjs', 'song-details.json', 'startup.css', 'studio.js', 'styles.css', 'sw.js', 'theme-embed.html', 'theme-loaders.js', 'theme-start.js', 'theme-sound.js', 'themes.js', 'utils.js', 'workspace.css', 'config.json', 'access-service.json', 'robots.txt', 'CNAME', 'a1-english.html', 'a2-english.html', 'a1-spanish.html', 'a2-spanish.html', 'a1-french.html', 'a2-french.html', 'pexample.html']
DIRECTORIES=['assets','themes','courses','owner-vault','español-songs','partner-demo','partners','artivid','legacy-scripts','runtime','personal-atlas','partner','studio','editor']
FILES.extend(['attribution-guard.js', 'licensed-design.js', 'scene-audio.js', 'trust-ui.js', 'brand-effects.js', 'owner-sites.js', 'owner-registry-store.mjs', 'partner-brand-banner.js', 'partner-brand-banner.css'])
def build():
 if OUT.parent.is_symlink():raise RuntimeError('Invalid build directory')
 if OUT.parent.exists():shutil.rmtree(OUT.parent)
 OUT.mkdir(parents=True)
 for name in FILES:
  if (ROOT/name).is_file():shutil.copy2(ROOT/name,OUT/name)
 for name in DIRECTORIES:
  if (ROOT/name).is_dir():shutil.copytree(ROOT/name,OUT/name)
 for course in ['en-a2','es-a1','es-a2','fr-a1','fr-a2']:
  if (OUT/'courses'/course/'data.json').exists():raise RuntimeError('Private data in public snapshot')
 subprocess.run(['node',str(ROOT/'scripts/build_runtime.mjs')],check=True)
 release=hashlib.sha256(b''.join(p.read_bytes() for p in sorted(OUT.rglob('*')) if p.is_file() and p.name!='sw.js')).hexdigest()[:16]
 worker=OUT/'sw.js';worker.write_text(worker.read_text().replace('__RELEASE__',release))
 print('Public snapshot built')
if __name__=='__main__':build()
