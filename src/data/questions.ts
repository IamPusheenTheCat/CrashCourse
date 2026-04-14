export interface QuestionOption {
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  statement: string;
  type: 'true_false' | 'multiple';
  answer?: boolean;
  options?: QuestionOption[];
  videoSrc: string;
  videoLabel: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 'sample1',
    statement:
      'It is not legal under any conditions to drive off the road to pass another vehicle.',
    type: 'true_false',
    answer: true,
    videoSrc: '/videos/sample1.mp4',
    videoLabel: 'Off-road passing',
  },
  {
    id: 'sample2',
    statement:
      'When a school bus ahead starts flashing yellow warning lights, you should slow down and prepare to stop.',
    type: 'true_false',
    answer: true,
    videoSrc: '/videos/sample2.mp4',
    videoLabel: 'School bus',
  },
  {
    id: 'sample3',
    statement: 'Which of the following is true about large trucks?',
    type: 'multiple',
    options: [
      {
        text: 'They are made of many trailers, which make them more maneuverable than passenger vehicles.',
        correct: false,
      },
      {
        text: 'They have large blind spots, which makes it difficult for the truck driver to see other vehicles.',
        correct: true,
      },
      {
        text: 'They have large and powerful emergency brakes, which gives them the capability to stop quickly.',
        correct: false,
      },
    ],
    videoSrc: '/videos/sample3.mp4',
    videoLabel: 'Large trucks',
  },
  {
    id: 'sample4',
    statement:
      'What should you do when traffic is slow and heavy, and you must cross railroad tracks before reaching the upcoming intersection?',
    type: 'multiple',
    options: [
      {
        text: 'Begin crossing when the vehicle in front of you is crossing the tracks.',
        correct: false,
      },
      {
        text: 'Wait on the tracks until the stoplight at the intersection turns green.',
        correct: false,
      },
      {
        text: 'Wait until you can completely cross the tracks before proceeding.',
        correct: true,
      },
    ],
    videoSrc: '/videos/sample4.mp4',
    videoLabel: 'Railroad tracks',
  },
];
