export type CardAnnotationInput = { locale: string; checks: { id: string; label: string; value: string; verdict: string; source: string }[] };
export function validateCardAnnotationInput(input: unknown): CardAnnotationInput {
  const data = input as CardAnnotationInput;
  if (!data || !['zh', 'zh-HK', 'en', 'ru'].includes(data.locale) || !Array.isArray(data.checks) || data.checks.length !== 1) throw new Error('Invalid checks');
  const ids = new Set<string>();
  const checks = data.checks.map(check => {
    if (!check || typeof check.id !== 'string' || !/^[a-zA-Z][a-zA-Z0-9]{0,63}$/.test(check.id) || ids.has(check.id)) throw new Error('Invalid check ID');
    ids.add(check.id);
    if (typeof check.label !== 'string' || check.label.length > 120 || typeof check.value !== 'string' || check.value.length > 1200 || !['hit','warn','clear','info','unknown'].includes(check.verdict) || !['browser','server','combined'].includes(check.source)) throw new Error('Invalid check');
    return {id:check.id,label:check.label,value:check.value,verdict:check.verdict,source:check.source};
  });
  return {locale:data.locale,checks};
}
export type CardAnnotation = {observation:string; action:string};
export function validateCardAnnotationOutput(input: unknown, ids: string[]): Record<string,CardAnnotation> {
  const data = input as { notes: { id: string; observation: string; action: string }[] };
  if (!data || !Array.isArray(data.notes) || data.notes.length !== ids.length) throw new Error('Incomplete annotations');
  const notes: Record<string,CardAnnotation> = {};
  for (const note of data.notes) {
    if (!note || !ids.includes(note.id) || Object.hasOwn(notes,note.id) || [note.observation,note.action].some(value=>typeof value !== 'string' || !value.trim() || value.length > 500)) throw new Error('Invalid annotation');
    notes[note.id] = {observation:note.observation.trim(),action:note.action.trim()};
  }
  return notes;
}
