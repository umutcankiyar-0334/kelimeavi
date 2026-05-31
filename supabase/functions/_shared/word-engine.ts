// supabase/functions/_shared/word-engine.ts
// Deno-compatible port of the word engine. Keep in sync with src/features/word-engine.

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface WordEntry {
  word: string;
  length: number;
  difficulty: DifficultyLevel;
  frequency: number;
  hasTurkishChars: boolean;
}

export interface DictionaryWordEntry {
  word: string;
  clue: string;
  difficulty: DifficultyLevel;
  length: number;
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
  letterBonus: number;
  scoreAwarded: number;
  responseTimeMs: number;
}

// ─── DICTIONARY WORD ENTRIES (Definitions) ──────────────────────────────────
export const trDictionaryWords: DictionaryWordEntry[] = [
  { word: 'elma', clue: 'Genellikle kırmızı veya yeşil, tatlı ve sulu bir ağaç meyvesi', difficulty: 'easy', length: 4 },
  { word: 'kedi', clue: 'Evlerde beslenen, miyavlayan küçük memeli evcil hayvan', difficulty: 'easy', length: 4 },
  { word: 'okul', clue: 'Eğitim ve öğretim verilen kurum, mektep', difficulty: 'easy', length: 4 },
  { word: 'para', clue: 'Devletçe bastırılan, mal ve hizmet satın alma gücü olan araç', difficulty: 'easy', length: 4 },
  { word: 'uçak', clue: 'Havadan ağır, motor gücüyle uçabilen hava taşıtı', difficulty: 'easy', length: 4 },
  { word: 'şiir', clue: 'Duygu ve düşüncelerin ölçülü ve uyumlu kelimelerle anlatımı', difficulty: 'easy', length: 4 },
  { word: 'müze', clue: 'Sanat, bilim ve tarih eserlerinin sergilendiği yer', difficulty: 'easy', length: 4 },
  { word: 'kapı', clue: 'Bir odaya veya eve girip çıkmak için açılan düzenek', difficulty: 'easy', length: 4 },
  { word: 'ağaç', clue: 'Gövdesi odunsu, dalları ve yaprakları olan çok yıllık bitki', difficulty: 'easy', length: 4 },
  { word: 'kitap', clue: 'Ciltlenmiş basılı yapraklardan oluşan okuma aracı', difficulty: 'easy', length: 5 },
  { word: 'kalem', clue: 'Yazı yazmak veya resim yapmak için kullanılan araç', difficulty: 'easy', length: 5 },
  { word: 'nehir', clue: 'Genellikle denize dökülen büyük akarsu, ırmak', difficulty: 'easy', length: 5 },
  { word: 'limon', clue: 'Sarı renkli, ekşi suyu olan C vitamini zengini meyve', difficulty: 'easy', length: 5 },
  { word: 'köpek', clue: 'Sadakatiyle bilinen, havlayan evcil hayvan', difficulty: 'easy', length: 5 },
  { word: 'çiçek', clue: 'Bitkilerin güzel kokulu, renkli üreme organı', difficulty: 'easy', length: 5 },
  { word: 'çanta', clue: 'İçine eşya koyup taşımaya yarayan kap', difficulty: 'easy', length: 5 },
  { word: 'şehir', clue: 'Nüfusu yoğun olan, gelişmiş büyük yerleşim yeri', difficulty: 'easy', length: 5 },
  { word: 'dünya', clue: 'Üzerinde yaşadığımız gök cismi, yeryüzü', difficulty: 'easy', length: 5 },

  { word: 'rüzgar', clue: 'Havanın yüksek basınçtan alçak basınca doğru yer değiştirmesi', difficulty: 'medium', length: 6 },
  { word: 'kırmızı', clue: 'Al renk, kan rengi olan canlı ana renk', difficulty: 'medium', length: 7 },
  { word: 'tiyatro', clue: 'Sahnede oyuncuların canlı olarak sergilediği oyun sanatı', difficulty: 'medium', length: 7 },
  { word: 'deprem', clue: 'Yer kabuğundaki kırılmalar sebebiyle oluşan ani sarsıntı', difficulty: 'medium', length: 6 },
  { word: 'hastane', clue: 'Hastalara teşhis ve tedavi hizmeti sunan sağlık kuruluşu', difficulty: 'medium', length: 7 },
  { word: 'bulmaca', clue: 'Harf veya kelimelerle oynanan zeka ve dikkat oyunu', difficulty: 'medium', length: 7 },
  { word: 'yıldız', clue: 'Geceleri gökyüzünde ışıldayan sıcak gaz kütlesi', difficulty: 'medium', length: 6 },
  { word: 'öğretmen', clue: 'Bir bilim veya sanatı öğretmeyi meslek edinmiş kişi', difficulty: 'medium', length: 8 },
  { word: 'sistem', clue: 'Bir sonuca ulaşmak için düzenlenmiş unsurlar bütünü', difficulty: 'medium', length: 6 },
  { word: 'avukat', clue: 'Yasal konularda insanları savunan meslek sahibi kişi', difficulty: 'medium', length: 6 },
  { word: 'market', clue: 'Yiyecek ve ev eşyalarının satıldığı perakende mağaza', difficulty: 'medium', length: 6 },
  { word: 'mevsim', clue: 'Yılın iklim şartları yönünden ayrılan dört bölümünden her biri', difficulty: 'medium', length: 6 },
  { word: 'fabrika', clue: 'Sanayi ürünlerinin üretildiği büyük tesis veya imalathane', difficulty: 'medium', length: 7 },
  { word: 'satranç', clue: 'İki oyuncu arasında 64 kareli tahta üzerinde oynanan zeka oyunu', difficulty: 'medium', length: 7 },
  { word: 'ekonomi', clue: 'Üretim, tüketim, ticaret ve bölüşüm faaliyetlerini inceleyen alan', difficulty: 'medium', length: 7 },

  { word: 'teknoloji', clue: 'Bilimin pratik yaşam amaçlarına uygulanması ve geliştirilmesi', difficulty: 'hard', length: 9 },
  { word: 'algoritma', clue: 'Bir sorunu çözmek için izlenen sistemli ve adım adım yol', difficulty: 'hard', length: 9 },
  { word: 'donanım', clue: 'Bir bilgisayar veya cihazın fiziksel parçalarının tamamı', difficulty: 'hard', length: 7 },
  { word: 'yazılım', clue: 'Bilgisayarda çalışan programlar ve kodlerin tümü', difficulty: 'hard', length: 7 },
  { word: 'demokrasi', clue: 'Halkın kendi kendini yönetmesine dayanan yönetim şekli', difficulty: 'hard', length: 9 },
  { word: 'astronomi', clue: 'Gök cisimlerini ve evreni inceleyen bilim dalı, gök bilimi', difficulty: 'hard', length: 9 },
  { word: 'metafizik', clue: 'Fiziksel dünyanın ötesini, varoluşu araştıran felsefe dalı', difficulty: 'hard', length: 9 },
  { word: 'diplomasi', clue: 'Devletler arasındaki ilişkileri düzenleyen yöntem ve kurallar', difficulty: 'hard', length: 9 },
  { word: 'arkeoloji', clue: 'Eski uygarlıkların kalıntılarını kazarak inceleyen bilim dalı', difficulty: 'hard', length: 9 },
  { word: 'bürokrasi', clue: 'Devlet kurumlarındaki memurlar ve kurallar bütünü', difficulty: 'hard', length: 9 },
  { word: 'bağımsızlık', clue: 'Hiçbir güce veya devlete bağlı olmama, hür olma durumu', difficulty: 'hard', length: 11 },
  { word: 'frekans', clue: 'Bir titreşimin bir saniye içindeki tekrarlanma sayısı', difficulty: 'hard', length: 7 }
];

// ─── SEED WORD DICTIONARY (Scrambled letters) ───────────────────────────────
export const trWords: WordEntry[] = [
  // EASY
  { word: 'masa',   length: 4, difficulty: 'easy', frequency: 980, hasTurkishChars: false },
  { word: 'kedi',   length: 4, difficulty: 'easy', frequency: 985, hasTurkishChars: false },
  { word: 'elma',   length: 4, difficulty: 'easy', frequency: 985, hasTurkishChars: false },
  { word: 'anne',   length: 4, difficulty: 'easy', frequency: 998, hasTurkishChars: false },
  { word: 'baba',   length: 4, difficulty: 'easy', frequency: 998, hasTurkishChars: false },
  { word: 'okul',   length: 4, difficulty: 'easy', frequency: 990, hasTurkishChars: false },
  { word: 'hava',   length: 4, difficulty: 'easy', frequency: 980, hasTurkishChars: false },
  { word: 'para',   length: 4, difficulty: 'easy', frequency: 990, hasTurkishChars: false },
  { word: 'yara',   length: 4, difficulty: 'easy', frequency: 930, hasTurkishChars: false },
  { word: 'tane',   length: 4, difficulty: 'easy', frequency: 960, hasTurkishChars: false },
  { word: 'fare',   length: 4, difficulty: 'easy', frequency: 920, hasTurkishChars: false },
  { word: 'mavi',   length: 4, difficulty: 'easy', frequency: 970, hasTurkishChars: false },
  { word: 'gemi',   length: 4, difficulty: 'easy', frequency: 965, hasTurkishChars: false },
  { word: 'oyun',   length: 4, difficulty: 'easy', frequency: 978, hasTurkishChars: false },
  { word: 'dans',   length: 4, difficulty: 'easy', frequency: 870, hasTurkishChars: false },
  { word: 'park',   length: 4, difficulty: 'easy', frequency: 870, hasTurkishChars: false },
  { word: 'depo',   length: 4, difficulty: 'easy', frequency: 848, hasTurkishChars: false },
  { word: 'film',   length: 4, difficulty: 'easy', frequency: 880, hasTurkishChars: false },
  { word: 'dere',   length: 4, difficulty: 'easy', frequency: 940, hasTurkishChars: false },
  { word: 'arpa',   length: 4, difficulty: 'easy', frequency: 860, hasTurkishChars: false },
  { word: 'plaj',   length: 4, difficulty: 'easy', frequency: 860, hasTurkishChars: false },
  { word: 'tepe',   length: 4, difficulty: 'easy', frequency: 960, hasTurkishChars: false },
  { word: 'kale',   length: 4, difficulty: 'easy', frequency: 940, hasTurkishChars: false },
  { word: 'bale',   length: 4, difficulty: 'easy', frequency: 850, hasTurkishChars: false },
  { word: 'gece',   length: 4, difficulty: 'easy', frequency: 888, hasTurkishChars: false },
  { word: 'vadi',   length: 4, difficulty: 'easy', frequency: 830, hasTurkishChars: false },
  { word: 'ceza',   length: 4, difficulty: 'easy', frequency: 855, hasTurkishChars: false },
  { word: 'renk',   length: 4, difficulty: 'easy', frequency: 878, hasTurkishChars: false },
  { word: 'soba',   length: 4, difficulty: 'easy', frequency: 840, hasTurkishChars: false },
  { word: 'kutu',   length: 4, difficulty: 'easy', frequency: 870, hasTurkishChars: false },
  { word: 'kapı',   length: 4, difficulty: 'easy', frequency: 975, hasTurkishChars: true },
  { word: 'ağaç',   length: 4, difficulty: 'easy', frequency: 978, hasTurkishChars: true },
  { word: 'doğa',   length: 4, difficulty: 'easy', frequency: 875, hasTurkishChars: true },
  { word: 'uçak',   length: 4, difficulty: 'easy', frequency: 870, hasTurkishChars: true },
  { word: 'şiir',   length: 4, difficulty: 'easy', frequency: 835, hasTurkishChars: true },
  { word: 'özel',   length: 4, difficulty: 'easy', frequency: 878, hasTurkishChars: true },
  { word: 'müze',   length: 4, difficulty: 'easy', frequency: 845, hasTurkishChars: true },
  { word: 'araba',  length: 5, difficulty: 'easy', frequency: 990, hasTurkishChars: false },
  { word: 'kalem',  length: 5, difficulty: 'easy', frequency: 988, hasTurkishChars: false },
  { word: 'deniz',  length: 5, difficulty: 'easy', frequency: 985, hasTurkishChars: false },
  { word: 'kitap',  length: 5, difficulty: 'easy', frequency: 988, hasTurkishChars: false },
  { word: 'tahta',  length: 5, difficulty: 'easy', frequency: 960, hasTurkishChars: false },
  { word: 'ekmek',  length: 5, difficulty: 'easy', frequency: 990, hasTurkishChars: false },
  { word: 'pilav',  length: 5, difficulty: 'easy', frequency: 975, hasTurkishChars: false },
  { word: 'tavan',  length: 5, difficulty: 'easy', frequency: 970, hasTurkishChars: false },
  { word: 'duvar',  length: 5, difficulty: 'easy', frequency: 975, hasTurkishChars: false },
  { word: 'nehir',  length: 5, difficulty: 'easy', frequency: 965, hasTurkishChars: false },
  { word: 'orman',  length: 5, difficulty: 'easy', frequency: 975, hasTurkishChars: false },
  { word: 'bulut',  length: 5, difficulty: 'easy', frequency: 980, hasTurkishChars: false },
  { word: 'limon',  length: 5, difficulty: 'easy', frequency: 982, hasTurkishChars: false },
  { word: 'meyve',  length: 5, difficulty: 'easy', frequency: 984, hasTurkishChars: false },
  { word: 'sebze',  length: 5, difficulty: 'easy', frequency: 982, hasTurkishChars: false },
  { word: 'ceket',  length: 5, difficulty: 'easy', frequency: 975, hasTurkishChars: false },
  { word: 'tabak',  length: 5, difficulty: 'easy', frequency: 984, hasTurkishChars: false },
  { word: 'yatak',  length: 5, difficulty: 'easy', frequency: 988, hasTurkishChars: false },
  { word: 'yeşil',  length: 5, difficulty: 'easy', frequency: 970, hasTurkishChars: true },
  { word: 'pembe',  length: 5, difficulty: 'easy', frequency: 955, hasTurkishChars: false },
  { word: 'beyaz',  length: 5, difficulty: 'easy', frequency: 968, hasTurkishChars: false },
  { word: 'siyah',  length: 5, difficulty: 'easy', frequency: 965, hasTurkishChars: false },
  { word: 'haber',  length: 5, difficulty: 'easy', frequency: 870, hasTurkishChars: false },
  { word: 'video',  length: 5, difficulty: 'easy', frequency: 862, hasTurkishChars: false },
  { word: 'banka',  length: 5, difficulty: 'easy', frequency: 870, hasTurkishChars: false },
  { word: 'sokak',  length: 5, difficulty: 'easy', frequency: 868, hasTurkishChars: false },
  { word: 'cadde',  length: 5, difficulty: 'easy', frequency: 862, hasTurkishChars: false },
  { word: 'radyo',  length: 5, difficulty: 'easy', frequency: 862, hasTurkishChars: false },
  { word: 'hasta',  length: 5, difficulty: 'easy', frequency: 882, hasTurkishChars: false },
  { word: 'masal',  length: 5, difficulty: 'easy', frequency: 850, hasTurkishChars: false },
  { word: 'gitar',  length: 5, difficulty: 'easy', frequency: 862, hasTurkishChars: false },
  { word: 'davul',  length: 5, difficulty: 'easy', frequency: 848, hasTurkishChars: false },
  { word: 'karar',  length: 5, difficulty: 'easy', frequency: 862, hasTurkishChars: false },
  { word: 'sahil',  length: 5, difficulty: 'easy', frequency: 845, hasTurkishChars: false },
  { word: 'dergi',  length: 5, difficulty: 'easy', frequency: 852, hasTurkishChars: false },
  { word: 'köpek',  length: 5, difficulty: 'easy', frequency: 985, hasTurkishChars: true },
  { word: 'yılan',  length: 5, difficulty: 'easy', frequency: 950, hasTurkishChars: true },
  { word: 'çorba',  length: 5, difficulty: 'easy', frequency: 985, hasTurkishChars: true },
  { word: 'güneş',  length: 5, difficulty: 'easy', frequency: 988, hasTurkishChars: true },
  { word: 'çiçek',  length: 5, difficulty: 'easy', frequency: 984, hasTurkishChars: true },
  { word: 'şeker',  length: 5, difficulty: 'easy', frequency: 985, hasTurkishChars: true },
  { word: 'çanta',  length: 5, difficulty: 'easy', frequency: 985, hasTurkishChars: true },
  { word: 'şapka',  length: 5, difficulty: 'easy', frequency: 980, hasTurkishChars: true },
  { word: 'çorap',  length: 5, difficulty: 'easy', frequency: 982, hasTurkishChars: true },
  { word: 'kaşık',  length: 5, difficulty: 'easy', frequency: 978, hasTurkishChars: true },
  { word: 'çatal',  length: 5, difficulty: 'easy', frequency: 978, hasTurkishChars: true },
  { word: 'şehir',  length: 5, difficulty: 'easy', frequency: 880, hasTurkishChars: true },
  { word: 'çevre',  length: 5, difficulty: 'easy', frequency: 868, hasTurkishChars: true },
  { word: 'seçim',  length: 5, difficulty: 'easy', frequency: 838, hasTurkishChars: true },
  { word: 'ırmak',  length: 5, difficulty: 'easy', frequency: 832, hasTurkishChars: true },
  { word: 'uçmak',  length: 5, difficulty: 'easy', frequency: 860, hasTurkishChars: true },
  { word: 'barış',  length: 5, difficulty: 'easy', frequency: 845, hasTurkishChars: true },
  { word: 'savaş',  length: 5, difficulty: 'easy', frequency: 848, hasTurkishChars: true },
  { word: 'tünel',  length: 5, difficulty: 'easy', frequency: 830, hasTurkishChars: true },
  { word: 'üzgün',  length: 5, difficulty: 'easy', frequency: 870, hasTurkishChars: true },
  { word: 'büyük',  length: 5, difficulty: 'easy', frequency: 900, hasTurkishChars: true },
  { word: 'küçük',  length: 5, difficulty: 'easy', frequency: 900, hasTurkishChars: true },
  { word: 'güzel',  length: 5, difficulty: 'easy', frequency: 900, hasTurkishChars: true },
  { word: 'akşam',  length: 5, difficulty: 'easy', frequency: 880, hasTurkishChars: true },
  { word: 'öğlen',  length: 5, difficulty: 'easy', frequency: 870, hasTurkishChars: true },
  { word: 'gümüş',  length: 5, difficulty: 'easy', frequency: 845, hasTurkishChars: true },
  { word: 'bölüm',  length: 5, difficulty: 'easy', frequency: 860, hasTurkishChars: true },
  { word: 'fırın',  length: 5, difficulty: 'easy', frequency: 848, hasTurkishChars: true },
  { word: 'çarşı',  length: 5, difficulty: 'easy', frequency: 848, hasTurkishChars: true },
  { word: 'müzik',  length: 5, difficulty: 'easy', frequency: 850, hasTurkishChars: true },

  // MEDIUM
  { word: 'bilgi',   length: 5, difficulty: 'medium', frequency: 870, hasTurkishChars: false },
  { word: 'resim',   length: 5, difficulty: 'medium', frequency: 860, hasTurkishChars: false },
  { word: 'tablo',   length: 5, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'sahne',   length: 5, difficulty: 'medium', frequency: 830, hasTurkishChars: false },
  { word: 'fiyat',   length: 5, difficulty: 'medium', frequency: 855, hasTurkishChars: false },
  { word: 'hayat',   length: 5, difficulty: 'medium', frequency: 875, hasTurkishChars: false },
  { word: 'merak',   length: 5, difficulty: 'medium', frequency: 850, hasTurkishChars: false },
  { word: 'zaman',   length: 5, difficulty: 'medium', frequency: 900, hasTurkishChars: false },
  { word: 'insan',   length: 5, difficulty: 'medium', frequency: 890, hasTurkishChars: false },
  { word: 'proje',   length: 5, difficulty: 'medium', frequency: 855, hasTurkishChars: false },
  { word: 'asker',   length: 5, difficulty: 'medium', frequency: 862, hasTurkishChars: false },
  { word: 'yazar',   length: 5, difficulty: 'medium', frequency: 858, hasTurkishChars: false },
  { word: 'mimar',   length: 5, difficulty: 'medium', frequency: 845, hasTurkishChars: false },
  { word: 'pilot',   length: 5, difficulty: 'medium', frequency: 858, hasTurkishChars: false },
  { word: 'liman',   length: 5, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'vapur',   length: 5, difficulty: 'medium', frequency: 848, hasTurkishChars: false },
  { word: 'sergi',   length: 5, difficulty: 'medium', frequency: 828, hasTurkishChars: false },
  { word: 'manav',   length: 5, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'kasap',   length: 5, difficulty: 'medium', frequency: 842, hasTurkishChars: false },
  { word: 'terzi',   length: 5, difficulty: 'medium', frequency: 828, hasTurkishChars: false },
  { word: 'sabah',   length: 5, difficulty: 'medium', frequency: 885, hasTurkishChars: false },
  { word: 'hafta',   length: 5, difficulty: 'medium', frequency: 875, hasTurkishChars: false },
  { word: 'bahar',   length: 5, difficulty: 'medium', frequency: 858, hasTurkishChars: false },
  { word: 'zafer',   length: 5, difficulty: 'medium', frequency: 838, hasTurkishChars: false },
  { word: 'mutlu',   length: 5, difficulty: 'medium', frequency: 900, hasTurkishChars: false },
  { word: 'hakem',   length: 5, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'demir',   length: 5, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'roman',   length: 5, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'borsa',   length: 5, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'kredi',   length: 5, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'vergi',   length: 5, difficulty: 'medium', frequency: 838, hasTurkishChars: false },
  { word: 'hukuk',   length: 5, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'delil',   length: 5, difficulty: 'medium', frequency: 818, hasTurkishChars: false },
  { word: 'genel',   length: 5, difficulty: 'medium', frequency: 878, hasTurkishChars: false },
  { word: 'keman',   length: 5, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'zurna',   length: 5, difficulty: 'medium', frequency: 780, hasTurkishChars: false },
  { word: 'tavla',   length: 5, difficulty: 'medium', frequency: 810, hasTurkishChars: false },
  { word: 'yerel',   length: 5, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'darbe',   length: 5, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'iklim',   length: 5, difficulty: 'medium', frequency: 838, hasTurkishChars: false },
  { word: 'kütle',   length: 5, difficulty: 'medium', frequency: 680, hasTurkishChars: true },
  { word: 'mantık',  length: 6, difficulty: 'medium', frequency: 670, hasTurkishChars: true },
  { word: 'sözlük',  length: 6, difficulty: 'medium', frequency: 640, hasTurkishChars: true },
  { word: 'güçlük',  length: 6, difficulty: 'medium', frequency: 640, hasTurkishChars: true },
  { word: 'yüzyıl',  length: 6, difficulty: 'medium', frequency: 640, hasTurkishChars: true },
  { word: 'süreç',   length: 5, difficulty: 'medium', frequency: 670, hasTurkishChars: true },
  { word: 'çözüm',   length: 5, difficulty: 'medium', frequency: 680, hasTurkishChars: true },
  { word: 'şüphe',   length: 5, difficulty: 'medium', frequency: 620, hasTurkishChars: true },
  { word: 'döngü',   length: 5, difficulty: 'medium', frequency: 600, hasTurkishChars: true },
  { word: 'özgün',   length: 5, difficulty: 'medium', frequency: 620, hasTurkishChars: true },
  { word: 'kızgın',  length: 6, difficulty: 'medium', frequency: 855, hasTurkishChars: true },
  { word: 'şaşkın',  length: 6, difficulty: 'medium', frequency: 840, hasTurkishChars: true },
  { word: 'uçurum',  length: 6, difficulty: 'medium', frequency: 810, hasTurkishChars: true },
  { word: 'rüzgar',  length: 6, difficulty: 'medium', frequency: 870, hasTurkishChars: true },
  { word: 'şelale',  length: 6, difficulty: 'medium', frequency: 820, hasTurkishChars: true },
  { word: 'rıhtım',  length: 6, difficulty: 'medium', frequency: 788, hasTurkishChars: true },
  { word: 'şirket',  length: 6, difficulty: 'medium', frequency: 860, hasTurkishChars: true },
  { word: 'öngörü',  length: 6, difficulty: 'medium', frequency: 580, hasTurkishChars: true },
  { word: 'eczane',  length: 6, difficulty: 'medium', frequency: 858, hasTurkishChars: false },
  { word: 'sistem',  length: 6, difficulty: 'medium', frequency: 870, hasTurkishChars: false },
  { word: 'devlet',  length: 6, difficulty: 'medium', frequency: 870, hasTurkishChars: false },
  { word: 'toplum',  length: 6, difficulty: 'medium', frequency: 865, hasTurkishChars: false },
  { word: 'makine',  length: 6, difficulty: 'medium', frequency: 855, hasTurkishChars: false },
  { word: 'doktor',  length: 6, difficulty: 'medium', frequency: 870, hasTurkishChars: false },
  { word: 'avukat',  length: 6, difficulty: 'medium', frequency: 855, hasTurkishChars: false },
  { word: 'sporcu',  length: 6, difficulty: 'medium', frequency: 850, hasTurkishChars: false },
  { word: 'sinema',  length: 6, difficulty: 'medium', frequency: 858, hasTurkishChars: false },
  { word: 'konser',  length: 6, difficulty: 'medium', frequency: 848, hasTurkishChars: false },
  { word: 'market',  length: 6, difficulty: 'medium', frequency: 860, hasTurkishChars: false },
  { word: 'berber',  length: 6, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'mevsim',  length: 6, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'deprem',  length: 6, difficulty: 'medium', frequency: 830, hasTurkishChars: false },
  { word: 'elektrik',length: 8, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'enerji',  length: 6, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'karbon',  length: 6, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'taktik',  length: 6, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'reform',  length: 6, difficulty: 'medium', frequency: 815, hasTurkishChars: false },
  { word: 'devrim',  length: 6, difficulty: 'medium', frequency: 818, hasTurkishChars: false },
  { word: 'yatırım', length: 7, difficulty: 'medium', frequency: 830, hasTurkishChars: true },
  { word: 'kırmızı', length: 7, difficulty: 'medium', frequency: 862, hasTurkishChars: true },
  { word: 'turuncu', length: 7, difficulty: 'medium', frequency: 848, hasTurkishChars: false },
  { word: 'tiyatro', length: 7, difficulty: 'medium', frequency: 835, hasTurkishChars: false },
  { word: 'eşitlik', length: 7, difficulty: 'medium', frequency: 828, hasTurkishChars: true },
  { word: 'küresel', length: 7, difficulty: 'medium', frequency: 810, hasTurkishChars: true },
  { word: 'bağlama', length: 7, difficulty: 'medium', frequency: 798, hasTurkishChars: true },
  { word: 'satranç', length: 7, difficulty: 'medium', frequency: 820, hasTurkishChars: true },
  { word: 'siyaset', length: 7, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'ekonomi', length: 7, difficulty: 'medium', frequency: 842, hasTurkishChars: false },
  { word: 'fabrika', length: 7, difficulty: 'medium', frequency: 848, hasTurkishChars: false },
  { word: 'mahkeme', length: 7, difficulty: 'medium', frequency: 830, hasTurkishChars: false },
  { word: 'yenilgi', length: 7, difficulty: 'medium', frequency: 818, hasTurkishChars: false },
  { word: 'hastane', length: 7, difficulty: 'medium', frequency: 865, hasTurkishChars: false },
  { word: 'turnuva', length: 7, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'lokanta', length: 7, difficulty: 'medium', frequency: 850, hasTurkishChars: false },
  { word: 'savunma', length: 7, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'bulmaca', length: 7, difficulty: 'medium', frequency: 815, hasTurkishChars: false },
  { word: 'bilmece', length: 7, difficulty: 'medium', frequency: 808, hasTurkishChars: false },
  { word: 'iktidar', length: 7, difficulty: 'medium', frequency: 820, hasTurkishChars: false },
  { word: 'gürültü', length: 7, difficulty: 'medium', frequency: 610, hasTurkishChars: true },
  { word: 'dönüşüm', length: 7, difficulty: 'medium', frequency: 610, hasTurkishChars: true },
  { word: 'şarkıcı', length: 7, difficulty: 'medium', frequency: 848, hasTurkishChars: true },
  { word: 'saldırı', length: 7, difficulty: 'medium', frequency: 810, hasTurkishChars: true },
  { word: 'mühendis',length: 8, difficulty: 'medium', frequency: 840, hasTurkishChars: false },
  { word: 'öğretmen',length: 8, difficulty: 'medium', frequency: 860, hasTurkishChars: true },
  { word: 'fotoğraf',length: 8, difficulty: 'medium', frequency: 858, hasTurkishChars: true },
  { word: 'sözleşme',length: 8, difficulty: 'medium', frequency: 830, hasTurkishChars: true },
  { word: 'uygulama',length: 8, difficulty: 'medium', frequency: 855, hasTurkishChars: false },
  { word: 'strateji',length: 8, difficulty: 'medium', frequency: 815, hasTurkishChars: false },
  { word: 'özgürlük',length: 8, difficulty: 'medium', frequency: 840, hasTurkishChars: true },

  // HARD
  { word: 'felsefe',   length: 7, difficulty: 'hard', frequency: 660, hasTurkishChars: false },
  { word: 'estetik',   length: 7, difficulty: 'hard', frequency: 640, hasTurkishChars: false },
  { word: 'genetik',   length: 7, difficulty: 'hard', frequency: 628, hasTurkishChars: false },
  { word: 'anayasa',   length: 7, difficulty: 'hard', frequency: 680, hasTurkishChars: false },
  { word: 'diyabet',   length: 7, difficulty: 'hard', frequency: 620, hasTurkishChars: false },
  { word: 'protein',   length: 7, difficulty: 'hard', frequency: 640, hasTurkishChars: false },
  { word: 'vitamin',   length: 7, difficulty: 'hard', frequency: 660, hasTurkishChars: false },
  { word: 'mineral',   length: 7, difficulty: 'hard', frequency: 620, hasTurkishChars: false },
  { word: 'kuantum',   length: 7, difficulty: 'hard', frequency: 560, hasTurkishChars: false },
  { word: 'frekans',   length: 7, difficulty: 'hard', frequency: 580, hasTurkishChars: false },
  { word: 'ittifak',   length: 7, difficulty: 'hard', frequency: 680, hasTurkishChars: false },
  { word: 'ambargo',   length: 7, difficulty: 'hard', frequency: 580, hasTurkishChars: false },
  { word: 'erozyon',   length: 7, difficulty: 'hard', frequency: 580, hasTurkishChars: false },
  { word: 'yazılım',   length: 7, difficulty: 'hard', frequency: 680, hasTurkishChars: true },
  { word: 'donanım',   length: 7, difficulty: 'hard', frequency: 660, hasTurkishChars: true },
  { word: 'mülteci',   length: 7, difficulty: 'hard', frequency: 640, hasTurkishChars: true },
  { word: 'monarşi',   length: 7, difficulty: 'hard', frequency: 560, hasTurkishChars: true },
  { word: 'şikayet',   length: 7, difficulty: 'hard', frequency: 610, hasTurkishChars: true },
  { word: 'çözünme',   length: 7, difficulty: 'hard', frequency: 540, hasTurkishChars: true },
  { word: 'nükleer',   length: 7, difficulty: 'hard', frequency: 640, hasTurkishChars: true },
  { word: 'mitoloji',  length: 8, difficulty: 'hard', frequency: 590, hasTurkishChars: false },
  { word: 'kalsiyum',  length: 8, difficulty: 'hard', frequency: 600, hasTurkishChars: false },
  { word: 'elektron',  length: 8, difficulty: 'hard', frequency: 640, hasTurkishChars: false },
  { word: 'manyetik',  length: 8, difficulty: 'hard', frequency: 600, hasTurkishChars: false },
  { word: 'spektrum',  length: 8, difficulty: 'hard', frequency: 540, hasTurkishChars: false },
  { word: 'teleskop',  length: 8, difficulty: 'hard', frequency: 580, hasTurkishChars: false },
  { word: 'biyoloji',  length: 8, difficulty: 'hard', frequency: 640, hasTurkishChars: false },
  { word: 'empirizm',  length: 8, difficulty: 'hard', frequency: 430, hasTurkishChars: false },
  { word: 'psikolog',  length: 8, difficulty: 'hard', frequency: 600, hasTurkishChars: false },
  { word: 'arkeolog',  length: 8, difficulty: 'hard', frequency: 590, hasTurkishChars: false },
  { word: 'müzisyen',  length: 8, difficulty: 'hard', frequency: 650, hasTurkishChars: true },
  { word: 'oligarşi',  length: 8, difficulty: 'hard', frequency: 540, hasTurkishChars: true },
  { word: 'müzakere',  length: 8, difficulty: 'hard', frequency: 620, hasTurkishChars: true },
  { word: 'demokrasi', length: 9, difficulty: 'hard', frequency: 680, hasTurkishChars: false },
  { word: 'teknoloji', length: 9, difficulty: 'hard', frequency: 720, hasTurkishChars: false },
  { word: 'algoritma', length: 9, difficulty: 'hard', frequency: 640, hasTurkishChars: false },
  { word: 'radyasyon', length: 9, difficulty: 'hard', frequency: 600, hasTurkishChars: false },
  { word: 'mikroskop', length: 9, difficulty: 'hard', frequency: 580, hasTurkishChars: false },
  { word: 'diplomasi', length: 9, difficulty: 'hard', frequency: 650, hasTurkishChars: false },
  { word: 'koalisyon', length: 9, difficulty: 'hard', frequency: 640, hasTurkishChars: false },
  { word: 'muhalefet', length: 9, difficulty: 'hard', frequency: 630, hasTurkishChars: false },
  { word: 'astronomi', length: 9, difficulty: 'hard', frequency: 620, hasTurkishChars: false },
  { word: 'metafizik', length: 9, difficulty: 'hard', frequency: 580, hasTurkishChars: false },
  { word: 'kentleşme', length: 9, difficulty: 'hard', frequency: 580, hasTurkishChars: true },
  { word: 'bürokrasi', length: 9, difficulty: 'hard', frequency: 620, hasTurkishChars: true },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

export function turkishToLower(str: string): string {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();
}

const VALID_TR_CHARS = /^[a-zçğıöşüâîû]+$/;

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
  return [...scramble, ...distractorLetters].sort(() => Math.random() - 0.5);
}

export function getRoundDifficultyConfig(config: RoundConfig) {
  const progress = config.roundNumber / config.totalRounds;
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
  excludeWords: string[] = [],
  gameMode: 'seed_words' | 'dictionary' = 'seed_words'
): { word: string; difficulty: DifficultyLevel; clue?: string } {
  const config = getRoundDifficultyConfig(roundConfig);
  const excluded = new Set(excludeWords);

  if (gameMode === 'dictionary') {
    // Select from dictionary entries
    const filterDict = (w: DictionaryWordEntry) => w.difficulty === config.difficulty;
    let candidates = trDictionaryWords.filter((w) => filterDict(w) && !excluded.has(w.word));
    if (candidates.length === 0) candidates = trDictionaryWords.filter((w) => w.difficulty === config.difficulty && !excluded.has(w.word));
    if (candidates.length === 0) candidates = trDictionaryWords.filter((w) => !excluded.has(w.word));
    if (candidates.length === 0) candidates = trDictionaryWords;

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return { word: selected.word, difficulty: selected.difficulty, clue: selected.clue };
  } else {
    // Select from seed words
    const filterWords = (w: WordEntry) =>
      w.difficulty === config.difficulty &&
      w.length >= config.minLength &&
      w.length <= config.maxLength &&
      w.frequency >= config.minFrequency;

    let candidates = trWords.filter((w) => filterWords(w) && !excluded.has(w.word));
    if (candidates.length === 0) candidates = trWords.filter((w) => w.difficulty === config.difficulty && !excluded.has(w.word));
    if (candidates.length === 0) candidates = trWords.filter((w) => !excluded.has(w.word));
    if (candidates.length === 0) candidates = trWords;

    const totalWeight = candidates.reduce((sum, w) => sum + w.frequency, 0);
    let rand = Math.random() * totalWeight;
    let chosen = candidates[candidates.length - 1];
    for (const word of candidates) {
      rand -= word.frequency;
      if (rand <= 0) {
        chosen = word;
        break;
      }
    }
    return { word: chosen.word, difficulty: chosen.difficulty };
  }
}

const COMMON_VOWELS = ['a', 'e', 'i', 'o', 'u', 'ı', 'ö', 'ü'];
const COMMON_CONSONANTS = ['r', 'n', 's', 'l', 'k', 't', 'm', 'b', 'y', 'd', 'ç', 'ş'];

export function getDistractorCount(roundNumber: number, totalRounds: number, difficulty: DifficultyLevel): number {
  if (difficulty === 'hard') {
    return roundNumber >= Math.floor(totalRounds * 0.6) ? 2 : 1;
  }
  if (difficulty === 'easy') return 0;
  const progress = roundNumber / totalRounds;
  return progress < 0.4 ? 0 : 1;
}

export function generateDistractors(wordLetters: string[], count: number): string[] {
  if (count <= 0) return [];
  const wordSet = new Set(wordLetters);
  const candidates: string[] = [];
  for (const ch of [...COMMON_VOWELS, ...COMMON_CONSONANTS]) {
    if (!wordSet.has(ch)) candidates.push(ch);
  }
  return [...candidates].sort(() => Math.random() - 0.5).slice(0, count);
}

// ─── SCORING v2 ─────────────────────────────────────────────────────────────

const SPEED_MULTIPLIER       = 3;
const COMBO_MULTIPLIER       = 8;
const TURKISH_BONUS_PER_CHAR = 5;
const WRONG_PENALTY_PER_CHAR = 5;
const TURKISH_SPECIAL        = new Set(['ç','ğ','ı','ö','ş','ü','â','î','û']);

function countUniqueTurkishChars(word: string): number {
  const seen = new Set<string>();
  for (const ch of word) {
    if (TURKISH_SPECIAL.has(ch)) seen.add(ch);
  }
  return seen.size;
}

export function calculateScore(
  word: string,
  isCorrect: boolean,
  didSubmit: boolean,
  responseTimeMs: number,
  roundDurationMs: number,
  comboCount: number
): ScoreResult {
  const wordLength = word.length;

  if (!didSubmit) {
    return { isCorrect: false, baseScore: 0, speedBonus: 0, comboBonus: 0, letterBonus: 0, scoreAwarded: 0, responseTimeMs };
  }

  if (!isCorrect) {
    const penalty = -(wordLength * WRONG_PENALTY_PER_CHAR);
    return { isCorrect: false, baseScore: penalty, speedBonus: 0, comboBonus: 0, letterBonus: 0, scoreAwarded: penalty, responseTimeMs };
  }

  const baseScore   = wordLength * 10;
  const remainingMs = Math.max(0, roundDurationMs - responseTimeMs);
  const speedBonus  = Math.round((remainingMs / 1000) * SPEED_MULTIPLIER);
  const letterBonus = countUniqueTurkishChars(word) * TURKISH_BONUS_PER_CHAR;
  const comboBonus  = comboCount * COMBO_MULTIPLIER;
  const scoreAwarded = baseScore + speedBonus + letterBonus + comboBonus;

  return { isCorrect: true, baseScore, speedBonus, comboBonus, letterBonus, scoreAwarded, responseTimeMs };
}

export function nextComboCount(wasCorrect: boolean, currentCombo: number): number {
  return wasCorrect ? currentCombo + 1 : 0;
}
