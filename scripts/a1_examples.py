"""Require four authored contexts; never manufacture headword-substitution examples."""
def examples(r, overrides, *unused):
    key = r['group'] + ':' + r['word']
    if key in overrides:
        return overrides[key]
    if r['word'] in overrides:
        return overrides[r['word']]
    if r['kind'] == 'function':
        return r['rawExamples']
    raise ValueError('Missing independently authored examples: ' + key)
