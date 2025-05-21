// A simplified English dictionary for word validation
// In a production app, this would be a more comprehensive API or dictionary

// Common English words that might appear in the game
const commonWords = new Set([
  "and", "are", "art", "ask", "ate",
  "bad", "bag", "bat", "bed", "bet", "big", "bit", "box", "boy", "bug", "but", "buy",
  "can", "cap", "car", "cat", "cry", "cup", "cut",
  "dad", "day", "did", "dig", "dog", "dot", "dry",
  "ear", "eat", "egg", "end", "eye",
  "far", "fat", "few", "fig", "fit", "fix", "fly", "for", "fox", "fun",
  "get", "got", "gum", "gun", "gut",
  "had", "ham", "has", "hat", "her", "hid", "him", "his", "hit", "hop", "hot", "how", "hub", "hug", "hut",
  "ice", "ill", "ink", "its",
  "jam", "jar", "jaw", "jet", "job", "jog", "joy", "jug",
  "key", "kid", "kit",
  "lab", "lad", "lag", "lap", "law", "lay", "leg", "let", "lid", "lie", "lip", "lit", "log", "lot", "low",
  "mad", "man", "map", "mat", "may", "men", "met", "mix", "mob", "mom", "mop", "mud", "mug",
  "nap", "net", "new", "nod", "not", "now", "nut",
  "odd", "off", "oil", "old", "one", "our", "out", "owl", "own",
  "pad", "pan", "paw", "pay", "pen", "pet", "pie", "pig", "pin", "pit", "pot", "pry",
  "ram", "ran", "rat", "raw", "red", "rib", "rid", "rip", "rob", "rod", "rot", "row", "rub", "rug", "run",
  "sad", "sag", "sat", "saw", "say", "sea", "see", "set", "sew", "she", "shy", "sin", "sip", "sit", "six", "ski", "sky", "sly", "sod", "son", "sow", "spa", "spy", "sum", "sun",
  "tag", "tan", "tap", "tar", "tax", "tea", "ten", "the", "tie", "tin", "tip", "toe", "too", "top", "toy", "try", "tub", "tug", "two",
  "use",
  "van", "vat", "vet", "vex", "via", "vie", "vow",
  "wag", "war", "was", "wax", "way", "web", "wed", "wet", "who", "why", "wig", "win", "wit", "wok", "won", "woo", "wow",
  "yak", "yam", "yap", "yaw", "yes", "yet", "yew", "yip", "you",
  "zap", "zig", "zip", "zoo",
  // Add more common words like "park", "spark", etc.
  "park", "dark", "mark", "bark", "lark", "spark", "stark",
  "magic", "basic", "logic", "music", "cubic", "comic",
  "mount", "count", "fount", "blunt", "grunt", "point",
  "realm", "cream", "dream", "steam", "gleam", "seam",
  "spell", "shell", "dwell", "swell", "smell", "dell",
  "mystic", "cosmic", "public", "fabric", "frolic",
  "wizard", "lizard", "blizzard", "gizzard"
]);

export function isWordValid(word: string): boolean {
  // Convert to lowercase for case-insensitive comparison
  const lowercaseWord = word.toLowerCase();
  
  // Check if word is in dictionary
  return commonWords.has(lowercaseWord);
}

export function getValidWordsFromLetters(letters: string[]): string[] {
  // This is a simplified implementation
  // In a real app, you would use a more sophisticated algorithm
  // to find all valid words that can be formed from the given letters
  
  const lettersSet = new Set(letters.map(l => l.toLowerCase()));
  return Array.from(commonWords).filter(word => {
    const wordChars = word.split('');
    return wordChars.every(char => lettersSet.has(char));
  });
}
