export type QuestionChoice = {
  id: string;
  label: string;
};

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  prompt: string;
  choices: QuestionChoice[];
  correctId: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  category?: string;
  conversationHook?: string;
};

export const QUESTIONS_PER_CHALLENGE = 3;
/** Unique packs for the first 7 people at a table. Same 21 for the venue tonight. */
export const NIGHT_PACKS = 7;
export const NIGHT_SLATE_SIZE = NIGHT_PACKS * QUESTIONS_PER_CHALLENGE;

export const SEED_QUESTIONS: Question[] = [
  {
    id: "dart-bull",
    difficulty: "easy",
    prompt:
      "The tiny inner bull on a dartboard isn’t 25. What’s the inner one actually worth?",
    choices: [
      { id: "a", label: "20" },
      { id: "b", label: "25" },
      { id: "c", label: "50" },
      { id: "d", label: "100" },
    ],
    correctId: "c",
    explanation: "Inner bull is 50. Outer bull is 25. That’s the whole argument.",
    conversationHook: "Everyone’s mixed up the two bulls at some point.",
  },
  {
    id: "guitar-strings",
    difficulty: "easy",
    prompt: "If the bartender pours your whiskey neat, what stayed out of the glass?",
    choices: [
      { id: "a", label: "Ice" },
      { id: "b", label: "The whiskey" },
      { id: "c", label: "A garnish" },
      { id: "d", label: "A mixer" },
    ],
    correctId: "a",
    explanation:
      "Neat means room temp, nothing added — no ice. Straight up is chilled and strained.",
    conversationHook: "Neat vs rocks vs straight up is a classic bar fight.",
  },
  {
    id: "freeze-f",
    difficulty: "easy",
    prompt:
      "Zero degrees doesn’t freeze a drink in an American kitchen. What temperature actually does?",
    choices: [
      { id: "a", label: "0°F" },
      { id: "b", label: "32°F" },
      { id: "c", label: "100°F" },
      { id: "d", label: "212°F" },
    ],
    correctId: "b",
    explanation: "32°F. 0° is Celsius. 212° is boiling, which is a different problem.",
    conversationHook: "The Celsius people at the table will get loud.",
  },
  {
    id: "dozen",
    difficulty: "easy",
    prompt:
      "A baker’s dozen is 13. The extra roll was originally so bakers wouldn’t get accused of what?",
    choices: [
      { id: "a", label: "Using bad flour" },
      { id: "b", label: "Working on Sunday" },
      { id: "c", label: "Shorting the customer" },
      { id: "d", label: "Copying a French recipe" },
    ],
    correctId: "c",
    explanation:
      "Medieval bakers could be fined for selling underweight bread. The 13th roll was insurance.",
    conversationHook: "It’s a cheat-code from a time when bakers could get in real trouble.",
  },
  {
    id: "texas-size",
    difficulty: "easy",
    prompt: "Texas loves to say it’s the biggest. Is it actually the largest U.S. state?",
    choices: [
      { id: "a", label: "Yes — the largest" },
      { id: "b", label: "Second, after Alaska" },
      { id: "c", label: "Second, after California" },
      { id: "d", label: "Third, after Alaska and Montana" },
    ],
    correctId: "b",
    explanation: "Alaska is first. Texas is second. California is third. Don’t tell the table.",
    conversationHook: "Someone will still argue about it.",
  },
  {
    id: "piano-keys",
    difficulty: "easy",
    prompt:
      "Old-school Texas chili is missing an ingredient the rest of the country treats as mandatory. Which one?",
    choices: [
      { id: "a", label: "Beef" },
      { id: "b", label: "Chili peppers" },
      { id: "c", label: "Beans" },
      { id: "d", label: "Cumin" },
    ],
    correctId: "c",
    explanation: "Beans in chili will start a fight in Texas. Meat and chile. That’s the religion.",
    conversationHook: "This one splits the table on sight.",
  },
  {
    id: "right-angle",
    difficulty: "easy",
    prompt:
      "If a drink is on the rocks, what did the bartender just put in that you can hear?",
    choices: [
      { id: "a", label: "Soda" },
      { id: "b", label: "Ice" },
      { id: "c", label: "A lemon twist" },
      { id: "d", label: "A salt rim" },
    ],
    correctId: "b",
    explanation: "Rocks = ice. Neat is the quiet one.",
    conversationHook: "Pairs with the neat question for a two-drink argument.",
  },
  {
    id: "baseball-innings",
    difficulty: "easy",
    prompt:
      "A regulation baseball game is nine innings — unless it’s tied. Then what happens?",
    choices: [
      { id: "a", label: "They flip a coin" },
      { id: "b", label: "They call it a draw" },
      { id: "c", label: "They keep playing extra innings" },
      { id: "d", label: "The home team wins" },
    ],
    correctId: "c",
    explanation: "Extra innings until somebody takes it. No draw, no coin flip.",
    conversationHook: "Someone will bring up the ghost runner. Let them.",
  },
  {
    id: "ibu",
    difficulty: "medium",
    prompt: "When a beer menu brags about IBUs, what is it actually measuring?",
    choices: [
      { id: "a", label: "Alcohol" },
      { id: "b", label: "Bitterness" },
      { id: "c", label: "Color" },
      { id: "d", label: "Carbonation" },
    ],
    correctId: "b",
    explanation: "International Bitterness Units. Hop oils. ABV is a different number.",
    conversationHook: "IPA people will want to talk for ten minutes.",
  },
  {
    id: "iphone-year",
    difficulty: "medium",
    prompt: "Steve Jobs pulled the first iPhone out of his jeans onstage in which year?",
    choices: [
      { id: "a", label: "2005" },
      { id: "b", label: "2007" },
      { id: "c", label: "2009" },
      { id: "d", label: "2011" },
    ],
    correctId: "b",
    explanation: "January 2007. It shipped that June. The jeans bit was the whole bit.",
    conversationHook: "Everyone thinks they remember the year. They don’t.",
  },
  {
    id: "us-pint",
    difficulty: "medium",
    prompt:
      "A U.S. pint of beer looks small next to a British one. How many ounces is the American pint?",
    choices: [
      { id: "a", label: "12" },
      { id: "b", label: "14" },
      { id: "c", label: "16" },
      { id: "d", label: "20" },
    ],
    correctId: "c",
    explanation: "16 U.S. ounces. An imperial pint is 20. That’s why UK pints look unfair.",
    conversationHook: "Instant argument if anyone’s been to London.",
  },
  {
    id: "jsc-houston",
    difficulty: "medium",
    prompt:
      "When astronauts radio “Houston,” they’re talking to Mission Control. Where is that room?",
    choices: [
      { id: "a", label: "Houston" },
      { id: "b", label: "Dallas" },
      { id: "c", label: "Huntsville" },
      { id: "d", label: "Cape Canaveral" },
    ],
    correctId: "a",
    explanation:
      "Johnson Space Center. That’s the Houston in every launch, even when the rocket left Florida.",
    conversationHook: "Florida launches. Houston talks.",
  },
  {
    id: "texas-vs-california",
    difficulty: "medium",
    prompt: "Which showed up first: the Republic of Texas, or California as a U.S. state?",
    choices: [
      { id: "a", label: "California" },
      { id: "b", label: "The Republic of Texas" },
      { id: "c", label: "They started the same year" },
      { id: "d", label: "Texas as a U.S. state" },
    ],
    correctId: "b",
    explanation: "Texas declared a republic in 1836. California became a state in 1850.",
    conversationHook: "Texas got to be a country. California skipped that part.",
  },
  {
    id: "espresso-base",
    difficulty: "medium",
    prompt:
      "A latte and a cappuccino start with the same shot. The real difference in the cup is what?",
    choices: [
      { id: "a", label: "The kind of beans" },
      { id: "b", label: "How much milk foam vs steamed milk" },
      { id: "c", label: "Whether it’s served hot" },
      { id: "d", label: "Adding chocolate" },
    ],
    correctId: "b",
    explanation:
      "Same espresso. Cappuccino is foamier and drier. Latte is milkier. That’s the fight.",
    conversationHook: "Baristas and customers disagree forever.",
  },
  {
    id: "houston-rank",
    difficulty: "medium",
    prompt: "Houston likes to act like the biggest. By population, which-largest U.S. city is it?",
    choices: [
      { id: "a", label: "2nd" },
      { id: "b", label: "3rd" },
      { id: "c", label: "4th" },
      { id: "d", label: "5th" },
    ],
    correctId: "c",
    explanation: "Fourth: New York, Los Angeles, Chicago, then Houston.",
    conversationHook: "Someone will try to count metro areas instead.",
  },
  {
    id: "bourbon-where",
    difficulty: "medium",
    prompt: "Kentucky wants all the credit. Where does the law actually say bourbon has to be made?",
    choices: [
      { id: "a", label: "Only Kentucky" },
      { id: "b", label: "The United States" },
      { id: "c", label: "Scotland or the U.S." },
      { id: "d", label: "Anywhere, if it’s 51% corn" },
    ],
    correctId: "b",
    explanation:
      "U.S. law: bourbon is a distinctive product of the United States. Kentucky is tradition, not the legal line.",
    conversationHook: "A Texas bourbon person will appear immediately.",
  },
  {
    id: "drum-tuba",
    difficulty: "hard",
    prompt:
      "You’re looking at a standard rock drum kit. Which of these does not belong anywhere near it?",
    choices: [
      { id: "a", label: "Snare" },
      { id: "b", label: "Hi-hat" },
      { id: "c", label: "Tuba" },
      { id: "d", label: "Crash cymbal" },
    ],
    correctId: "c",
    explanation: "If the tuba is in the kit, the night has gone sideways.",
    conversationHook: "The joke is the point. Someone will still hesitate.",
  },
  {
    id: "spindletop",
    difficulty: "hard",
    prompt:
      "The 1901 gusher that launched the Texas oil boom wasn’t in Houston. It blew near which city?",
    choices: [
      { id: "a", label: "Houston" },
      { id: "b", label: "Beaumont" },
      { id: "c", label: "Midland" },
      { id: "d", label: "Galveston" },
    ],
    correctId: "b",
    explanation: "Spindletop was Beaumont. Houston got rich on it; the well was a short trip east.",
    conversationHook: "Houston people always guess Houston.",
  },
  {
    id: "alamo-year",
    difficulty: "hard",
    prompt: "Everybody remembers the Alamo. Almost nobody remembers the year it fell.",
    choices: [
      { id: "a", label: "1812" },
      { id: "b", label: "1836" },
      { id: "c", label: "1845" },
      { id: "d", label: "1861" },
    ],
    correctId: "b",
    explanation: "1836, Texas Revolution. Statehood was 1845. Different fight.",
    conversationHook: "1845 is the trap for people who remember statehood.",
  },
  {
    id: "sam-houston-role",
    difficulty: "hard",
    prompt: "Sam Houston’s name is on the city. Which of these jobs did he actually hold?",
    choices: [
      { id: "a", label: "A U.S. president" },
      { id: "b", label: "President of the Republic of Texas" },
      { id: "c", label: "Mayor of Houston" },
      { id: "d", label: "A Spanish explorer" },
    ],
    correctId: "b",
    explanation: "President of the Republic — and a general — not a U.S. president, and not the mayor.",
    conversationHook: "The city is named for him. He never ran it as mayor.",
  },
  {
    id: "moon-houston",
    difficulty: "hard",
    prompt: "After Apollo 11 landed, the first word from the lunar surface was a city. Which one?",
    choices: [
      { id: "a", label: "Eagle" },
      { id: "b", label: "Tranquility" },
      { id: "c", label: "Houston" },
      { id: "d", label: "Armstrong" },
    ],
    correctId: "c",
    explanation: "“Houston, Tranquility Base here. The Eagle has landed.”",
    conversationHook: "This one makes the whole room feel local.",
  },
  {
    id: "football-yards",
    difficulty: "hard",
    prompt:
      "People say a football field is 120 yards. What are they accidentally counting?",
    choices: [
      { id: "a", label: "The stands" },
      { id: "b", label: "The two end zones" },
      { id: "c", label: "The hash marks" },
      { id: "d", label: "The coaches’ boxes" },
    ],
    correctId: "b",
    explanation: "100 yards of field. Each end zone adds 10. That’s the 120.",
    conversationHook: "Someone will swear they were taught 120.",
  },
  {
    id: "dart-20",
    difficulty: "hard",
    prompt: "Glance at a dartboard from across the room. Which number is at the top?",
    choices: [
      { id: "a", label: "1" },
      { id: "b", label: "20" },
      { id: "c", label: "5" },
      { id: "d", label: "Bull" },
    ],
    correctId: "b",
    explanation: "20 at 12 o’clock. That’s why a dartboard looks “right” even from the bar.",
    conversationHook: "Look up. The board in the room is the answer key.",
  },
  {
    id: "proxima",
    difficulty: "hard",
    prompt:
      "Besides the Sun, which star is actually closest to Earth — not the brightest, the closest?",
    choices: [
      { id: "a", label: "Sirius" },
      { id: "b", label: "Polaris" },
      { id: "c", label: "Proxima Centauri" },
      { id: "d", label: "Betelgeuse" },
    ],
    correctId: "c",
    explanation: "Proxima Centauri. Sirius is brighter. Polaris is the famous one. Neither wins.",
    conversationHook: "Brightness and closeness get mixed up every time.",
  },
];
