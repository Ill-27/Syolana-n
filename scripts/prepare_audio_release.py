"""Import the owner's existing library, normalize names, and author reading scenes.
Run with the absolute path to the original audio-library. Originals stay untouched.
"""
from pathlib import Path
import json, shutil, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1])
TARGET=ROOT/'audio-library'
files=[]
for src in sorted(SOURCE.rglob('*')):
    if not src.is_file() or src.suffix.lower() not in {'.ogg','.aac','.mp3','.m4a','.wav'}: continue
    rel=str(src.relative_to(SOURCE)).replace('\u200b','')
    dest=TARGET/rel
    dest.parent.mkdir(parents=True,exist_ok=True)
    if dest.exists() and dest.read_bytes()!=src.read_bytes(): raise RuntimeError('Collision: '+rel)
    shutil.copyfile(src,dest)
    files.append(rel)

def scene(color,*tracks): return {'color':color,'audio':', '.join(tracks)}
S=scene
plans={
 'turgenev_sparrow':[
  S('#bdedcf','music/happy_acoustic.ogg','ambience/park_path.ogg','sfx/footsteps_leaves.ogg'),
  S('#bcdcff','music/suspense_strings.ogg','nature/baby_bird_squeak.ogg','nature/sudden_wind.ogg'),
  S('#ffbecb','music/suspense_strings.ogg','nature/dog_growl_close.ogg','nature/bird_wings_flutter.ogg','nature/sparrow_chirp_desperate.ogg'),
  S('#ffcab1','music/tragic_revelation.ogg','sfx/heartbeat_slow.ogg'),
  S('#bde9eb','music/piano_romantic_soft.ogg','nature/wind_soft.ogg','nature/dog_whine_retreat.ogg','nature/heartbeat_fade_out.ogg'),
  S('#ffe3ad','music/piano_romantic_soft.ogg','ambience/park_path.ogg')],
 'lermontov_demon_1':[
  S('#d1bfff','music/mystic_secret.ogg','nature/wind_soft.ogg'),
  S('#c8d5ff','music/cello_drone_low.ogg','nature/desert_wind.ogg'),
  S('#b8deff','music/epic_orchestra.ogg','nature/river_flow_fast.ogg','nature/eagle_cry.ogg'),
  S('#bfead0','music/romantic_melancholy.ogg','nature/forest_morning.ogg'),
  S('#ffe0b5','music/romantic_melancholy.ogg','nature/river_flow_fast.ogg','sfx/footsteps_stone.ogg'),
  S('#ffe4af','music/happy_acoustic.ogg','ambience/tavern_crowd.ogg','sfx/tambourine_shake.ogg'),
  S('#f9c4dc','music/piano_romantic_soft.ogg','human/cloth_rustle.ogg'),
  S('#d7b9ff','music/dark_obsession.ogg','sfx/heartbeat_slow.ogg'),
  S('#f8d2bc','music/mystic_secret.ogg','magic/magic_chime_spell.ogg'),
  S('#bcd7ef','music/suspense_strings.ogg','transport/horse_gallop_dirt.ogg','nature/horse_breath.ogg'),
  S('#ffb8bf','music/suspense_strings.ogg','combat/gunshot_pistol.ogg','combat/sword_draw.ogg'),
  S('#c9d9ef','music/grief_cello.ogg','nature/wind_soft.ogg','nature/crow_caw.ogg'),
  S('#f6c7b2','music/tragic_revelation.ogg','transport/horse_gallop_dirt.ogg','nature/horse_breath.ogg'),
  S('#cfc5f9','music/grief_cello.ogg','human/crying_soft.ogg','human/crowd_panic.ogg'),
  S('#d6c2ff','music/ghostly_apparition.ogg','ambience/night_air.ogg'),
  S('#edc0e8','music/dark_obsession.ogg','sfx/heartbeat_slow.ogg')],
 'lermontov_demon_2':[
  S('#ecc2db','music/tragic_revelation.ogg','human/crying_soft.ogg'),
  S('#c9c3f7','music/ghostly_apparition.ogg','ambience/church_echo.ogg','sfx/footsteps_shuffling.ogg'),
  S('#bdebd3','music/piano_romantic_soft.ogg','nature/forest_morning.ogg','nature/river_flow_fast.ogg'),
  S('#bcdff9','music/romantic_melancholy.ogg','nature/wind_soft.ogg','ambience/church_echo.ogg'),
  S('#c4c7ff','music/grief_cello.ogg','ambience/wind_howl_window.ogg','human/crying_soft.ogg'),
  S('#f1bdd8','music/anxiety_drone.ogg','sfx/heartbeat_slow.ogg','human/female_gasp.ogg'),
  S('#e4c0f0','music/romantic_melancholy.ogg','ambience/night_air.ogg'),
  S('#fbe0b3','music/mystic_secret.ogg','sfx/magic_sparkle.ogg'),
  S('#fbbdc7','music/epic_orchestra.ogg','magic/dark_magic_whoosh.ogg'),
  S('#edbedc','music/dark_obsession.ogg','sfx/heartbeat_slow.ogg'),
  S('#ffbcc6','music/void_silence.ogg','human/woman_scream_far.ogg','magic/dark_magic_whoosh.ogg'),
  S('#becfe9','music/cello_drone_low.ogg','nature/crickets_chirp.ogg','nature/river_flow_fast.ogg','sfx/footsteps_stone.ogg'),
  S('#c5ddf1','music/grief_cello.ogg','ambience/church_echo.ogg'),
  S('#e0c9ef','music/romantic_melancholy.ogg','nature/wind_soft.ogg'),
  S('#bfcfe8','music/grief_cello.ogg','winter/winter_wind_outside.ogg','nature/horse_breath.ogg'),
  S('#ffe7be','music/epic_orchestra.ogg','nature/wind_soft.ogg','sfx/magic_sparkle.ogg')]
}
used=set()
for book,scenes in plans.items():
    path=ROOT/'books'/f'{book}.json'
    data=json.loads(path.read_text())
    stanzas=[b for b in data['blocks'] if b['type']=='stanza']
    assert len(stanzas)==len(scenes),(book,len(stanzas))
    for block,settings in zip(stanzas,scenes): block.update(settings)
    if book=='lermontov_demon_2':
        b=stanzas[9]
        assert b['ru'][48]=='Тамара' and b['ru'][204]=='Демон'
        cues=[
          (21,S('#f5c4d8','music/piano_romantic_soft.ogg','ambience/night_air.ogg')),
          (48,S('#c7d4fb','music/anxiety_drone.ogg','sfx/heartbeat_slow.ogg')),
          (76,S('#c9c6ef','music/grief_cello.ogg','nature/desert_wind.ogg')),
          (118,S('#ccbcf7','music/mystic_secret.ogg','nature/wind_soft.ogg')),
          (180,S('#badcea','music/romantic_melancholy.ogg','ambience/night_air.ogg')),
          (204,S('#ffe1b7','music/epic_orchestra.ogg','ambience/night_air.ogg')),
          (245,S('#e9beef','music/dark_obsession.ogg','sfx/heartbeat_slow.ogg'))]
        b['cues']=[{'line':line,**settings} for line,settings in cues]
    for block in stanzas:
        for settings in [block]+block.get('cues',[]): used.update(x.strip() for x in settings['audio'].split(','))
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
assert not (used-set(files)),used-set(files)
loops={'sfx/heartbeat_slow.ogg','transport/horse_gallop_dirt.ogg','winter/winter_wind_outside.ogg'}
nature_loops={'wind_soft','desert_wind','forest_morning','river_flow_fast','crickets_chirp','ocean_waves','jungle_canopy','winter_blizzard','storm_heavy_rain','campfire_crackling','swamp_frogs','sandstorm_howl'}
library={}
for rel in files:
    category=rel.split('/')[0];stem=Path(rel).stem
    loop=category in {'music','ambience'} or rel in loops or (category=='nature' and stem in nature_loops)
    volume=.19 if category=='music' else .14 if loop else .11
    if 'scream' in rel or 'gunshot' in rel or 'crowd_panic' in rel: volume=.045
    library[rel]={'src':'audio-library/'+rel,'loop':loop,'volume':volume}
# Browser fallback files for every current scene, plus a correctly labelled song container.
for rel in sorted(used):
    fallback=Path('audio-library/compatible')/Path(rel).with_suffix('.m4a')
    dest=ROOT/fallback;dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists() or dest.stat().st_size < 1024:
        subprocess.run(['ffmpeg','-y','-v','error','-nostdin','-i',str(TARGET/rel),'-map_metadata','-1','-c:a','aac','-b:a','96k','-movflags','+faststart',str(dest)],check=True)
    library[rel]['fallback']=str(fallback)
# The original MP3-named file is AAC; preserve it and remux without quality loss.
remux=TARGET/'songs/breaking_sunset.m4a'
if not remux.exists(): subprocess.run(['ffmpeg','-y','-v','error','-nostdin','-i',str(TARGET/'songs/breaking_sunset.mp3'),'-c:a','copy','-movflags','+faststart',str(remux)],check=True)
library['songs/breaking_sunset.mp3']['src']='audio-library/songs/breaking_sunset.m4a'
for mood,tracks in {
 'neutral':['music/piano_romantic_soft.ogg','nature/wind_soft.ogg'],
 'calm':['music/piano_romantic_soft.ogg','ambience/park_path.ogg'],
 'hope':['music/happy_acoustic.ogg','nature/forest_morning.ogg'],
 'joy':['music/happy_acoustic.ogg','nature/forest_morning.ogg'],
 'love':['music/romantic_melancholy.ogg','ambience/night_air.ogg'],
 'tension':['music/suspense_strings.ogg','sfx/heartbeat_slow.ogg'],
 'sorrow':['music/grief_cello.ogg','nature/wind_soft.ogg'],
 'mystery':['music/mystic_secret.ogg','ambience/night_air.ogg'],
 'wonder':['music/mystic_secret.ogg','ambience/night_air.ogg'],
}.items(): library[mood]={'tracks':tracks}
configPath=ROOT/'config.json';config=json.loads(configPath.read_text());config['sceneAudio']=library
configPath.write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'originals':len(files),'currentSceneAssets':len(used),'scenes':sum(map(len,plans.values()))+7,'totalBytes':sum(p.stat().st_size for p in TARGET.rglob('*') if p.is_file())}))
