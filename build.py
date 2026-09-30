"""Build an allowlisted static bundle and separate private lessons. No secrets copied."""
from pathlib import Path
import hashlib, json, re, shutil
ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'dist'
PUBLIC = OUT / 'public'
PRIVATE = OUT / 'private_lessons'
FREE = {'a1-spanish-rules.html':'es/a1/rules','a1-spanish-words.html':'es/a1/words',
        'a1-spanish-practice.html':'es/a1/practice','a1-françes-rules.html':'fr/a1/rules','a1-françes-words.html':'fr/a1/words'}
PAID = {'a2-spanish-rules.html':'es/a2/rules','a2-spanish-words.html':'es/a2/words',
        'b1-spanish-rules.html':'es/b1/rules','b2-spanish-rules.html':'es/b2/rules'}
FILES = ['index.html','app.js','api.js','catalog.js','content.js','player.js','studio.js','themes.js','utils.js',
         'styles.css','config.json','legacy-bridge.js','legacy-embed.css','legacy-redirect.js']

def redirect(route):
    return '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Syolana</title><body><p><a href="/#/'+route+'">Открыть страницу Syolana</a></p><script src="/legacy-redirect.js" data-route="'+route+'"></script></body></html>'

def lesson(name, route):
    text = (ROOT / name).read_text()
    # All original scripts are trusted repository code, extracted for a strict CSP.
    counter = 0
    def externalize(match):
        nonlocal counter
        attrs, code = match.groups()
        if re.search(r'\bsrc\s*=',attrs): return match[0]
        counter += 1
        slug = hashlib.sha256(name.encode()).hexdigest()[:12] + '-' + str(counter) + '.js'
        (PUBLIC / 'legacy-scripts' / slug).write_text(code)
        return '<script src="/legacy-scripts/'+slug+'"></script>'
    text = re.sub(r'<script([^>]*)>(.*?)</script>', externalize, text, flags=re.S|re.I)
    if 'legacy-bridge.js' not in text:
        text = text.replace('</head>','<link rel="stylesheet" href="/legacy-embed.css"><script src="/legacy-bridge.js" data-route="lesson/'+route+'"></script></head>')
    # A single background for the entire app. Existing functions support a null context.
    text = text.replace('<head>', '<head><base href="/">', 1)
    return text

def build():
    if OUT.is_symlink(): raise RuntimeError('dist must not be a symlink')
    if OUT.exists(): shutil.rmtree(OUT)
    PUBLIC.mkdir(parents=True); PRIVATE.mkdir(parents=True)
    (PUBLIC/'legacy-scripts').mkdir()
    for name in FILES: shutil.copy2(ROOT/name, PUBLIC/name)
    for name in ['assets','themes','books','covers','español-songs','audio-library']:
        shutil.copytree(ROOT/name,PUBLIC/name)
    for name,route in FREE.items(): (PUBLIC/name).write_text(lesson(name,route))
    for name,route in PAID.items():
        destination=PRIVATE/(route+'.html');destination.parent.mkdir(parents=True,exist_ok=True)
        destination.write_text(lesson(name,route));(PUBLIC/name).write_text(redirect('lesson/'+route))
    for name,route in [('español.html','languages/es'),('pexample.html','join'),('français.html','languages/fr')]:
        (PUBLIC/name).write_text(redirect(route))
    print('Built public site +',len(FREE),'free lesson pages +',len(PAID),'private lesson pages.')

if __name__ == '__main__': build()
