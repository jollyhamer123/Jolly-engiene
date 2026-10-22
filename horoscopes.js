// Date-based editorial readings for entertainment, with no API or saved profile.
(() => {
  const signs = [
    ['Rat', 'Resourceful and quick-witted', 'Your eye for overlooked details can turn a small discovery into something useful.'],
    ['Ox', 'Patient and dependable', 'Your steady approach brings calm to a situation that feels rushed.'],
    ['Tiger', 'Brave and independent', 'Your courage helps you take a first step, even when the whole path is not clear.'],
    ['Rabbit', 'Gentle and thoughtful', 'Your thoughtful words can make a conversation feel more welcoming.'],
    ['Dragon', 'Confident and imaginative', 'Your enthusiasm gives an idea momentum when you pair it with a practical next step.'],
    ['Snake', 'Observant and intuitive', 'Your reflective nature helps you notice what a busy day might otherwise hide.'],
    ['Horse', 'Energetic and free-spirited', 'Your curiosity brings fresh energy when you leave room to explore.'],
    ['Goat', 'Creative and compassionate', 'Your creative touch makes an ordinary task feel more personal.'],
    ['Monkey', 'Inventive and playful', 'Your playful approach can reveal a solution that a rigid plan misses.'],
    ['Rooster', 'Organized and expressive', 'Your attention to detail helps a promising plan become something concrete.'],
    ['Dog', 'Loyal and sincere', 'Your sincerity helps build trust through small, consistent actions.'],
    ['Pig', 'Generous and warm-hearted', 'Your warmth can make someone feel included without a grand gesture.']
  ];
  const themes = [
    ['Fresh starts', 'Give one unfinished idea a small, achievable beginning.'],
    ['Connection', 'Reach out to someone you have been meaning to check on.'],
    ['Focus', 'Choose one priority and give it a little uninterrupted attention.'],
    ['Curiosity', 'Ask a question before deciding you already know the answer.'],
    ['Balance', 'Leave a little space between your commitments to catch your breath.'],
    ['Kindness', 'A thoughtful gesture can be the most memorable part of your day.'],
    ['Confidence', 'Share a considered opinion without feeling you need every answer.'],
    ['Patience', 'Let a slower task unfold instead of forcing an immediate result.'],
    ['Creativity', 'Try a different route through a familiar problem.'],
    ['Clarity', 'Write down what matters before adding another task to your list.'],
    ['Rest', 'Take a genuine break and return with a little more perspective.'],
    ['Progress', 'Notice what you have already done before looking at what remains.'],
    ['Adventure', 'Make room for one small experience outside your usual routine.'],
    ['Listening', 'Let someone finish their thought before offering a solution.'],
    ['Simplicity', 'Remove one unnecessary step from something you do often.'],
    ['Gratitude', 'Tell someone exactly what you appreciate about them.'],
    ['Learning', 'Spend a few minutes exploring a subject simply because it interests you.'],
    ['Grounding', 'A walk or a quiet moment can help you reset your attention.'],
    ['Cooperation', 'Invite another perspective into a task you usually handle alone.'],
    ['Renewal', 'Clear a small space and make room for what you want to do next.'],
    ['Reflection', 'Look back at a recent experience and name one thing it taught you.'],
    ['Expression', 'Find a simple way to share something you have been keeping in mind.'],
    ['Flexibility', 'Keep your goal, but allow yourself to adjust the route.'],
    ['Celebration', 'Mark a small success with something that makes you smile.'],
    ['Intention', 'Decide how you want to feel about your day before filling every hour.'],
    ['Friendship', 'Suggest an easy, low-pressure way to spend time with someone.'],
    ['Possibility', 'Keep an interesting idea on your list even if today is not the day to start.'],
    ['Care', 'Offer yourself the same patience you would offer a good friend.'],
    ['Discovery', 'Notice one beautiful or surprising thing in your surroundings.'],
    ['Perspective', 'Revisit a worry after a break and see whether it still feels the same size.'],
    ['Purpose', 'Connect a routine task to the reason you chose to do it.']
  ];
  const nudges = [
    'In relationships, a clear question is kinder than a guess.',
    'With your plans, leave room for a pleasant change of direction.',
    'For your wellbeing, protect a little time that belongs only to you.',
    'In a conversation, curiosity can carry you further than certainty.',
    'For your next project, a small first draft is enough to begin.',
    'With your energy, choose a pace you can comfortably sustain.',
    'In your routine, a little variety may help you see things afresh.'
  ];
  function reading(sign, now = new Date()) {
    const index = signs.findIndex(item => item[0] === sign);
    if (index < 0 || !Number.isFinite(now.getTime())) throw new Error('Choose a valid Chinese zodiac sign and date.');
    const date = now.toISOString().slice(0, 10);
    const day = Math.floor(Date.parse(date) / 86400000);
    const [focus, advice] = themes[(day + index * 7) % themes.length];
    return { sign, date, traits: signs[index][1], focus, text: `${signs[index][2]} Today’s focus is ${focus.toLowerCase()}. ${advice} ${nudges[(day + index * 3) % nudges.length]}` };
  }
  globalThis.JollyHoroscopes = Object.freeze({ signs: signs.map(([name]) => name), reading });
})();
