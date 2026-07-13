// Daftar kata kasar / umpatan bahasa Indonesia untuk moderasi komentar mading.
// Disimpan di sini (bukan DB) agar sederhana; dapat diperluas sewaktu-waktu.

const BAD_WORDS: string[] = [
  // umpatan umum
  "anjing", "bangsat", "bajingan", "brengsek", "tolol", "goblok", "goblog",
  "idiot", "bodoh", "kampret", "kontol", "memek", "titit", "pler", "plerek",
  "ngentot", "gentot", "tai", "tahi", "sial", "sinting", "edan", "gila",
  "babi", "bacot", "bacot", "pantek", "pantat", "perek", "lonte", "lonte",
  "jancuk", "jancok", "cuk", "cok", "kimak", "jembut", "jembut", "pelacur",
  "setan", "iblis", "sundal", "sundal", "laknat", "brengsek", "asw", "asu",
  "bangsat", "keparat", "celeng", "celeng", "bangke", "bangkai", "bajingan",
  "kacung", "nyinyir", "sumpah", "astagfirullah", "tho", "the", "gak", "bodoh",
  "tolol", "goblok", "goblog", "idiot", "kampret", "kontol", "memek", "titit",
  // variasi huruf berulang / leet sederhana ditangani di normalisasi
];

// Normalisasi: lowercase, buang spasi & titik & pengganti voyel umum agar
// obfuscasi sederhana (mis. "t0l0l", "t o l o l") tetap tertangkap.
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
  const norm = normalize(text);
  return BAD_WORDS.some((w) => norm.includes(w));
}

export function getProfanityWords(): string[] {
  return [...BAD_WORDS];
}
