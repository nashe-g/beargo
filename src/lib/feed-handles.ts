const ADJECTIVES = [
  "Neon",
  "Quiet",
  "Blue",
  "Rusty",
  "Late",
  "Honey",
  "Smoke",
  "Lucky",
  "Brass",
  "Midnight",
  "Gold",
  "Velvet",
  "Sharp",
  "Slow",
  "Wild",
  "Copper",
  "Foggy",
  "Bright",
  "Crooked",
  "Sunny",
];

const ANIMALS = [
  "Panda",
  "Otter",
  "Falcon",
  "Bear",
  "Fox",
  "Moth",
  "Hawk",
  "Lynx",
  "Crow",
  "Wolf",
  "Heron",
  "Badger",
  "Mule",
  "Jay",
  "Toad",
  "Cat",
  "Hound",
  "Wren",
  "Elk",
  "Seal",
];

export function randomFeedHandle() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective} ${animal}`;
}

export function numberedFeedHandle(base: string, n: number) {
  return `${base} ${n}`;
}
