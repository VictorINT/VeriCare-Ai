// Approximate coordinates for Ghana cities and regions
const GHANA_CITIES: Record<string, [number, number]> = {
  accra: [5.6037, -0.1870],
  kumasi: [6.6885, -1.6244],
  tamale: [9.4008, -0.8393],
  takoradi: [4.8986, -1.7601],
  "sekondi-takoradi": [4.9261, -1.7538],
  "cape coast": [5.1036, -1.2466],
  koforidua: [6.0941, -0.2573],
  sunyani: [7.3349, -2.3269],
  ho: [6.6009, 0.4713],
  wa: [10.0601, -2.5099],
  bolgatanga: [10.7855, -0.8514],
  techiman: [7.5853, -1.9344],
  tema: [5.6698, -0.0166],
  obuasi: [6.2024, -1.6658],
  nkawkaw: [6.5500, -0.7667],
  winneba: [5.3500, -0.6250],
  tarkwa: [5.3000, -1.9833],
  dansoman: [5.5350, -0.2580],
  madina: [5.6800, -0.1670],
  kasoa: [5.5340, -0.4190],
  ashaiman: [5.6880, -0.0330],
  akim_oda: [5.9300, -0.9800],
  dominase: [5.2167, -1.2833],
  apremdo: [4.9200, -1.7400],
  acherensua: [6.9833, -2.3667],
  abesim: [7.3500, -2.3167],
  haatso: [5.6600, -0.2100],
  krofrom: [6.7100, -1.6300],
  hohoe: [7.1500, 0.4700],
  aflao: [6.1200, 1.1900],
  somanya: [6.1000, -0.0167],
  nsawam: [5.8000, -0.3500],
  suhum: [6.0400, -0.4500],
  asamankese: [5.8667, -0.6667],
  kintampo: [8.0500, -1.7300],
  bawku: [11.0600, -0.2400],
  yendi: [9.4400, -0.0100],
  axim: [4.8700, -2.2400],
  bibiani: [6.4500, -2.3300],
  agona_swedru: [5.5333, -0.7000],
  ejura: [7.3800, -1.3600],
  berekum: [7.4500, -2.5800],
  dormaa_ahenkro: [7.3600, -2.9600],
  goaso: [6.8000, -2.5200],
  mampong: [7.0700, -1.4000],
  konongo: [6.6200, -1.2200],
  wenchi: [7.7400, -2.1000],
  navrongo: [10.8900, -1.0900],
  tumu: [10.8800, -1.9800],
};

const GHANA_REGIONS: Record<string, [number, number]> = {
  "greater accra": [5.6037, -0.1870],
  ashanti: [6.7470, -1.5209],
  western: [5.0, -2.0],
  "western north": [6.2, -2.4],
  central: [5.5, -1.0],
  eastern: [6.3, -0.5],
  volta: [6.8, 0.5],
  "oti": [7.8, 0.3],
  "northern": [9.5, -1.0],
  "north east": [10.5, -0.3],
  "savannah": [9.0, -1.8],
  "upper east": [10.8, -0.8],
  "upper west": [10.3, -2.3],
  "bono": [7.5, -2.3],
  "bono east": [7.8, -1.2],
  ahafo: [6.9, -2.4],
};

export function lookupGhanaCoords(city?: string, region?: string, country?: string): [number, number] | null {
  // Only attempt for Ghana
  if (country && country.toLowerCase() !== "ghana" && country.toLowerCase() !== "gh") return null;

  if (city) {
    const key = city.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (GHANA_CITIES[key]) return GHANA_CITIES[key];
    // Try partial match
    for (const [k, v] of Object.entries(GHANA_CITIES)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
  }

  if (region) {
    const key = region.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (GHANA_REGIONS[key]) return GHANA_REGIONS[key];
    for (const [k, v] of Object.entries(GHANA_REGIONS)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
  }

  // Default Ghana center
  if (!country || country.toLowerCase() === "ghana" || country.toLowerCase() === "gh") {
    return [7.9465, -1.0232];
  }

  return null;
}
