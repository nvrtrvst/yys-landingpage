// Daftar umpatan Indonesia untuk moderasi komentar mading. Disimpan di sini (bukan DB).
const BAD_WORDS: string[] = [
  "anjing", "bangsat", "bajingan", "brengsek", "tolol", "goblok", "goblog",
  "idiot", "bodoh", "kampret", "kontol", "memek", "titit", "pler", "plerek",
  "ngentot", "gentot", "babi", "bacot", "pantek", "pantat", "lonte",
  "jancuk", "jancok", "kimak", "jembut", "pelacur", "setan", "iblis",
  "sundal", "laknat", "keparat", "celeng", "bangke", "bangkai", "kacung", "tahi",
];

// Normalisasi untuk menangkap obfuscasi sederhana (mis. "t0l0l", "t o l o l").
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.\-\s]/g, "")
    .replace(/[0]/g, "o")
    .replace(/[1]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5]/g, "s")
    .replace(/[7]/g, "t");
}

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const norm = normalize(text);
  return BAD_WORDS.some((word) => {
    const bounded = new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(lower);
    return bounded || norm.includes(word);
  });
}

export function getProfanityWords(): string[] {
  return [...BAD_WORDS];
}
