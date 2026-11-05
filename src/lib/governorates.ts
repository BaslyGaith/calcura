// Les 24 gouvernorats de Tunisie (codes ISO 3166-2:TN) avec un point central approximatif.
export type GovernorateSeed = {
  code: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  lat: number;
  lng: number;
};

export const GOVERNORATES: GovernorateSeed[] = [
  { code: "TN-11", slug: "tunis", nameFr: "Tunis", nameEn: "Tunis", nameAr: "تونس", lat: 36.8065, lng: 10.1815 },
  { code: "TN-12", slug: "ariana", nameFr: "Ariana", nameEn: "Ariana", nameAr: "أريانة", lat: 36.8625, lng: 10.1956 },
  { code: "TN-13", slug: "ben-arous", nameFr: "Ben Arous", nameEn: "Ben Arous", nameAr: "بن عروس", lat: 36.7531, lng: 10.2189 },
  { code: "TN-14", slug: "manouba", nameFr: "La Manouba", nameEn: "Manouba", nameAr: "منوبة", lat: 36.8081, lng: 10.0972 },
  { code: "TN-21", slug: "nabeul", nameFr: "Nabeul", nameEn: "Nabeul", nameAr: "نابل", lat: 36.4561, lng: 10.7376 },
  { code: "TN-22", slug: "zaghouan", nameFr: "Zaghouan", nameEn: "Zaghouan", nameAr: "زغوان", lat: 36.4029, lng: 10.1429 },
  { code: "TN-23", slug: "bizerte", nameFr: "Bizerte", nameEn: "Bizerte", nameAr: "بنزرت", lat: 37.2744, lng: 9.8739 },
  { code: "TN-31", slug: "beja", nameFr: "Béja", nameEn: "Beja", nameAr: "باجة", lat: 36.7256, lng: 9.1817 },
  { code: "TN-32", slug: "jendouba", nameFr: "Jendouba", nameEn: "Jendouba", nameAr: "جندوبة", lat: 36.5011, lng: 8.7802 },
  { code: "TN-33", slug: "le-kef", nameFr: "Le Kef", nameEn: "Kef", nameAr: "الكاف", lat: 36.1742, lng: 8.7049 },
  { code: "TN-34", slug: "siliana", nameFr: "Siliana", nameEn: "Siliana", nameAr: "سليانة", lat: 36.0849, lng: 9.3708 },
  { code: "TN-41", slug: "kairouan", nameFr: "Kairouan", nameEn: "Kairouan", nameAr: "القيروان", lat: 35.6781, lng: 10.0963 },
  { code: "TN-42", slug: "kasserine", nameFr: "Kasserine", nameEn: "Kasserine", nameAr: "القصرين", lat: 35.1676, lng: 8.8365 },
  { code: "TN-43", slug: "sidi-bouzid", nameFr: "Sidi Bouzid", nameEn: "Sidi Bouzid", nameAr: "سيدي بوزيد", lat: 35.0382, lng: 9.4858 },
  { code: "TN-51", slug: "sousse", nameFr: "Sousse", nameEn: "Sousse", nameAr: "سوسة", lat: 35.8256, lng: 10.6084 },
  { code: "TN-52", slug: "monastir", nameFr: "Monastir", nameEn: "Monastir", nameAr: "المنستير", lat: 35.7643, lng: 10.8113 },
  { code: "TN-53", slug: "mahdia", nameFr: "Mahdia", nameEn: "Mahdia", nameAr: "المهدية", lat: 35.5047, lng: 11.0622 },
  { code: "TN-61", slug: "sfax", nameFr: "Sfax", nameEn: "Sfax", nameAr: "صفاقس", lat: 34.7406, lng: 10.7603 },
  { code: "TN-71", slug: "gafsa", nameFr: "Gafsa", nameEn: "Gafsa", nameAr: "قفصة", lat: 34.425, lng: 8.7842 },
  { code: "TN-72", slug: "tozeur", nameFr: "Tozeur", nameEn: "Tozeur", nameAr: "توزر", lat: 33.9197, lng: 8.1335 },
  { code: "TN-73", slug: "kebili", nameFr: "Kébili", nameEn: "Kebili", nameAr: "قبلي", lat: 33.7044, lng: 8.969 },
  { code: "TN-81", slug: "gabes", nameFr: "Gabès", nameEn: "Gabes", nameAr: "قابس", lat: 33.8815, lng: 10.0982 },
  { code: "TN-82", slug: "medenine", nameFr: "Médenine", nameEn: "Medenine", nameAr: "مدنين", lat: 33.3549, lng: 10.5055 },
  { code: "TN-83", slug: "tataouine", nameFr: "Tataouine", nameEn: "Tataouine", nameAr: "تطاوين", lat: 32.9297, lng: 10.4518 },
];
