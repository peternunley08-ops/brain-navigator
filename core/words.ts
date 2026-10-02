import type { NoteBlock } from './hubStore';

/** Words in a note, the way an essay limit counts them: body text only, no headings. */
export function essayWords(blocks: NoteBlock[]) {
  return blocks
    .filter((b) => b.type !== 'heading' && b.type !== 'divider')
    .reduce((s, b) => s + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0);
}

/** An essay's word limit: the one picked, 650 for an essay-looking page, or none. */
export function wordGoalFor(n: { title: string; icon: string; wordGoal?: number | null }) {
  const isEssay = /essay|personal statement|supplement|brainstorm/i.test(n.title) || n.icon === 'feather';
  return n.wordGoal !== undefined ? n.wordGoal : isEssay ? 650 : null;
}

/** "1 card", "3 cards": a count with its word, singular when it's one. */
export function plural(n: number, word: string, many = `${word}s`) {
  return `${n} ${n === 1 ? word : many}`;
}
