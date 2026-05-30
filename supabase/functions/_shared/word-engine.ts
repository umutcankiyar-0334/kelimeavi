// supabase/functions/_shared/word-engine.ts
// Port of the complete word engine logic for Deno environment in Supabase Edge Functions.

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface WordEntry {
  word: string;
  length: number;
  difficulty: DifficultyLevel;
  frequency: number;
  hasTurkishChars: boolean;
}

export interface RoundConfig {
  roundNumber: number;
  totalRounds: number;
}

export interface ScoreResult {
  isCorrect: boolean;
  baseScore: number;
  speedBonus: number;
  comboBonus: number;
  scoreAwarded: number;
  responseTimeMs: number;
}

// Curated starter dictionary
export const trWords: WordEntry[] = [
  // ─── EASY ───────────────────────────────────────────────────────────────
  { word: "masa", length: 4, difficulty: "easy", frequency: 980, hasTurkishChars: false },
  { word: "fare", length: 4, difficulty: "easy", frequency: 920, hasTurkishChars: false },
  { word: "bale", length: 4, difficulty: "easy", frequency: 850, hasTurkishChars: false },
  { word: "dere", length: 4, difficulty: "easy", frequency: 940, hasTurkishChars: false },
  { word: "yara", length: 4, difficulty: "easy", frequency: 930, hasTurkishChars: false },
  { word: "para", length: 4, difficulty: "easy", frequency: 990, hasTurkishChars: false },
  { word: "arpa", length: 4, difficulty: "easy", frequency: 860, hasTurkishChars: false },
  { word: "tane", length: 4, difficulty: "easy", frequency: 960, hasTurkishChars: false },
  { word: "adam", length: 4, difficulty: "easy", frequency: 995, hasTurkishChars: false },
  { word: "anne", length: 4, difficulty: "easy", frequency: 998, hasTurkishChars: false },
  { word: "baba", length: 4, difficulty: "easy", frequency: 998, hasTurkishChars: false },
  { word: "kedi", length: 4, difficulty: "easy", frequency: 985, hasTurkishChars: false },
  { word: "kurt", length: 4, difficulty: "easy", frequency: 970, hasTurkishChars: false },
  { word: "gemi", length: 4, difficulty: "easy", frequency: 965, hasTurkishChars: false },
  { word: "elma", length: 4, difficulty: "easy", frequency: 985, hasTurkishChars: false },
  { word: "araba", length: 5, difficulty: "easy", frequency: 990, hasTurkishChars: false },
  { word: "kalem", length: 5, difficulty: "easy", frequency: 988, hasTurkishChars: false },
  { word: "okul", length: 4, difficulty: "easy", frequency: 990, hasTurkishChars: false },
  { word: "deniz", length: 5, difficulty: "easy", frequency: 985, hasTurkishChars: false },
  { word: "kitap", length: 5, difficulty: "easy", frequency: 988, hasTurkishChars: false },
  { word: "tahta", length: 5, difficulty: "easy", frequency: 960, hasTurkishChars: false },
  { word: "ekmek", length: 5, difficulty: "easy", frequency: 990, hasTurkishChars: false },
  { word: "pilav", length: 5, difficulty: "easy", frequency: 975, hasTurkishChars: false },
  { word: "tavan", length: 5, difficulty: "easy", frequency: 970, hasTurkishChars: false },
  { word: "duvar", length: 5, difficulty: "easy", frequency: 975, hasTurkishChars: false },
  { word: "nehir", length: 5, difficulty: "easy", frequency: 965, hasTurkishChars: false },
  { word: "orman", length: 5, difficulty: "easy", frequency: 975, hasTurkishChars: false },
  { word: "bulut", length: 5, difficulty: "easy", frequency: 980, hasTurkishChars: false },
  { word: "limon", length: 5, difficulty: "easy", frequency: 982, hasTurkishChars: false },
  { word: "meyve", length: 5, difficulty: "easy", frequency: 984, hasTurkishChars: false },
  { word: "sebze", length: 5, difficulty: "easy", frequency: 982, hasTurkishChars: false },
  { word: "elbise", length: 6, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "ceket", length: 5, difficulty: "easy", frequency: 975, hasTurkishChars: false },
  { word: "tabak", length: 5, difficulty: "easy", frequency: 984, hasTurkishChars: false },
  { word: "mutfak", length: 6, difficulty: "easy", frequency: 985, hasTurkishChars: false },
  { word: "yatak", length: 5, difficulty: "easy", frequency: 988, hasTurkishChars: false },
  { word: "pencere", length: 7, difficulty: "easy", frequency: 983, hasTurkishChars: false },
  { word: "bahce", length: 5, difficulty: "easy", frequency: 982, hasTurkishChars: false },
  { word: "gunes", length: 5, difficulty: "easy", frequency: 988, hasTurkishChars: false },
  { word: "yildiz", length: 6, difficulty: "easy", frequency: 980, hasTurkishChars: false },
  { word: "cicek", length: 5, difficulty: "easy", frequency: 984, hasTurkishChars: false },
  { word: "kapi", length: 4, difficulty: "easy", frequency: 975, hasTurkishChars: false },
  { word: "seker", length: 5, difficulty: "easy", frequency: 985, hasTurkishChars: false },
  { word: "agac", length: 4, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "canta", length: 5, difficulty: "easy", frequency: 985, hasTurkishChars: false },
  { word: "sapka", length: 5, difficulty: "easy", frequency: 980, hasTurkishChars: false },
  { word: "corap", length: 5, difficulty: "easy", frequency: 982, hasTurkishChars: false },
  { word: "kasik", length: 5, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "catal", length: 5, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "bardak", length: 6, difficulty: "easy", frequency: 985, hasTurkishChars: false },
  { word: "tencere", length: 7, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "sandalye", length: 8, difficulty: "easy", frequency: 982, hasTurkishChars: false },
  { word: "merdiven", length: 8, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "mavi", length: 4, difficulty: "easy", frequency: 970, hasTurkishChars: false },
  { word: "sari", length: 4, difficulty: "easy", frequency: 965, hasTurkishChars: false },
  { word: "yesil", length: 5, difficulty: "easy", frequency: 970, hasTurkishChars: false },
  { word: "mor", length: 3, difficulty: "easy", frequency: 960, hasTurkishChars: false },
  { word: "pembe", length: 5, difficulty: "easy", frequency: 955, hasTurkishChars: false },
  { word: "beyaz", length: 5, difficulty: "easy", frequency: 968, hasTurkishChars: false },
  { word: "siyah", length: 5, difficulty: "easy", frequency: 965, hasTurkishChars: false },
  { word: "gri", length: 3, difficulty: "easy", frequency: 955, hasTurkishChars: false },
  { word: "oyun", length: 4, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "plaj", length: 4, difficulty: "easy", frequency: 860, hasTurkishChars: false },
  { word: "tepe", length: 4, difficulty: "easy", frequency: 960, hasTurkishChars: false },
  { word: "haber", length: 5, difficulty: "easy", frequency: 870, hasTurkishChars: false },
  { word: "gazete", length: 6, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "dergi", length: 5, difficulty: "easy", frequency: 852, hasTurkishChars: false },
  { word: "radyo", length: 5, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "internet", length: 8, difficulty: "easy", frequency: 880, hasTurkishChars: false },
  { word: "telefon", length: 7, difficulty: "easy", frequency: 882, hasTurkishChars: false },
  { word: "tablet", length: 6, difficulty: "easy", frequency: 858, hasTurkishChars: false },
  { word: "kamera", length: 6, difficulty: "easy", frequency: 860, hasTurkishChars: false },
  { word: "video", length: 5, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "banka", length: 5, difficulty: "easy", frequency: 870, hasTurkishChars: false },
  { word: "sehir", length: 5, difficulty: "easy", frequency: 880, hasTurkishChars: false },
  { word: "kasaba", length: 6, difficulty: "easy", frequency: 858, hasTurkishChars: false },
  { word: "koy", length: 3, difficulty: "easy", frequency: 875, hasTurkishChars: false },
  { word: "mahalle", length: 7, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "sokak", length: 5, difficulty: "easy", frequency: 868, hasTurkishChars: false },
  { word: "cadde", length: 5, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "meydan", length: 6, difficulty: "easy", frequency: 855, hasTurkishChars: false },
  { word: "park", length: 4, difficulty: "easy", frequency: 870, hasTurkishChars: false },
  { word: "kopru", length: 5, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "depo", length: 4, difficulty: "easy", frequency: 848, hasTurkishChars: false },
  { word: "sahil", length: 5, difficulty: "easy", frequency: 845, hasTurkishChars: false },
  { word: "dag", length: 3, difficulty: "easy", frequency: 978, hasTurkishChars: false },
  { word: "gol", length: 3, difficulty: "easy", frequency: 970, hasTurkishChars: false },
  { word: "col", length: 3, difficulty: "easy", frequency: 962, hasTurkishChars: false },
  { word: "hava", length: 4, difficulty: "easy", frequency: 880, hasTurkishChars: false },
  { word: "toprak", length: 6, difficulty: "easy", frequency: 868, hasTurkishChars: false },
  { word: "ates", length: 4, difficulty: "easy", frequency: 875, hasTurkishChars: false },
  { word: "kar", length: 3, difficulty: "easy", frequency: 880, hasTurkishChars: false },
  { word: "yagmur", length: 6, difficulty: "easy", frequency: 878, hasTurkishChars: false },
  { word: "sel", length: 3, difficulty: "easy", frequency: 860, hasTurkishChars: false },
  { word: "afet", length: 4, difficulty: "easy", frequency: 818, hasTurkishChars: false },
  { word: "cop", length: 3, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "asi", length: 3, difficulty: "easy", frequency: 960, hasTurkishChars: false },
  { word: "sarki", length: 5, difficulty: "easy", frequency: 882, hasTurkishChars: false },
  { word: "dans", length: 4, difficulty: "easy", frequency: 870, hasTurkishChars: false },
  { word: "gitar", length: 5, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "davul", length: 5, difficulty: "easy", frequency: 848, hasTurkishChars: false },
  { word: "piyano", length: 6, difficulty: "easy", frequency: 858, hasTurkishChars: false },
  { word: "hikaye", length: 6, difficulty: "easy", frequency: 855, hasTurkishChars: false },
  { word: "masal", length: 5, difficulty: "easy", frequency: 850, hasTurkishChars: false },
  { word: "hasta", length: 5, difficulty: "easy", frequency: 882, hasTurkishChars: false },
  { word: "saz", length: 3, difficulty: "easy", frequency: 850, hasTurkishChars: false },
  { word: "seçim", length: 5, difficulty: "easy", frequency: 838, hasTurkishChars: true },
  { word: "aday", length: 4, difficulty: "easy", frequency: 825, hasTurkishChars: false },
  { word: "parti", length: 5, difficulty: "easy", frequency: 830, hasTurkishChars: false },
  { word: "karar", length: 5, difficulty: "easy", frequency: 862, hasTurkishChars: false },
  { word: "doğa", length: 4, difficulty: "easy", frequency: 875, hasTurkishChars: true },
  { word: "çevre", length: 5, difficulty: "easy", frequency: 868, hasTurkishChars: true },
  { word: "köpek", length: 5, difficulty: "easy", frequency: 985, hasTurkishChars: true },
  { word: "yılan", length: 5, difficulty: "easy", frequency: 950, hasTurkishChars: true },
  { word: "çorba", length: 5, difficulty: "easy", frequency: 985, hasTurkishChars: true },
  { word: "rüzgar", length: 6, difficulty: "easy", frequency: 870, hasTurkishChars: true },
  { word: "güneş", length: 5, difficulty: "easy", frequency: 988, hasTurkishChars: true },
  { word: "çiçek", length: 5, difficulty: "easy", frequency: 984, hasTurkishChars: true },
  { word: "bahçe", length: 5, difficulty: "easy", frequency: 982, hasTurkishChars: true },
  { word: "yıldız", length: 6, difficulty: "easy", frequency: 980, hasTurkishChars: true },
  { word: "şeker", length: 5, difficulty: "easy", frequency: 985, hasTurkishChars: true },
  { word: "ağaç", length: 4, difficulty: "easy", frequency: 978, hasTurkishChars: true },
  { word: "çanta", length: 5, difficulty: "easy", frequency: 985, hasTurkishChars: true },
  { word: "gözlük", length: 6, difficulty: "easy", frequency: 978, hasTurkishChars: true },
  { word: "şapka", length: 5, difficulty: "easy", frequency: 980, hasTurkishChars: true },
  { word: "çorap", length: 5, difficulty: "easy", frequency: 982, hasTurkishChars: true },
  { word: "kaşık", length: 5, difficulty: "easy", frequency: 978, hasTurkishChars: true },
  { word: "çatal", length: 5, difficulty: "easy", frequency: 978, hasTurkishChars: true },
  { word: "kapı", length: 4, difficulty: "easy", frequency: 975, hasTurkishChars: true },
  { word: "kış", length: 3, difficulty: "easy", frequency: 975, hasTurkishChars: true },
  { word: "taş", length: 3, difficulty: "easy", frequency: 970, hasTurkishChars: true },
  { word: "şehir", length: 5, difficulty: "easy", frequency: 880, hasTurkishChars: true },

  // ─── MEDIUM ─────────────────────────────────────────────────────────────
  { word: "bilgi", length: 5, difficulty: "medium", frequency: 870, hasTurkishChars: false },
  { word: "resim", length: 5, difficulty: "medium", frequency: 860, hasTurkishChars: false },
  { word: "tablo", length: 5, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "sahne", length: 5, difficulty: "medium", frequency: 830, hasTurkishChars: false },
  { word: "fiyat", length: 5, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "hayat", length: 5, difficulty: "medium", frequency: 875, hasTurkishChars: false },
  { word: "merak", length: 5, difficulty: "medium", frequency: 850, hasTurkishChars: false },
  { word: "zaman", length: 5, difficulty: "medium", frequency: 900, hasTurkishChars: false },
  { word: "insan", length: 5, difficulty: "medium", frequency: 890, hasTurkishChars: false },
  { word: "sistem", length: 6, difficulty: "medium", frequency: 870, hasTurkishChars: false },
  { word: "proje", length: 5, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "devlet", length: 6, difficulty: "medium", frequency: 870, hasTurkishChars: false },
  { word: "toplum", length: 6, difficulty: "medium", frequency: 865, hasTurkishChars: false },
  { word: "siyaset", length: 7, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "ekonomi", length: 7, difficulty: "medium", frequency: 842, hasTurkishChars: false },
  { word: "makine", length: 6, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "fabrika", length: 7, difficulty: "medium", frequency: 848, hasTurkishChars: false },
  { word: "doktor", length: 6, difficulty: "medium", frequency: 870, hasTurkishChars: false },
  { word: "avukat", length: 6, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "asker", length: 5, difficulty: "medium", frequency: 862, hasTurkishChars: false },
  { word: "sporcu", length: 6, difficulty: "medium", frequency: 850, hasTurkishChars: false },
  { word: "yazar", length: 5, difficulty: "medium", frequency: 858, hasTurkishChars: false },
  { word: "ressam", length: 6, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "mimar", length: 5, difficulty: "medium", frequency: 845, hasTurkishChars: false },
  { word: "pilot", length: 5, difficulty: "medium", frequency: 858, hasTurkishChars: false },
  { word: "kaptan", length: 6, difficulty: "medium", frequency: 852, hasTurkishChars: false },
  { word: "liman", length: 5, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "vapur", length: 5, difficulty: "medium", frequency: 848, hasTurkishChars: false },
  { word: "yelken", length: 6, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "sinema", length: 6, difficulty: "medium", frequency: 858, hasTurkishChars: false },
  { word: "konser", length: 6, difficulty: "medium", frequency: 848, hasTurkishChars: false },
  { word: "sergi", length: 5, difficulty: "medium", frequency: 828, hasTurkishChars: false },
  { word: "turnuva", length: 7, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "hastane", length: 7, difficulty: "medium", frequency: 865, hasTurkishChars: false },
  { word: "manav", length: 5, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "kasap", length: 5, difficulty: "medium", frequency: 842, hasTurkishChars: false },
  { word: "lokanta", length: 7, difficulty: "medium", frequency: 850, hasTurkishChars: false },
  { word: "market", length: 6, difficulty: "medium", frequency: 860, hasTurkishChars: false },
  { word: "dukkan", length: 6, difficulty: "medium", frequency: 845, hasTurkishChars: false },
  { word: "kuyumcu", length: 7, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "terzi", length: 5, difficulty: "medium", frequency: 828, hasTurkishChars: false },
  { word: "berber", length: 6, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "sabah", length: 5, difficulty: "medium", frequency: 885, hasTurkishChars: false },
  { word: "gece", length: 4, difficulty: "medium", frequency: 888, hasTurkishChars: false },
  { word: "hafta", length: 5, difficulty: "medium", frequency: 875, hasTurkishChars: false },
  { word: "mevsim", length: 6, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "bahar", length: 5, difficulty: "medium", frequency: 858, hasTurkishChars: false },
  { word: "sonbahar", length: 8, difficulty: "medium", frequency: 845, hasTurkishChars: false },
  { word: "renk", length: 4, difficulty: "medium", frequency: 878, hasTurkishChars: false },
  { word: "altin", length: 5, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "bronz", length: 5, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "tahmin", length: 6, difficulty: "medium", frequency: 838, hasTurkishChars: false },
  { word: "takim", length: 5, difficulty: "medium", frequency: 860, hasTurkishChars: false },
  { word: "hakem", length: 5, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "kumsal", length: 6, difficulty: "medium", frequency: 835, hasTurkishChars: false },
  { word: "vadi", length: 4, difficulty: "medium", frequency: 830, hasTurkishChars: false },
  { word: "volkan", length: 6, difficulty: "medium", frequency: 818, hasTurkishChars: false },
  { word: "magara", length: 6, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "bataklık", length: 8, difficulty: "medium", frequency: 802, hasTurkishChars: true },
  { word: "uçurum", length: 6, difficulty: "medium", frequency: 810, hasTurkishChars: true },
  { word: "mutlu", length: 5, difficulty: "medium", frequency: 900, hasTurkishChars: false },
  { word: "yorgun", length: 6, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "saglıklı", length: 8, difficulty: "medium", frequency: 845, hasTurkishChars: true },
  { word: "kosmak", length: 6, difficulty: "medium", frequency: 870, hasTurkishChars: false },
  { word: "yuzmek", length: 6, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "uçmak", length: 5, difficulty: "medium", frequency: 860, hasTurkishChars: true },
  { word: "keman", length: 5, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "trompet", length: 7, difficulty: "medium", frequency: 798, hasTurkishChars: false },
  { word: "klarnet", length: 7, difficulty: "medium", frequency: 790, hasTurkishChars: false },
  { word: "saksofon", length: 8, difficulty: "medium", frequency: 782, hasTurkishChars: false },
  { word: "akordeon", length: 8, difficulty: "medium", frequency: 775, hasTurkishChars: false },
  { word: "zurna", length: 5, difficulty: "medium", frequency: 780, hasTurkishChars: false },
  { word: "tavla", length: 5, difficulty: "medium", frequency: 810, hasTurkishChars: false },
  { word: "domino", length: 6, difficulty: "medium", frequency: 800, hasTurkishChars: false },
  { word: "iskambil", length: 8, difficulty: "medium", frequency: 785, hasTurkishChars: false },
  { word: "bulmaca", length: 7, difficulty: "medium", frequency: 815, hasTurkishChars: false },
  { word: "bilmece", length: 7, difficulty: "medium", frequency: 808, hasTurkishChars: false },
  { word: "roman", length: 5, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "deneme", length: 6, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "makale", length: 6, difficulty: "medium", frequency: 815, hasTurkishChars: false },
  { word: "uygulama", length: 8, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "borsa", length: 5, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "kredi", length: 5, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "sigorta", length: 7, difficulty: "medium", frequency: 835, hasTurkishChars: false },
  { word: "vergi", length: 5, difficulty: "medium", frequency: 838, hasTurkishChars: false },
  { word: "fatura", length: 6, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "hukuk", length: 5, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "mahkeme", length: 7, difficulty: "medium", frequency: 830, hasTurkishChars: false },
  { word: "ceza", length: 4, difficulty: "medium", frequency: 855, hasTurkishChars: false },
  { word: "delil", length: 5, difficulty: "medium", frequency: 818, hasTurkishChars: false },
  { word: "adalet", length: 6, difficulty: "medium", frequency: 830, hasTurkishChars: false },
  { word: "baris", length: 5, difficulty: "medium", frequency: 845, hasTurkishChars: false },
  { word: "savas", length: 5, difficulty: "medium", frequency: 848, hasTurkishChars: false },
  { word: "zafer", length: 5, difficulty: "medium", frequency: 838, hasTurkishChars: false },
  { word: "yenilgi", length: 7, difficulty: "medium", frequency: 818, hasTurkishChars: false },
  { word: "mucadele", length: 8, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "strateji", length: 8, difficulty: "medium", frequency: 815, hasTurkishChars: false },
  { word: "taktik", length: 6, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "savunma", length: 7, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "reform", length: 6, difficulty: "medium", frequency: 815, hasTurkishChars: false },
  { word: "devrim", length: 6, difficulty: "medium", frequency: 818, hasTurkishChars: false },
  { word: "isyan", length: 5, difficulty: "medium", frequency: 808, hasTurkishChars: false },
  { word: "darbe", length: 5, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "nufus", length: 5, difficulty: "medium", frequency: 800, hasTurkishChars: false },
  { word: "deprem", length: 6, difficulty: "medium", frequency: 830, hasTurkishChars: false },
  { word: "kasirga", length: 7, difficulty: "medium", frequency: 808, hasTurkishChars: false },
  { word: "tsunami", length: 7, difficulty: "medium", frequency: 790, hasTurkishChars: false },
  { word: "kuraklık", length: 8, difficulty: "medium", frequency: 800, hasTurkishChars: true },
  { word: "kirlilik", length: 8, difficulty: "medium", frequency: 810, hasTurkishChars: false },
  { word: "iklim", length: 5, difficulty: "medium", frequency: 838, hasTurkishChars: false },
  { word: "elektrik", length: 8, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "enerji", length: 6, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "atom", length: 4, difficulty: "hard", frequency: 720, hasTurkishChars: false }, // re-categorized in edge cases
  { word: "demir", length: 5, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "celik", length: 5, difficulty: "medium", frequency: 830, hasTurkishChars: false },
  { word: "karbon", length: 6, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "genel", length: 5, difficulty: "medium", frequency: 878, hasTurkishChars: false },
  { word: "kamusal", length: 7, difficulty: "medium", frequency: 800, hasTurkishChars: false },
  { word: "ulusal", length: 6, difficulty: "medium", frequency: 818, hasTurkishChars: false },
  { word: "yerel", length: 5, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "evrensel", length: 8, difficulty: "medium", frequency: 805, hasTurkishChars: false },
  { word: "terminal", length: 8, difficulty: "medium", frequency: 808, hasTurkishChars: false },
  { word: "otoyol", length: 6, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "yatırım", length: 7, difficulty: "medium", frequency: 830, hasTurkishChars: true },
  { word: "şirket", length: 6, difficulty: "medium", frequency: 860, hasTurkishChars: true },
  { word: "müzik", length: 5, difficulty: "medium", frequency: 850, hasTurkishChars: true },
  { word: "büyük", length: 5, difficulty: "medium", frequency: 900, hasTurkishChars: true },
  { word: "küçük", length: 5, difficulty: "medium", frequency: 900, hasTurkishChars: true },
  { word: "güzel", length: 5, difficulty: "medium", frequency: 900, hasTurkishChars: true },
  { word: "dünya", length: 5, difficulty: "medium", frequency: 895, hasTurkishChars: true },
  { word: "bölüm", length: 5, difficulty: "medium", frequency: 860, hasTurkishChars: true },
  { word: "akşam", length: 5, difficulty: "medium", frequency: 880, hasTurkishChars: true },
  { word: "öğlen", length: 5, difficulty: "medium", frequency: 870, hasTurkishChars: true },
  { word: "kırmızı", length: 7, difficulty: "medium", frequency: 862, hasTurkishChars: true },
  { word: "turuncu", length: 7, difficulty: "medium", frequency: 848, hasTurkishChars: false },
  { word: "gümüş", length: 5, difficulty: "medium", frequency: 845, hasTurkishChars: true },
  { word: "uçak", length: 4, difficulty: "medium", frequency: 870, hasTurkishChars: true },
  { word: "müze", length: 4, difficulty: "medium", frequency: 845, hasTurkishChars: true },
  { word: "tiyatro", length: 7, difficulty: "medium", frequency: 835, hasTurkishChars: false },
  { word: "eczane", length: 6, difficulty: "medium", frequency: 858, hasTurkishChars: false },
  { word: "fırın", length: 5, difficulty: "medium", frequency: 848, hasTurkishChars: true },
  { word: "çarşı", length: 5, difficulty: "medium", frequency: 848, hasTurkishChars: true },
  { word: "şelale", length: 6, difficulty: "medium", frequency: 820, hasTurkishChars: true },
  { word: "ırmak", length: 5, difficulty: "medium", frequency: 832, hasTurkishChars: true },
  { word: "özgürlük", length: 8, difficulty: "medium", frequency: 840, hasTurkishChars: true },
  { word: "eşitlik", length: 7, difficulty: "medium", frequency: 828, hasTurkishChars: true },
  { word: "barış", length: 5, difficulty: "medium", frequency: 845, hasTurkishChars: true },
  { word: "savaş", length: 5, difficulty: "medium", frequency: 848, hasTurkishChars: true },
  { word: "tanık", length: 5, difficulty: "medium", frequency: 812, hasTurkishChars: true },
  { word: "yargı", length: 5, difficulty: "medium", frequency: 818, hasTurkishChars: true },
  { word: "üzgün", length: 5, difficulty: "medium", frequency: 870, hasTurkishChars: true },
  { word: "kızgın", length: 6, difficulty: "medium", frequency: 855, hasTurkishChars: true },
  { word: "şaşkın", length: 6, difficulty: "medium", frequency: 840, hasTurkishChars: true },
  { word: "heyecanlı", length: 9, difficulty: "medium", frequency: 845, hasTurkishChars: true },
  { word: "küresel", length: 7, difficulty: "medium", frequency: 810, hasTurkishChars: true },
  { word: "özel", length: 4, difficulty: "medium", frequency: 878, hasTurkishChars: true },
  { word: "bağlama", length: 7, difficulty: "medium", frequency: 798, hasTurkishChars: true },
  { word: "satranç", length: 7, difficulty: "medium", frequency: 820, hasTurkishChars: true },
  { word: "şiir", length: 4, difficulty: "medium", frequency: 835, hasTurkishChars: true },
  { word: "sözleşme", length: 8, difficulty: "medium", frequency: 830, hasTurkishChars: true },
  { word: "göç", length: 3, difficulty: "medium", frequency: 760, hasTurkishChars: true },
  { word: "tünel", length: 5, difficulty: "medium", frequency: 830, hasTurkishChars: true },
  { word: "rıhtım", length: 6, difficulty: "medium", frequency: 788, hasTurkishChars: true },
  { word: "havalimanı", length: 10, difficulty: "medium", frequency: 825, hasTurkishChars: true },
  { word: "mühendis", length: 8, difficulty: "medium", frequency: 840, hasTurkishChars: false },
  { word: "öğretmen", length: 8, difficulty: "medium", frequency: 860, hasTurkishChars: true },
  { word: "şarkıcı", length: 7, difficulty: "medium", frequency: 848, hasTurkishChars: true },
  { word: "fotoğraf", length: 8, difficulty: "medium", frequency: 858, hasTurkishChars: true },
  { word: "iktidar", length: 7, difficulty: "medium", frequency: 820, hasTurkishChars: false },
  { word: "saldırı", length: 7, difficulty: "medium", frequency: 810, hasTurkishChars: true },
  { word: "bireysel", length: 8, difficulty: "medium", frequency: 798, hasTurkishChars: false },
  { word: "kütle", length: 5, difficulty: "medium", frequency: 680, hasTurkishChars: true },

  // ─── HARD ───────────────────────────────────────────────────────────────
  { word: "felsefe", length: 7, difficulty: "hard", frequency: 660, hasTurkishChars: false },
  { word: "estetik", length: 7, difficulty: "hard", frequency: 640, hasTurkishChars: false },
  { word: "mitoloji", length: 8, difficulty: "hard", frequency: 590, hasTurkishChars: false },
  { word: "genetik", length: 7, difficulty: "hard", frequency: 628, hasTurkishChars: false },
  { word: "demokrasi", length: 9, difficulty: "hard", frequency: 680, hasTurkishChars: false },
  { word: "parlamento", length: 10, difficulty: "hard", frequency: 660, hasTurkishChars: false },
  { word: "anayasa", length: 7, difficulty: "hard", frequency: 680, hasTurkishChars: false },
  { word: "teknoloji", length: 9, difficulty: "hard", frequency: 720, hasTurkishChars: false },
  { word: "algoritma", length: 9, difficulty: "hard", frequency: 640, hasTurkishChars: false },
  { word: "siber", length: 5, difficulty: "hard", frequency: 620, hasTurkishChars: false },
  { word: "kripto", length: 6, difficulty: "hard", frequency: 600, hasTurkishChars: false },
  { word: "nöroloji", length: 8, difficulty: "hard", frequency: 560, hasTurkishChars: true },
  { word: "diyabet", length: 7, difficulty: "hard", frequency: 620, hasTurkishChars: false },
  { word: "kolesterol", length: 10, difficulty: "hard", frequency: 600, hasTurkishChars: false },
  { word: "protein", length: 7, difficulty: "hard", frequency: 640, hasTurkishChars: false },
  { word: "vitamin", length: 7, difficulty: "hard", frequency: 660, hasTurkishChars: false },
  { word: "mineral", length: 7, difficulty: "hard", frequency: 620, hasTurkishChars: false },
  { word: "kalsiyum", length: 8, difficulty: "hard", frequency: 600, hasTurkishChars: false },
  { word: "elektron", length: 8, difficulty: "hard", frequency: 640, hasTurkishChars: false },
  { word: "proton", length: 6, difficulty: "hard", frequency: 600, hasTurkishChars: false },
  { word: "kuantum", length: 7, difficulty: "hard", frequency: 560, hasTurkishChars: false },
  { word: "manyetik", length: 8, difficulty: "hard", frequency: 600, hasTurkishChars: false },
  { word: "radyasyon", length: 9, difficulty: "hard", frequency: 600, hasTurkishChars: false },
  { word: "frekans", length: 7, difficulty: "hard", frequency: 580, hasTurkishChars: false },
  { word: "spektrum", length: 8, difficulty: "hard", frequency: 540, hasTurkishChars: false },
  { word: "mikroskop", length: 9, difficulty: "hard", frequency: 580, hasTurkishChars: false },
  { word: "teleskop", length: 8, difficulty: "hard", frequency: 580, hasTurkishChars: false },
  { word: "termometre", length: 10, difficulty: "hard", frequency: 560, hasTurkishChars: false },
  { word: "diplomasi", length: 9, difficulty: "hard", frequency: 650, hasTurkishChars: false },
  { word: "koalisyon", length: 9, difficulty: "hard", frequency: 640, hasTurkishChars: false },
  { word: "muhalefet", length: 9, difficulty: "hard", frequency: 630, hasTurkishChars: false },
  { word: "ittifak", length: 7, difficulty: "hard", frequency: 680, hasTurkishChars: false },
  { word: "ambargo", length: 7, difficulty: "hard", frequency: 580, hasTurkishChars: false },
  { word: "mülteci", length: 7, difficulty: "hard", frequency: 640, hasTurkishChars: true },
  { word: "kentleşme", length: 9, difficulty: "hard", frequency: 580, hasTurkishChars: true },
  { word: "erozyon", length: 7, difficulty: "hard", frequency: 580, hasTurkishChars: false },
  { word: "nükleer", length: 7, difficulty: "hard", frequency: 640, hasTurkishChars: true },
  { word: "bürokrasi", length: 9, difficulty: "hard", frequency: 620, hasTurkishChars: true },
  { word: "müzisyen", length: 8, difficulty: "hard", frequency: 650, hasTurkishChars: true },
  { word: "oligarşi", length: 8, difficulty: "hard", frequency: 540, hasTurkishChars: true },
  { word: "monarşi", length: 7, difficulty: "hard", frequency: 560, hasTurkishChars: true },
  { word: "müzakere", length: 8, difficulty: "hard", frequency: 620, hasTurkishChars: true },
  { word: "mantık", length: 6, difficulty: "hard", frequency: 670, hasTurkishChars: true },
  { word: "yazılım", length: 7, difficulty: "hard", frequency: 680, hasTurkishChars: true },
  { word: "donanım", length: 7, difficulty: "hard", frequency: 660, hasTurkishChars: true },
  { word: "veritabanı", length: 10, difficulty: "hard", frequency: 610, hasTurkishChars: true },
  { word: "biyoloji", length: 8, difficulty: "hard", frequency: 640, hasTurkishChars: false },
  { word: "astronomi", length: 9, difficulty: "hard", frequency: 620, hasTurkishChars: false },
  { word: "metafizik", length: 9, difficulty: "hard", frequency: 580, hasTurkishChars: false },
  { word: "empirizm", length: 8, difficulty: "hard", frequency: 430, hasTurkishChars: false },
  { word: "psikolog", length: 8, difficulty: "hard", frequency: 600, hasTurkishChars: false },
  { word: "arkeolog", length: 8, difficulty: "hard", frequency: 590, hasTurkishChars: false },
  { word: "sosyolog", length: 8, difficulty: "hard", frequency: 580, hasTurkishChars: false },
  { word: "sözlük", length: 6, difficulty: "hard", frequency: 640, hasTurkishChars: true },
  { word: "şikayet", length: 7, difficulty: "hard", frequency: 610, hasTurkishChars: true },
  { word: "öngörü", length: 6, difficulty: "hard", frequency: 580, hasTurkishChars: true },
  { word: "çözüm", length: 5, difficulty: "hard", frequency: 680, hasTurkishChars: true },
  { word: "süreç", length: 5, difficulty: "hard", frequency: 670, hasTurkishChars: true },
  { word: "güçlük", length: 6, difficulty: "hard", frequency: 640, hasTurkishChars: true },
  { word: "şüphe", length: 5, difficulty: "hard", frequency: 620, hasTurkishChars: true },
  { word: "gürültü", length: 7, difficulty: "hard", frequency: 610, hasTurkishChars: true },
  { word: "yüzyıl", length: 6, difficulty: "hard", frequency: 640, hasTurkishChars: true },
  { word: "döngü", length: 5, difficulty: "hard", frequency: 600, hasTurkishChars: true },
  { word: "özgün", length: 5, difficulty: "hard", frequency: 620, hasTurkishChars: true },
  { word: "dönüşüm", length: 7, difficulty: "hard", frequency: 610, hasTurkishChars: true },
  { word: "çözünme", length: 7, difficulty: "hard", frequency: 540, hasTurkishChars: true },
  { word: "küreselleşme", length: 12, difficulty: "hard", frequency: 580, hasTurkishChars: true },
  { word: "hükümranlık", length: 11, difficulty: "hard", frequency: 520, hasTurkishChars: true },
  { word: "bağımsızlık", length: 11, difficulty: "hard", frequency: 580, hasTurkishChars: true },
  { word: "sürdürülebilir", length: 14, difficulty: "hard", frequency: 560, hasTurkishChars: true },
];

const VALID_TR_CHARS = /^[a-zçğıöşüâîû]+$/;

export function turkishToLower(str: string): string {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();
}

export function normalizeWord(word: string): string | null {
  const trimmed = word.trim();
  if (!trimmed) return null;

  const lower = turkishToLower(trimmed);

  if (!VALID_TR_CHARS.test(lower)) return null;
  if (lower.length < 2) return null;

  return lower;
}

export function scrambleWord(word: string): string[] {
  const letters = [...word];
  if (letters.length <= 1) return letters;

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let scrambled = shuffle(letters);
  let attempts = 0;

  while (scrambled.join('') === word && attempts < 10) {
    scrambled = shuffle(letters);
    attempts++;
  }

  return scrambled;
}

export function mergeAndShuffle(wordLetters: string[], distractorLetters: string[]): string[] {
  const scramble = scrambleWord(wordLetters.join(''));
  const allLetters = [...scramble, ...distractorLetters];
  // Simple shuffle
  return allLetters.sort(() => Math.random() - 0.5);
}

export function getRoundDifficultyConfig(config: RoundConfig) {
  const { roundNumber, totalRounds } = config;
  const progress = roundNumber / totalRounds;

  if (progress <= 0.25) {
    return { difficulty: 'easy' as const, minLength: 4, maxLength: 6, minFrequency: 900 };
  } else if (progress <= 0.625) {
    return { difficulty: 'medium' as const, minLength: 5, maxLength: 7, minFrequency: 800 };
  } else {
    return { difficulty: 'hard' as const, minLength: 6, maxLength: 9, minFrequency: 500 };
  }
}

export function selectWord(
  roundConfig: RoundConfig,
  excludeWords: string[] = []
): WordEntry {
  const config = getRoundDifficultyConfig(roundConfig);
  const excluded = new Set(excludeWords);

  const filterWords = (w: WordEntry) =>
    w.difficulty === config.difficulty &&
    w.length >= config.minLength &&
    w.length <= config.maxLength &&
    w.frequency >= config.minFrequency;

  let candidates = trWords.filter((w) => filterWords(w) && !excluded.has(w.word));

  if (candidates.length === 0) {
    candidates = trWords.filter((w) => w.difficulty === config.difficulty && !excluded.has(w.word));
  }
  if (candidates.length === 0) {
    candidates = trWords.filter((w) => !excluded.has(w.word));
  }
  if (candidates.length === 0) {
    candidates = trWords;
  }

  const totalWeight = candidates.reduce((sum, w) => sum + w.frequency, 0);
  let rand = Math.random() * totalWeight;

  for (const word of candidates) {
    rand -= word.frequency;
    if (rand <= 0) return word;
  }

  return candidates[candidates.length - 1];
}

const COMMON_VOWELS = ['a', 'e', 'i', 'o', 'u', 'ı', 'ö', 'ü'];
const COMMON_CONSONANTS = ['r', 'n', 's', 'l', 'k', 't', 'm', 'b', 'y', 'd', 'ç', 'ş'];

export function getDistractorCount(
  roundNumber: number,
  totalRounds: number,
  difficulty: DifficultyLevel
): number {
  if (difficulty === 'hard') {
    return roundNumber >= Math.floor(totalRounds * 0.6) ? 2 : 1;
  }
  if (difficulty === 'easy') {
    return 0;
  }
  const progress = roundNumber / totalRounds;
  if (progress < 0.4) return 0;
  return 1;
}

export function generateDistractors(wordLetters: string[], count: number): string[] {
  if (count <= 0) return [];
  const wordSet = new Set(wordLetters);
  const candidates: string[] = [];

  for (const ch of [...COMMON_VOWELS, ...COMMON_CONSONANTS]) {
    if (!wordSet.has(ch)) {
      candidates.push(ch);
    }
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const SPEED_MULTIPLIER = 2;
const COMBO_MULTIPLIER = 5;

export function calculateScore(
  wordLength: number,
  isCorrect: boolean,
  responseTimeMs: number,
  roundDurationMs: number,
  comboCount: number
): ScoreResult {
  if (!isCorrect) {
    return {
      isCorrect: false,
      baseScore: 0,
      speedBonus: 0,
      comboBonus: 0,
      scoreAwarded: 0,
      responseTimeMs,
    };
  }

  const baseScore = wordLength * 10;
  const remainingMs = Math.max(0, roundDurationMs - responseTimeMs);
  const remainingSeconds = remainingMs / 1000;
  const speedBonus = Math.round(remainingSeconds * SPEED_MULTIPLIER);
  const comboBonus = comboCount * COMBO_MULTIPLIER;
  const scoreAwarded = baseScore + speedBonus + comboBonus;

  return {
    isCorrect: true,
    baseScore,
    speedBonus,
    comboBonus,
    scoreAwarded,
    responseTimeMs,
  };
}

export function nextComboCount(wasCorrect: boolean, currentCombo: number): number {
  return wasCorrect ? currentCombo + 1 : 0;
}
