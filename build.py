"""Build the public snapshot without copying repository or private state."""
from pathlib import Path
import shutil, subprocess, hashlib, re
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'dist/public'
FILES=['index.html', 'app.js', 'api.js', 'api-transport.js', 'boot.js', 'catalog.js', 'content.js', 'content-i18n.js', 'content-i18n-loader.js', 'copy-polish.js', 'course-api-bridge.js', 'course-branding.css', 'course-branding.js', 'course-branding.json', 'course-protection.js', 'course-trial-warning.js', 'device-access.js', 'discovery.js', 'feed.js', 'feed.json', 'flight.js', 'i18n.js', 'interface-translations.json', 'language-switcher.js', 'legacy-bridge.js', 'legacy-embed.css', 'legacy-redirect.js', 'local-workshop.mjs', 'managed-sites.css', 'managed-sites.js', 'owner-vault.mjs', 'partner-core.css', 'partner-core.js', 'player.js', 'polish.css', 'polish.js', 'positioning.js', 'public-data.js', 'public-polish.js', 'reader-translations.json', 'reader-ui.js', 'refinements.js', 'render-ui.js', 'heading-layout.js', 'site-export.mjs', 'sketch-builder.js', 'sketch-model.mjs', 'song-details.json', 'startup.css', 'studio.js', 'styles.css', 'sw.js', 'theme-embed.html', 'theme-loaders.js', 'theme-start.js', 'theme-sound.js', 'themes.js', 'utils.js', 'workspace.css', 'config.json', 'access-service.json', 'robots.txt', 'CNAME', 'a1-english.html', 'a2-english.html', 'a1-spanish.html', 'a2-spanish.html', 'a1-french.html', 'a2-french.html', 'pexample.html']
DIRECTORIES=['assets','themes','courses','owner-vault','español-songs','partner-demo','partners','artivid','legacy-scripts','runtime','personal-atlas','partner','studio','editor']
FILES.extend(['attribution-guard.js', 'licensed-design.js', 'scene-audio.js', 'trust-ui.js', 'brand-effects.js', 'owner-sites.js', 'owner-registry-store.mjs', 'partner-brand-banner.js', 'partner-brand-banner.css'])
FILES.extend(['local-course-access.mjs','local-course-ui.mjs'])
FILES.extend(['partner-periods.mjs','partner-file.mjs','partner-attribution.js','partner-attribution.css'])
FILES.extend(['avito-dock.js','course-discovery.js'])
DIRECTORIES.append('course-packages')
def deduplicate_course_bootstrap(text):
 for pattern in (r'<base\s+href="\./"\s*/?>',r'<link\s+rel="stylesheet"\s+href="assets/fonts/fonts\.css"\s*/?>',r'<script\s+type="module"\s+src="course-api-bridge\.js(?:\?[^\"]*)?"\s*>\s*</script>'):
  seen=False
  def keep_first(match):
   nonlocal seen
   if seen:return ''
   seen=True;return match[0]
  text=re.sub(pattern,keep_first,text)
 return text
def build():
 if OUT.parent.is_symlink():raise RuntimeError('Invalid build directory')
 if OUT.parent.exists():shutil.rmtree(OUT.parent)
 OUT.mkdir(parents=True)
 for name in FILES:
  if (ROOT/name).is_file():shutil.copy2(ROOT/name,OUT/name)
 for name in DIRECTORIES:
  if (ROOT/name).is_dir():shutil.copytree(ROOT/name,OUT/name)
 for name in ('a1-english.html','a2-english.html','a1-spanish.html','a2-spanish.html','a1-french.html','a2-french.html'):
  page=OUT/name;page.write_text(deduplicate_course_bootstrap(page.read_text()))
 for course in ['en-a2','es-a1','es-a2','fr-a1','fr-a2']:
  if (OUT/'courses'/course/'data.json').exists():raise RuntimeError('Private data in public snapshot')
 subprocess.run(['node',str(ROOT/'scripts/build_runtime.mjs')],check=True)
 for relative in ['runtime/boot-2OG2FWET.js', 'runtime/boot-2T4P3KME.js', 'runtime/boot-4FNI7454.js', 'runtime/boot-576OS7PW.js', 'runtime/boot-64AXX7LY.js', 'runtime/boot-6QSJDVSJ.js', 'runtime/boot-6U223ZNU.js', 'runtime/boot-ERQU6IQ2.js', 'runtime/boot-H2DOPSFC.js', 'runtime/boot-ISCTWW6L.js', 'runtime/boot-JTKBOODH.js', 'runtime/boot-KDYLQVLU.js', 'runtime/boot-O7DD4GIM.js', 'runtime/boot-QNVKCRV5.js', 'runtime/boot-WDNDWSKB.js', 'runtime/boot-XSGDTG7L.js', 'runtime/boot-core-64AXX7LY.js', 'runtime/chunk-amber-forest-RBYZYJUT.js', 'runtime/chunk-app-3VVWXAAY.js', 'runtime/chunk-app-BNJWIUY2.js', 'runtime/chunk-app-BZFHFBRL.js', 'runtime/chunk-app-FAJYA5LU.js', 'runtime/chunk-app-KOXPUAQ5.js', 'runtime/chunk-app-LKGCTQRV.js', 'runtime/chunk-app-M537Q5TX.js', 'runtime/chunk-app-M755I2VP.js', 'runtime/chunk-app-MLMKVBFZ.js', 'runtime/chunk-app-PZ4HWFEA.js', 'runtime/chunk-app-R37ABWIL.js', 'runtime/chunk-app-RBJZMCXQ.js', 'runtime/chunk-app-RGXVNGLP.js', 'runtime/chunk-app-UK2IFCYJ.js', 'runtime/chunk-app-VN4KIGB5.js', 'runtime/chunk-app-YRMYZLY2.js', 'runtime/chunk-aurora-NYNHO5AT.js', 'runtime/chunk-aurora-WSWH4GWP.js', 'runtime/chunk-chunk-66ZRF6UE.js', 'runtime/chunk-chunk-BZIGIRXM.js', 'runtime/chunk-chunk-COYNGDQA.js', 'runtime/chunk-chunk-E37CZVJZ.js', 'runtime/chunk-chunk-I6BOFYUZ.js', 'runtime/chunk-chunk-IO4QK5KB.js', 'runtime/chunk-chunk-LDQUKS2L.js', 'runtime/chunk-chunk-LOUT3W72.js', 'runtime/chunk-chunk-LZABDZIL.js', 'runtime/chunk-chunk-OEUN6SWS.js', 'runtime/chunk-chunk-RADNPYXX.js', 'runtime/chunk-chunk-RYPJ2WDE.js', 'runtime/chunk-chunk-VKKGY5UD.js', 'runtime/chunk-chunk-WXS4CEG7.js', 'runtime/chunk-golden-HD5NDU5M.js', 'runtime/chunk-golden-HM7AYFPD.js', 'runtime/chunk-living-sea-6HJNHTRE.js', 'runtime/chunk-managed-sites-4HVMZFBG.js', 'runtime/chunk-managed-sites-5OCY3BJI.js', 'runtime/chunk-managed-sites-F4S3OAIY.js', 'runtime/chunk-managed-sites-LPDWXDIM.js', 'runtime/chunk-managed-sites-QCQQD2BG.js', 'runtime/chunk-managed-sites-ZDUPUUZK.js', 'runtime/chunk-moon-BF2X2DAH.js', 'runtime/chunk-moon-HMB4RZ5C.js', 'runtime/chunk-owner-sites-D2QUQVQQ.js', 'runtime/chunk-violet-bloom-B5CIPMRH.js', 'runtime/chunk-violet-bloom-RKPMVQRI.js', 'runtime/chunk-white-ocean-city-KYVFI2YT.js', 'runtime/reader-app-6T2MAWZZ.js', 'runtime/reader-app-H6YT5J3F.js', 'runtime/reader-app-JLHQ32R5.js', 'runtime/reader-app-KMNB4R6Y.js', 'runtime/reader-app-MDZG76O2.js', 'runtime/reader-app-SY5F5QK5.js', 'runtime/reader-ui-6RHQWA7T.js', 'runtime/reader-ui-73ICV7MK.js', 'runtime/reader-ui-7Y5FS5ZU.js', 'runtime/reader-ui-FR7IVNSN.js', 'runtime/reader-ui-O2URAFPF.js', 'runtime/reader-ui-RTR2CO7M.js', 'runtime/reader-ui-TUYG7GI5.js', 'runtime/reader-ui-UPV7SOC7.js', 'runtime/site-40C0B82380E072F9.css', 'runtime/site-6CE43982DA6069D3.css', 'runtime/site-DC3BDB389FD99221.css', 'runtime/site-E76A5BB36CD437D6.css']:
  (OUT/relative).unlink(missing_ok=True)
 release=hashlib.sha256(b''.join(p.read_bytes() for p in sorted(OUT.rglob('*')) if p.is_file() and p.name!='sw.js')).hexdigest()[:16]
 worker=OUT/'sw.js';worker.write_text(worker.read_text().replace('__RELEASE__',release))
 print('Public snapshot built')
if __name__=='__main__':build()

