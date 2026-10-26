export interface CountyOption {
  name: string;
  lat: number;
  lng: number;
}

export const KENYA_COUNTIES: CountyOption[] = [
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
  { name: 'Kisumu', lat: -0.0917, lng: 34.768 },
  { name: 'Nakuru', lat: -0.3031, lng: 36.08 },
  { name: 'Uasin Gishu', lat: 0.5143, lng: 35.2698 },
  { name: 'Kiambu', lat: -1.1714, lng: 36.8356 },
  { name: 'Machakos', lat: -1.5177, lng: 37.2634 },
  { name: 'Kajiado', lat: -1.8521, lng: 36.7768 },
  { name: 'Nyeri', lat: -0.4169, lng: 36.9511 },
  { name: 'Meru', lat: 0.0463, lng: 37.6559 },
  { name: 'Kakamega', lat: 0.2827, lng: 34.7519 },
  { name: 'Bungoma', lat: 0.5635, lng: 34.5606 },
  { name: 'Busia', lat: 0.4608, lng: 34.1115 },
  { name: 'Siaya', lat: 0.0613, lng: 34.2882 },
  { name: 'Homa Bay', lat: -0.5273, lng: 34.4571 },
  { name: 'Migori', lat: -1.0634, lng: 34.4731 },
  { name: 'Kisii', lat: -0.6817, lng: 34.7667 },
  { name: 'Nyamira', lat: -0.5633, lng: 34.9358 },
  { name: 'Kericho', lat: -0.3689, lng: 35.2833 },
  { name: 'Bomet', lat: -0.7892, lng: 35.3416 },
  { name: 'Narok', lat: -1.0878, lng: 35.8711 },
  { name: 'Nandi', lat: 0.1833, lng: 35.1 },
  { name: 'Trans Nzoia', lat: 1.0566, lng: 34.9505 },
  { name: 'West Pokot', lat: 1.6214, lng: 35.1134 },
  { name: 'Turkana', lat: 3.1191, lng: 35.5973 },
  { name: 'Samburu', lat: 1.2153, lng: 36.9833 },
  { name: 'Laikipia', lat: 0.1932, lng: 36.7424 },
  { name: 'Isiolo', lat: 0.3546, lng: 37.5821 },
  { name: 'Marsabit', lat: 2.3344, lng: 37.9906 },
  { name: 'Mandera', lat: 3.9366, lng: 41.867 },
  { name: 'Wajir', lat: 1.7471, lng: 40.0573 },
  { name: 'Garissa', lat: -0.4536, lng: 39.6461 },
  { name: 'Tana River', lat: -1.5, lng: 39.7333 },
  { name: 'Lamu', lat: -2.2717, lng: 40.902 },
  { name: 'Kilifi', lat: -3.6305, lng: 39.8499 },
  { name: 'Kwale', lat: -4.1737, lng: 39.452 },
  { name: 'Taita Taveta', lat: -3.3167, lng: 38.4833 },
  { name: 'Kitui', lat: -1.3667, lng: 38.0167 },
  { name: 'Makueni', lat: -1.8032, lng: 37.6241 },
  { name: 'Embu', lat: -0.5393, lng: 37.4574 },
  { name: 'Tharaka Nithi', lat: -0.1167, lng: 37.8667 },
  { name: 'Kirinyaga', lat: -0.5, lng: 37.2833 },
  { name: "Murang'a", lat: -0.7167, lng: 37.15 },
  { name: 'Nyandarua', lat: -0.3833, lng: 36.35 },
  { name: 'Vihiga', lat: 0.05, lng: 34.7167 },
  { name: 'Baringo', lat: 0.4667, lng: 35.9667 },
  { name: 'Elgeyo Marakwet', lat: 0.7, lng: 35.5 },
];

export function lookupCounty(name: string): CountyOption | undefined {
  return KENYA_COUNTIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
