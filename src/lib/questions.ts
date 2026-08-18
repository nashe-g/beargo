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
};

export const QUESTIONS_PER_CHALLENGE = 3;

export const QUESTION_POOL: Question[] = [
  {
    id: "dart-bull",
    difficulty: "easy",
    prompt: "A standard dartboard’s inner bullseye is worth how many points?",
    choices: [
      { id: "a", label: "20" },
      { id: "b", label: "25" },
      { id: "c", label: "50" },
      { id: "d", label: "100" },
    ],
    correctId: "c",
    explanation: "The inner bull is 50. The outer bull is 25.",
  },
  {
    id: "guitar-strings",
    difficulty: "easy",
    prompt: "How many strings does a standard guitar have?",
    choices: [
      { id: "a", label: "4" },
      { id: "b", label: "5" },
      { id: "c", label: "6" },
      { id: "d", label: "12" },
    ],
    correctId: "c",
    explanation: "Six. Twelve-string guitars exist, but they’re the special ones.",
  },
  {
    id: "freeze-f",
    difficulty: "easy",
    prompt: "At what temperature does water freeze, in Fahrenheit?",
    choices: [
      { id: "a", label: "0°" },
      { id: "b", label: "32°" },
      { id: "c", label: "100°" },
      { id: "d", label: "212°" },
    ],
    correctId: "b",
    explanation: "32°F. 0° is Celsius. 212° is boiling, not freezing.",
  },
  {
    id: "dozen",
    difficulty: "easy",
    prompt: "How many are in a dozen?",
    choices: [
      { id: "a", label: "6" },
      { id: "b", label: "10" },
      { id: "c", label: "12" },
      { id: "d", label: "13" },
    ],
    correctId: "c",
    explanation: "Twelve. A baker’s dozen is 13.",
  },
  {
    id: "texas-size",
    difficulty: "easy",
    prompt: "Texas is the largest U.S. state by area — true or almost?",
    choices: [
      { id: "a", label: "Yes, the largest" },
      { id: "b", label: "Second, after Alaska" },
      { id: "c", label: "Second, after California" },
      { id: "d", label: "Third, after Alaska and Montana" },
    ],
    correctId: "b",
    explanation: "Alaska is first. Texas is second. California is third.",
  },
  {
    id: "piano-keys",
    difficulty: "easy",
    prompt: "How many keys are on a standard piano?",
    choices: [
      { id: "a", label: "76" },
      { id: "b", label: "88" },
      { id: "c", label: "96" },
      { id: "d", label: "104" },
    ],
    correctId: "b",
    explanation: "88 keys: 52 white, 36 black.",
  },
  {
    id: "right-angle",
    difficulty: "easy",
    prompt: "A right angle measures how many degrees?",
    choices: [
      { id: "a", label: "45" },
      { id: "b", label: "90" },
      { id: "c", label: "180" },
      { id: "d", label: "360" },
    ],
    correctId: "b",
    explanation: "90 degrees. 180 is a straight line.",
  },
  {
    id: "baseball-innings",
    difficulty: "easy",
    prompt: "How many innings are in a regulation baseball game?",
    choices: [
      { id: "a", label: "7" },
      { id: "b", label: "8" },
      { id: "c", label: "9" },
      { id: "d", label: "10" },
    ],
    correctId: "c",
    explanation: "Nine. Extra innings only if it’s tied.",
  },
  {
    id: "ibu",
    difficulty: "medium",
    prompt: "In beer, IBU measures what?",
    choices: [
      { id: "a", label: "Alcohol" },
      { id: "b", label: "Bitterness" },
      { id: "c", label: "Color" },
      { id: "d", label: "Carbonation" },
    ],
    correctId: "b",
    explanation: "International Bitterness Units. Hop oils, not ABV.",
  },
  {
    id: "iphone-year",
    difficulty: "medium",
    prompt: "What year did the first iPhone come out?",
    choices: [
      { id: "a", label: "2005" },
      { id: "b", label: "2007" },
      { id: "c", label: "2009" },
      { id: "d", label: "2011" },
    ],
    correctId: "b",
    explanation: "2007. Jobs announced it in January and it shipped that June.",
  },
  {
    id: "us-pint",
    difficulty: "medium",
    prompt: "A standard U.S. pint of beer is how many ounces?",
    choices: [
      { id: "a", label: "12" },
      { id: "b", label: "14" },
      { id: "c", label: "16" },
      { id: "d", label: "20" },
    ],
    correctId: "c",
    explanation: "16 U.S. ounces. An imperial pint is 20, which is why UK pints look bigger.",
  },
  {
    id: "jsc-houston",
    difficulty: "medium",
    prompt: "NASA’s Johnson Space Center is in which city?",
    choices: [
      { id: "a", label: "Houston" },
      { id: "b", label: "Dallas" },
      { id: "c", label: "Huntsville" },
      { id: "d", label: "Cape Canaveral" },
    ],
    correctId: "a",
    explanation: "Houston. That’s the Mission Control “Houston” in every launch.",
  },
  {
    id: "texas-vs-california",
    difficulty: "medium",
    prompt: "Which came first: the Republic of Texas, or the state of California?",
    choices: [
      { id: "a", label: "California" },
      { id: "b", label: "The Republic of Texas" },
      { id: "c", label: "They started the same year" },
      { id: "d", label: "Texas as a U.S. state" },
    ],
    correctId: "b",
    explanation: "Texas declared a republic in 1836. California became a state in 1850.",
  },
  {
    id: "espresso-base",
    difficulty: "medium",
    prompt: "A latte, cappuccino, and americano all start with which shot?",
    choices: [
      { id: "a", label: "Ristretto" },
      { id: "b", label: "Espresso" },
      { id: "c", label: "Macchiato" },
      { id: "d", label: "Cold brew" },
    ],
    correctId: "b",
    explanation: "Espresso. The rest is milk or water on top of that shot.",
  },
  {
    id: "houston-rank",
    difficulty: "medium",
    prompt: "Houston is which-largest city in the United States by population?",
    choices: [
      { id: "a", label: "2nd" },
      { id: "b", label: "3rd" },
      { id: "c", label: "4th" },
      { id: "d", label: "5th" },
    ],
    correctId: "c",
    explanation: "Fourth: New York, Los Angeles, Chicago, then Houston.",
  },
  {
    id: "bourbon-where",
    difficulty: "medium",
    prompt: "To be called bourbon, a whiskey must be made where?",
    choices: [
      { id: "a", label: "Only Kentucky" },
      { id: "b", label: "The United States" },
      { id: "c", label: "Scotland or the U.S." },
      { id: "d", label: "Anywhere, if it’s 51% corn" },
    ],
    correctId: "b",
    explanation: "U.S. law: bourbon is a distinctive product of the United States. Kentucky is tradition, not the legal line.",
  },
  {
    id: "drum-tuba",
    difficulty: "hard",
    prompt: "Which of these is not in a standard rock drum kit?",
    choices: [
      { id: "a", label: "Snare" },
      { id: "b", label: "Hi-hat" },
      { id: "c", label: "Tuba" },
      { id: "d", label: "Crash cymbal" },
    ],
    correctId: "c",
    explanation: "If the tuba is in the kit, something has gone very wrong.",
  },
  {
    id: "spindletop",
    difficulty: "hard",
    prompt: "The 1901 Spindletop gusher that launched the Texas oil boom was near which city?",
    choices: [
      { id: "a", label: "Houston" },
      { id: "b", label: "Beaumont" },
      { id: "c", label: "Midland" },
      { id: "d", label: "Galveston" },
    ],
    correctId: "b",
    explanation: "Beaumont. Houston got rich on it; the well was a short trip east.",
  },
  {
    id: "alamo-year",
    difficulty: "hard",
    prompt: "The Alamo fell in which year?",
    choices: [
      { id: "a", label: "1812" },
      { id: "b", label: "1836" },
      { id: "c", label: "1845" },
      { id: "d", label: "1861" },
    ],
    correctId: "b",
    explanation: "1836, during the Texas Revolution. Statehood came later, in 1845.",
  },
  {
    id: "sam-houston-role",
    difficulty: "hard",
    prompt: "Sam Houston is in the history books as which of these?",
    choices: [
      { id: "a", label: "A U.S. president" },
      { id: "b", label: "President of the Republic of Texas" },
      { id: "c", label: "Mayor of Houston" },
      { id: "d", label: "A Spanish explorer" },
    ],
    correctId: "b",
    explanation: "He was president of the Republic of Texas — and a general — not a U.S. president.",
  },
  {
    id: "moon-houston",
    difficulty: "hard",
    prompt: "After Apollo 11 landed, the first word from the lunar surface was:",
    choices: [
      { id: "a", label: "Eagle" },
      { id: "b", label: "Tranquility" },
      { id: "c", label: "Houston" },
      { id: "d", label: "Armstrong" },
    ],
    correctId: "c",
    explanation: "“Houston, Tranquility Base here. The Eagle has landed.”",
  },
  {
    id: "football-yards",
    difficulty: "hard",
    prompt: "Not counting end zones, how long is an American football field?",
    choices: [
      { id: "a", label: "50 yards" },
      { id: "b", label: "100 yards" },
      { id: "c", label: "120 yards" },
      { id: "d", label: "100 meters" },
    ],
    correctId: "b",
    explanation: "100 yards of field. Each end zone adds 10, which is how people get to 120.",
  },
  {
    id: "dart-20",
    difficulty: "hard",
    prompt: "On a standard dartboard, which number sits at the top?",
    choices: [
      { id: "a", label: "1" },
      { id: "b", label: "20" },
      { id: "c", label: "5" },
      { id: "d", label: "Bull" },
    ],
    correctId: "b",
    explanation: "20 at 12 o’clock. That’s why a dartboard looks “right” even from across the room.",
  },
  {
    id: "proxima",
    difficulty: "hard",
    prompt: "Besides the Sun, which star is closest to Earth?",
    choices: [
      { id: "a", label: "Sirius" },
      { id: "b", label: "Polaris" },
      { id: "c", label: "Proxima Centauri" },
      { id: "d", label: "Betelgeuse" },
    ],
    correctId: "c",
    explanation: "Proxima Centauri, in the Alpha Centauri system. Sirius is brighter, not closer.",
  },
];
