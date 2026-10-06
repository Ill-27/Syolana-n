# English A1 course for Syolana

The course replaces the former `a1-english.html` in full. Its teaching text,
lexicon, translations, example templates and pronunciation entries are newly
authored for this project. The public route remains `#/lesson/en/a1/course`.

CEFR describes language use and skills; it does not prescribe one exhaustive
English A1 word list. The course covers the core English syllabus and familiar
everyday domains, with explicitly labelled A2 extensions. Its coverage section
maps the material to listening, interaction, production, reading and writing.

## Sources and compilation

- `lexicon.txt`: headwords, British phonemes, Russian senses and verb complements.
- `functions.txt`: closed-class vocabulary with four authored examples each.
- `special-examples.txt`: contextual examples overriding group templates.
- `notes.json`: countability, collocations, exceptional forms and usage notes.
- `rules.json`, `sounds.json`, `variants.txt`, `practice.json`: original lessons.
- `irregular.txt`, `phonemes.txt`: explicit exceptional forms and a closed phoneme dictionary.
- `adjective-subjects.json`, `verb-russian.txt`: suitable example contexts and Russian past forms.

Run `python scripts/build_en_a1.py`, then `python build.py` and
`node tests/test_en_a1.mjs`. Unknown English tokens fail compilation instead of
receiving a guessed transcription. The resulting `data.json` is committed so
the course also works with the repository's existing static GitHub Pages host.
Sentence transcriptions are broad, pedagogical UK transcriptions. They do not
encode every possible intonation, assimilation or regional pronunciation.

## Listening

`audio.js` consumes typed English/Russian pairs; it never reads DOM markup or IPA.
The three modes are EN, EN→RU, RU→EN. Exact regional voice selection prevents
silently substituting US for UK or Russian for English. Available voices and
their quality depend on the browser and device. A missing voice is reported;
an interrupted utterance is replayed on resume. Queues end unless the learner
explicitly enables looping. Spoken address punctuation has explicit names.

`curriculum.js` partitions every course pair into daily queues of approximately
1800 seconds of English at the selected rate and repetition setting. Rules
precede complete word cards in each queue. The final queue can be shorter.
Estimates assume 145 words per minute plus short pauses; they are not measured
recording lengths. Pauses are excluded from elapsed listening time.

Progress, selected voices, personal notes and handwriting stay in local browser
storage. Listening never starts automatically after loading or restoring progress.
The embedded page accepts theme, anchor and audio-pause messages only from its
same-origin parent, using the existing `syolanaHost`/`syolanaLesson` protocol.

## Study views

The existing public URL opens a course overview. An expandable table of contents
opens individual topics, day screens, ordered repetition lists and practice.
Changing the iframe hash changes only the view. The speech players and their
queues remain mounted; navigation never cancels or restarts course listening.
Day one begins with reading foundations. Every day presents rules before words.

The course inherits the host's handwritten heading font and palette. The host
uses the book reader's exact background shade (64%, blur 7px), and the course
sheet uses the book reader's 24% surface and 2px blur. Audio controls use an
opaque, collapsible panel, accessed from the compact footer button.

IPA is stored canonically and displayed inside square brackets throughout the
interface. Repetition lists replace random/input trainers: complete 0–100 and
1–31 sequences, a full hour by minute, other clock readings, calendars, dates,
years, prices, contact dictation and all explicitly marked irregular verbs.
These lists are part of full-course listening and the daily plan, without
adding duplicates of original alphabet entries or dictionary forms.
