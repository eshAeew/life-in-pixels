export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'mindfulness' | 'presence' | 'growth' | 'rest' | 'joy' | 'gratitude' | 'ordinary';
  tags: string[];
}

export const QUOTE_DICTIONARY: Quote[] = [
  {
    id: 'q1',
    text: 'How we spend our days is, of course, how we spend our lives.',
    author: 'Annie Dillard',
    category: 'presence',
    tags: ['days', 'life', 'mindfulness', 'habits'],
  },
  {
    id: 'q2',
    text: 'Instructions for living a life: Pay attention. Be astonished. Tell about it.',
    author: 'Mary Oliver',
    category: 'ordinary',
    tags: ['attention', 'wonder', 'gratitude'],
  },
  {
    id: 'q3',
    text: 'Almost everything will work again if you unplug it for a few minutes, including you.',
    author: 'Anne Lamott',
    category: 'rest',
    tags: ['rest', 'peace', 'recharge', 'balance'],
  },
  {
    id: 'q4',
    text: 'Drink your tea slowly and reverently, as if it is the axis on which the whole earth revolves.',
    author: 'Thich Nhat Hanh',
    category: 'mindfulness',
    tags: ['tea', 'presence', 'calm', 'ritual'],
  },
  {
    id: 'q5',
    text: 'Let everything happen to you: beauty and terror. Just keep going. No feeling is final.',
    author: 'Rainer Maria Rilke',
    category: 'growth',
    tags: ['feelings', 'courage', 'resilience', 'acceptance'],
  },
  {
    id: 'q6',
    text: 'The ordinary acts we practice every day at home are of more importance to the soul than their simplicity might suggest.',
    author: 'Thomas Moore',
    category: 'ordinary',
    tags: ['home', 'routine', 'simplicity', 'soul'],
  },
  {
    id: 'q7',
    text: 'Joy does not simply happen to us. We have to choose joy and keep choosing it every day.',
    author: 'Henri Nouwen',
    category: 'joy',
    tags: ['joy', 'choice', 'intention'],
  },
  {
    id: 'q8',
    text: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
    category: 'growth',
    tags: ['strength', 'mind', 'stoicism', 'peace'],
  },
  {
    id: 'q9',
    text: 'There is a crack in everything. That’s how the light gets in.',
    author: 'Leonard Cohen',
    category: 'growth',
    tags: ['imperfection', 'light', 'hope', 'beauty'],
  },
  {
    id: 'q10',
    text: 'It is not that we have a short time to live, but that we waste a lot of it.',
    author: 'Seneca',
    category: 'presence',
    tags: ['time', 'intention', 'life'],
  },
  {
    id: 'q11',
    text: 'Rest is not idleness, and to lie sometimes on the grass under trees on a summer’s day is by no means a waste of time.',
    author: 'John Lubbock',
    category: 'rest',
    tags: ['rest', 'nature', 'unwind'],
  },
  {
    id: 'q12',
    text: 'To be alive in this beautiful, self-organizing universe — to participate in the dance of life with senses to perceive it — is beyond value.',
    author: 'Joanna Macy',
    category: 'gratitude',
    tags: ['gratitude', 'alive', 'wonder'],
  },
  {
    id: 'q13',
    text: 'The best thing about the future is that it comes one day at a time.',
    author: 'Abraham Lincoln',
    category: 'presence',
    tags: ['future', 'one day', 'patience'],
  },
  {
    id: 'q14',
    text: 'Walk as if you are kissing the Earth with your feet.',
    author: 'Thich Nhat Hanh',
    category: 'mindfulness',
    tags: ['earth', 'peace', 'walking', 'care'],
  },
  {
    id: 'q15',
    text: 'I would like to live like a river flows, carried by the surprise of its own unfolding.',
    author: 'John O’Donohue',
    category: 'ordinary',
    tags: ['flow', 'unfolding', 'acceptance'],
  },
  {
    id: 'q16',
    text: 'Caring for myself is not self-indulgence, it is self-preservation.',
    author: 'Audre Lorde',
    category: 'rest',
    tags: ['care', 'self-care', 'rest'],
  },
  {
    id: 'q17',
    text: 'Notice what you notice.',
    author: 'Keri Smith',
    category: 'mindfulness',
    tags: ['curiosity', 'attention', 'noticing'],
  },
  {
    id: 'q18',
    text: 'What day is it? asked Pooh. It’s today, squeaked Piglet. My favorite day, said Pooh.',
    author: 'A.A. Milne',
    category: 'joy',
    tags: ['today', 'favorite', 'childhood', 'simplicity'],
  },
];
