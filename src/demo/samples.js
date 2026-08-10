/**
 * Seeded examples for the demo. Written to exercise different categories --
 * including one deliberately ambiguous request, since a classifier that only
 * ever sees clean input isn't telling you much.
 */
export const SAMPLE_REQUESTS = [
  {
    label: 'Health',
    text: "My mother goes in for heart surgery on Tuesday. Please pray for steady hands for her surgeons and for a smooth recovery afterward.",
  },
  {
    label: 'Work',
    text: "I was laid off three weeks ago and rent is due Friday. Praying for an open door before the savings run out.",
  },
  {
    label: 'Grief',
    text: "We buried my grandfather on Saturday. The house feels so quiet now and I don't know how to help my grandmother through this.",
  },
  {
    label: 'Anxiety',
    text: "I can't sleep. My chest is tight all the time and I keep bracing for bad news that never comes.",
  },
  {
    label: 'Gratitude',
    text: "After two years of waiting, our adoption was finalized this morning. Thank you all for praying us through it.",
  },
  {
    label: 'Ambiguous',
    text: "Please pray for my family as we make a hard decision about moving my father into care. Money is tight and nobody agrees.",
  },
];
