// One line for the day, written for high schoolers. Original lines (not
// quotes), picked by the date so everyone sees the same one all day.

const LINES = [
  'You don’t have to feel ready to start. Starting is how you get ready.',
  'A B+ you turned in beats an A you’re still perfecting.',
  'Sleep is part of studying, not a break from it.',
  'Ask the question. Someone else in the room was wondering too.',
  'One hard thing today is enough. You don’t owe the day three.',
  'Your worth isn’t a GPA. It never was.',
  'The first draft is supposed to be bad. That’s its whole job.',
  'Drink some water. Seriously, right now.',
  'It’s okay to be the one who needs help this week.',
  'Five minutes of work beats an hour of dreading it.',
  'Comparison is a trap. Their highlight reel isn’t your whole life.',
  'You’re allowed to rest before everything’s finished.',
  'Future you is counting on present you. Be nice to them.',
  'Mistakes on homework are the cheapest mistakes you’ll ever make.',
  'Texting a friend back counts as taking care of yourself.',
  'Not every thought you have is true. Especially at 1 AM.',
  'Progress, not perfect.',
  'The teacher wants you to pass. Really.',
  'Being tired is information, not a character flaw.',
  'A walk outside fixes more than it should.',
  'You’ve gotten through every hard day so far.',
  'Do the ugly version first. Make it pretty later.',
  'If it takes two minutes, do it now. If it takes two hours, break it up.',
  'Feeling behind is common. Being behind is fixable.',
  'You can’t pour from an empty cup — or an empty stomach. Eat lunch.',
  'Phones are designed to be hard to put down. It’s not just you.',
  'Say one kind thing to yourself today. Out loud if you’re brave.',
  'The goal isn’t zero stress. It’s enough recovery.',
  'Small steps still move you.',
  'Nobody has it all figured out. Nobody.',
  'Tomorrow’s a new page. Tonight, close this one gently.',
];

export function lineForToday(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return LINES[day % LINES.length];
}
