export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = [
  {
    text: 'It is no measure of health to be well adjusted to a profoundly sick society.',
    author: 'J. Krishnamurti',
  },
  {
    text: 'The purpose of a system is what it does.',
    author: 'Stafford Beer',
  },
  {
    text: 'The map is not the territory.',
    author: 'Alfred Korzybski',
  },
  {
    text: 'The major problems in the world are the result of the difference between how nature works and the way people think.',
    author: 'Gregory Bateson',
  },
  {
    text: 'You never change things by fighting the existing reality. To change something, build a new model that makes the existing model obsolete.',
    author: 'Buckminster Fuller',
  },
  {
    text: "We can't control systems or figure them out. But we can dance with them.",
    author: 'Donella Meadows',
  },
  {
    text: 'We are a way for the cosmos to know itself.',
    author: 'Carl Sagan',
  },
  {
    text: "Look again at that dot. That's here. That's home. That's us.",
    author: 'Carl Sagan',
  },
  {
    text: 'I seem to be a verb, an evolutionary process — an integral function of the universe.',
    author: 'Buckminster Fuller',
  },
  {
    text: 'Eventually everything connects — people, ideas, objects. The quality of the connections is the key to quality per se.',
    author: 'Charles Eames',
  },
  {
    text: 'Men are disturbed not by the things which happen, but by their opinions about the things.',
    author: 'Epictetus',
  },
  {
    text: 'In nature nothing exists alone.',
    author: 'Rachel Carson',
  },
];

export function randomQuote(): Quote {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
