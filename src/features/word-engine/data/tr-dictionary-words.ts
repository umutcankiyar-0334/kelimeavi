import type { DifficultyLevel } from '../types';

export interface DictionaryWordEntry {
  word: string;
  clue: string;
  difficulty: DifficultyLevel;
  length: number;
}

export const trDictionaryWords: DictionaryWordEntry[] = [
  // ─── EASY (4-5 letters) ──────────────────────────────────────────────────
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

  // ─── MEDIUM (6-7 letters) ────────────────────────────────────────────────
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

  // ─── HARD (8+ letters) ───────────────────────────────────────────────────
  { word: 'teknoloji', clue: 'Bilimin pratik yaşam amaçlarına uygulanması ve geliştirilmesi', difficulty: 'hard', length: 9 },
  { word: 'algoritma', clue: 'Bir sorunu çözmek için izlenen sistemli ve adım adım yol', difficulty: 'hard', length: 9 },
  { word: 'donanım', clue: 'Bir bilgisayar veya cihazın fiziksel parçalarının tamamı', difficulty: 'hard', length: 7 },
  { word: 'yazılım', clue: 'Bilgisayarda çalışan programlar ve kodların tümü', difficulty: 'hard', length: 7 },
  { word: 'demokrasi', clue: 'Halkın kendi kendini yönetmesine dayanan yönetim şekli', difficulty: 'hard', length: 9 },
  { word: 'astronomi', clue: 'Gök cisimlerini ve evreni inceleyen bilim dalı, gök bilimi', difficulty: 'hard', length: 9 },
  { word: 'metafizik', clue: 'Fiziksel dünyanın ötesini, varoluşu araştıran felsefe dalı', difficulty: 'hard', length: 9 },
  { word: 'diplomasi', clue: 'Devletler arasındaki ilişkileri düzenleyen yöntem ve kurallar', difficulty: 'hard', length: 9 },
  { word: 'arkeoloji', clue: 'Eski uygarlıkların kalıntılarını kazarak inceleyen bilim dalı', difficulty: 'hard', length: 9 },
  { word: 'bürokrasi', clue: 'Devlet kurumlarındaki memurlar ve kurallar bütünü', difficulty: 'hard', length: 9 },
  { word: 'bağımsızlık', clue: 'Hiçbir güce veya devlete bağlı olmama, hür olma durumu', difficulty: 'hard', length: 11 },
  { word: 'frekans', clue: 'Bir titreşimin bir saniye içindeki tekrarlanma sayısı', difficulty: 'hard', length: 7 }
];

export default trDictionaryWords;
