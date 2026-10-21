// Practice the new course material in finite, ordered lists.
export function trainerGroups(data) {
  const entries=data.vocabulary.filter(w=>w.irregular);
  const irregular={id:'irregular',title:'Новые неправильные глаголы A2',description:'Только глаголы этого уровня: начальная форма, прошедшее время и третья форма.',entries,pairs:entries.flatMap(w=>[w.head,w.forms[2],w.forms[3]])};
  return [...(data.repetition||[]),...(entries.length?[irregular]:[])];
}
export function referencePairs(data) {
  return [...new Map(trainerGroups(data).flatMap(g=>g.pairs).map(p=>[p.id,p])).values()];
}
