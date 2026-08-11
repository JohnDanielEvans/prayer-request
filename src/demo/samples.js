/**
 * Sample messages per preset, for the "try an example" chips.
 *
 * Each set deliberately includes one ambiguous message: a classifier that only
 * ever sees clean input isn't telling you much.
 */
export const SAMPLES = {
  support: [
    { label: 'Billing', text: 'My invoice is showing the wrong amount — we were charged twice for March.' },
    { label: 'Password', text: 'Can someone help me reset my password? I am locked out of my account.' },
    { label: 'Crash', text: 'The app crashes every time I open the settings page. It worked before the update.' },
    { label: 'Feature', text: 'It would be nice to have a dark mode someday. No rush at all.' },
    { label: 'Urgent', text: 'URGENT: the whole dashboard is down and our team is completely blocked.' },
    { label: 'Ambiguous', text: 'I was charged for a plan I thought we cancelled, and now nobody on the team can log in.' },
  ],
  sales: [
    { label: 'New project', text: 'We are looking to rebuild our marketing site and need a quote and rough timeline.' },
    { label: 'Pricing', text: 'How much does the annual plan cost, and do you offer a nonprofit discount?' },
    { label: 'Partnership', text: 'We are an agency and would like to talk about a reseller partnership.' },
    { label: 'Renewal', text: 'Our contract is up for renewal next month and we want to add more seats.' },
    { label: 'Ambiguous', text: 'We already work with you on the app, but this is about a separate new project and its budget.' },
  ],
  community: [
    { label: 'Assistance', text: 'I need help with groceries this week — we have nothing to eat and rent is overdue.' },
    { label: 'Volunteer', text: 'I would like to volunteer on weekends. I have a background in tutoring.' },
    { label: 'Event', text: 'How do I register for the workshop next Saturday? Is there still space?' },
    { label: 'Donation', text: 'I want to set up a monthly donation and will need a tax receipt.' },
    { label: 'Ambiguous', text: 'I came to the food pantry last month and now I would like to help out and give back.' },
  ],
  prayer: [
    { label: 'Health', text: 'My mother goes in for heart surgery on Tuesday. Please pray for a smooth recovery.' },
    { label: 'Work', text: 'I was laid off three weeks ago and rent is due Friday. Praying for an open door.' },
    { label: 'Grief', text: 'We buried my grandfather on Saturday. The house feels so quiet now.' },
    { label: 'Anxiety', text: "I can't sleep. My chest is tight all the time and I keep bracing for bad news." },
    { label: 'Gratitude', text: 'After two years of waiting, our adoption was finalized this morning. Thank you all.' },
    { label: 'Ambiguous', text: 'Please pray for my family as we decide about moving my father into care. Money is tight.' },
  ],
};

export function samplesFor(presetId) {
  return SAMPLES[presetId] ?? SAMPLES.support;
}
