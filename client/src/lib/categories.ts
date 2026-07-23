// ---------------------------------------------------------------------------
// Category taxonomy
//
// Three levels: Hovedkategori > Underkategori > Produktkategori
// Plus per-branch attributes (Merke, Størrelse, Plattform, ...).
//
// To extend: add a node to TAXONOMY. The forms, filters and detail pages all
// read from this file — nothing else needs changing.
// ---------------------------------------------------------------------------

export type AttributeField = {
  key: string;        // stored in the listing's attributes JSON
  label: string;      // shown in the form
  options: string[];
};

export type ProductCategory = {
  name: string;
  attributes?: AttributeField[];
};

export type SubCategory = {
  name: string;
  products?: ProductCategory[];
  attributes?: AttributeField[];
};

export type MainCategory = {
  name: string;
  subs: SubCategory[];
};

// --- Shared attribute definitions ----------------------------------------

const COLOR: AttributeField = {
  key: "farge",
  label: "Farge",
  options: ["Svart", "Hvit", "Grå", "Beige", "Brun", "Blå", "Grønn", "Rød", "Gul", "Rosa", "Lilla", "Flerfarget", "Annet"],
};

const MATERIAL: AttributeField = {
  key: "materiale",
  label: "Materiale",
  options: ["Tre", "Metall", "Glass", "Plast", "Stoff", "Skinn", "Kunstskinn", "Rotting", "Marmor", "Annet"],
};

const PLATFORMS: AttributeField = {
  key: "plattform",
  label: "Plattform",
  options: [
    "Nintendo DS", "Nintendo 3DS", "Nintendo GameCube", "Nintendo NES (8-bit)",
    "Super Nintendo", "Nintendo 64", "Nintendo Switch", "Nintendo Switch 2",
    "Nintendo Wii", "PlayStation", "PlayStation 2", "PlayStation 3",
    "PlayStation 4", "PlayStation 5", "PSP", "PS Vita", "Xbox", "Xbox 360",
    "Xbox One", "Xbox Series", "PC", "MAC", "Annet",
  ],
};

const TECH_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: [
    "Apple", "Samsung", "Sony", "LG", "Microsoft", "Nintendo", "HP", "Dell",
    "Lenovo", "Asus", "Acer", "Huawei", "Xiaomi", "OnePlus", "Google",
    "Bosch", "Siemens", "Electrolux", "Miele", "Philips", "Bose", "Sennheiser",
    "JBL", "Canon", "Nikon", "GoPro", "DJI", "Annet",
  ],
};

const FURNITURE_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: ["IKEA", "Bolia", "Slettvoll", "Ekornes", "Stokke", "HAY", "Muuto", "String", "Montana", "Jysk", "Skeidar", "Annet"],
};

const CLOTHING_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: [
    "Nike", "Adidas", "Puma", "H&M", "Zara", "Levi's", "Ralph Lauren",
    "Tommy Hilfiger", "Gucci", "Prada", "Napapijri", "Helly Hansen",
    "Bergans", "Norrøna", "Devold", "Dale of Norway", "Annet",
  ],
};

const CLOTHING_SIZE: AttributeField = {
  key: "storrelse",
  label: "Størrelse",
  options: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "Annet"],
};

const KIDS_SIZE: AttributeField = {
  key: "barnestorrelse",
  label: "Størrelse (cm)",
  options: ["50", "56", "62", "68", "74", "80", "86", "92", "98", "104", "110", "116", "122", "128", "134", "140", "146", "152", "158", "164"],
};

const SHOE_SIZE: AttributeField = {
  key: "skostorrelse",
  label: "Skostørrelse",
  options: Array.from({ length: 22 }, (_, i) => String(30 + i)),
};

const SPORT_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: [
    "Nike", "Adidas", "Under Armour", "Salomon", "Atomic", "Rossignol",
    "Fischer", "Head", "Burton", "Trek", "Specialized", "Scott", "Cannondale",
    "Cube", "Bergans", "Helly Hansen", "Norrøna", "Fjällräven", "Annet",
  ],
};

const BIKE_TYPE: AttributeField = {
  key: "sykkeltype",
  label: "Type sykkel",
  options: ["Terrengsykkel", "Landeveissykkel", "Hybridsykkel", "Elsykkel", "Barnesykkel", "BMX", "Annet"],
};

const CAR_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: [
    "Audi", "BMW", "Ford", "Honda", "Hyundai", "Kia", "Mazda", "Mercedes-Benz",
    "Nissan", "Opel", "Peugeot", "Renault", "Skoda", "Subaru", "Suzuki",
    "Tesla", "Toyota", "Volkswagen", "Volvo", "Annet",
  ],
};

const FUEL: AttributeField = {
  key: "drivstoff",
  label: "Drivstoff",
  options: ["Bensin", "Diesel", "Elektrisk", "Hybrid", "Annet"],
};

const INSTRUMENT_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: ["Fender", "Gibson", "Ibanez", "Yamaha", "Roland", "Korg", "Casio", "Pearl", "Tama", "Marshall", "Boss", "Annet"],
};

const TOOL_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: ["Bosch", "Makita", "DeWalt", "Milwaukee", "Hilti", "Festool", "Ryobi", "Einhell", "Stihl", "Husqvarna", "Biltema", "Annet"],
};

const BABY_BRAND: AttributeField = {
  key: "merke",
  label: "Merke",
  options: ["Stokke", "Bugaboo", "Cybex", "Britax", "Maxi-Cosi", "BabyBjörn", "Emmaljunga", "Thule", "LEGO", "BRIO", "Annet"],
};

const PET_TYPE: AttributeField = {
  key: "dyretype",
  label: "Dyretype",
  options: ["Hund", "Katt", "Hest", "Kanin", "Gnager", "Fugl", "Fisk", "Krypdyr", "Annet"],
};

const ERA: AttributeField = {
  key: "epoke",
  label: "Epoke",
  options: ["Før 1900", "1900-1930", "1930-1950", "1950-1970", "1970-1990", "1990-2000", "Etter 2000", "Ukjent"],
};

// --- The taxonomy ---------------------------------------------------------

export const TAXONOMY: MainCategory[] = [
  {
    name: "Elektronikk og hvitevarer",
    subs: [
      {
        name: "Spill og konsoll",
        products: [
          { name: "Spill", attributes: [PLATFORMS] },
          { name: "Spillkonsoller", attributes: [PLATFORMS, TECH_BRAND] },
          { name: "Tilbehør", attributes: [PLATFORMS, TECH_BRAND] },
        ],
      },
      {
        name: "Data",
        products: [
          { name: "Bærbar PC", attributes: [TECH_BRAND] },
          { name: "Stasjonær PC", attributes: [TECH_BRAND] },
          { name: "Nettbrett", attributes: [TECH_BRAND] },
          { name: "Skjermer", attributes: [TECH_BRAND] },
          { name: "Komponenter", attributes: [TECH_BRAND] },
          { name: "Tilbehør", attributes: [TECH_BRAND] },
        ],
      },
      {
        name: "Telefoner og tilbehør",
        products: [
          { name: "Mobiltelefoner", attributes: [TECH_BRAND, COLOR] },
          { name: "Smartklokker", attributes: [TECH_BRAND, COLOR] },
          { name: "Deksler og tilbehør", attributes: [TECH_BRAND] },
        ],
      },
      {
        name: "Lyd og bilde",
        products: [
          { name: "TV", attributes: [TECH_BRAND] },
          { name: "Høyttalere", attributes: [TECH_BRAND] },
          { name: "Hodetelefoner", attributes: [TECH_BRAND, COLOR] },
          { name: "Hjemmekino", attributes: [TECH_BRAND] },
        ],
      },
      {
        name: "Foto og video",
        products: [
          { name: "Kameraer", attributes: [TECH_BRAND] },
          { name: "Objektiver", attributes: [TECH_BRAND] },
          { name: "Droner", attributes: [TECH_BRAND] },
          { name: "Tilbehør", attributes: [TECH_BRAND] },
        ],
      },
      {
        name: "Hvitevarer",
        products: [
          { name: "Kjøleskap", attributes: [TECH_BRAND] },
          { name: "Vaskemaskin", attributes: [TECH_BRAND] },
          { name: "Oppvaskmaskin", attributes: [TECH_BRAND] },
          { name: "Komfyr", attributes: [TECH_BRAND] },
        ],
      },
      {
        name: "Husholdningsapparater",
        products: [
          { name: "Støvsuger", attributes: [TECH_BRAND] },
          { name: "Kjøkkenmaskiner", attributes: [TECH_BRAND] },
          { name: "Kaffemaskiner", attributes: [TECH_BRAND] },
        ],
      },
      { name: "Personlig pleie", attributes: [TECH_BRAND] },
      { name: "Annet", attributes: [TECH_BRAND] },
    ],
  },
  {
    name: "Møbler og interiør",
    subs: [
      {
        name: "Sofa og lenestol",
        products: [
          { name: "Sofa", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
          { name: "Lenestol", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
          { name: "Sovesofa", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
        ],
      },
      {
        name: "Bord og stoler",
        products: [
          { name: "Spisebord", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
          { name: "Salongbord", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
          { name: "Stoler", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
          { name: "Skrivebord", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
        ],
      },
      {
        name: "Oppbevaring",
        products: [
          { name: "Hyller", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
          { name: "Skap", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
          { name: "Kommode", attributes: [FURNITURE_BRAND, MATERIAL, COLOR] },
        ],
      },
      {
        name: "Seng og soverom",
        products: [
          { name: "Senger", attributes: [FURNITURE_BRAND, MATERIAL] },
          { name: "Madrasser", attributes: [FURNITURE_BRAND] },
          { name: "Sengetøy", attributes: [COLOR] },
        ],
      },
      { name: "Belysning", attributes: [FURNITURE_BRAND, COLOR] },
      { name: "Dekorasjon", attributes: [MATERIAL, COLOR] },
      { name: "Annet", attributes: [FURNITURE_BRAND, COLOR] },
    ],
  },
  {
    name: "Klær, kosmetikk og tilbehør",
    subs: [
      {
        name: "Dameklær",
        products: [
          { name: "Overdeler", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Bukser", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Kjoler", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Jakker", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
        ],
      },
      {
        name: "Herreklær",
        products: [
          { name: "Overdeler", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Bukser", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Jakker", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Dresser", attributes: [CLOTHING_SIZE, CLOTHING_BRAND, COLOR] },
        ],
      },
      {
        name: "Sko",
        products: [
          { name: "Damesko", attributes: [SHOE_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Herresko", attributes: [SHOE_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "Barnesko", attributes: [SHOE_SIZE, CLOTHING_BRAND, COLOR] },
        ],
      },
      { name: "Vesker og bagasje", attributes: [CLOTHING_BRAND, COLOR, MATERIAL] },
      { name: "Klokker og smykker", attributes: [CLOTHING_BRAND, COLOR, MATERIAL] },
      { name: "Kosmetikk", attributes: [CLOTHING_BRAND] },
      { name: "Annet", attributes: [CLOTHING_BRAND, COLOR] },
    ],
  },
  {
    name: "Sport og friluftsliv",
    subs: [
      {
        name: "Sykkel",
        products: [
          { name: "Sykler", attributes: [BIKE_TYPE, SPORT_BRAND, COLOR] },
          { name: "Sykkeldeler", attributes: [SPORT_BRAND] },
          { name: "Sykkeltilbehør", attributes: [SPORT_BRAND] },
        ],
      },
      {
        name: "Ski og vintersport",
        products: [
          { name: "Alpint", attributes: [SPORT_BRAND] },
          { name: "Langrenn", attributes: [SPORT_BRAND] },
          { name: "Snowboard", attributes: [SPORT_BRAND] },
          { name: "Skøyter", attributes: [SPORT_BRAND, SHOE_SIZE] },
        ],
      },
      {
        name: "Trening og styrke",
        products: [
          { name: "Vekter", attributes: [SPORT_BRAND] },
          { name: "Treningsapparater", attributes: [SPORT_BRAND] },
          { name: "Tilbehør", attributes: [SPORT_BRAND] },
        ],
      },
      {
        name: "Camping og friluft",
        products: [
          { name: "Telt", attributes: [SPORT_BRAND] },
          { name: "Soveposer", attributes: [SPORT_BRAND] },
          { name: "Sekker", attributes: [SPORT_BRAND] },
        ],
      },
      { name: "Fiske og jakt", attributes: [SPORT_BRAND] },
      { name: "Vannsport", attributes: [SPORT_BRAND] },
      { name: "Annet", attributes: [SPORT_BRAND] },
    ],
  },
  {
    name: "Utstyr til bil, båt og MC",
    subs: [
      {
        name: "Bildeler",
        products: [
          { name: "Dekk og felger", attributes: [CAR_BRAND] },
          { name: "Motordeler", attributes: [CAR_BRAND, FUEL] },
          { name: "Interiør", attributes: [CAR_BRAND, COLOR] },
          { name: "Eksteriør", attributes: [CAR_BRAND, COLOR] },
        ],
      },
      {
        name: "Bilutstyr",
        products: [
          { name: "Takstativ", attributes: [CAR_BRAND] },
          { name: "Barneseter", attributes: [BABY_BRAND] },
          { name: "Elektronikk", attributes: [TECH_BRAND] },
        ],
      },
      {
        name: "Båtutstyr",
        products: [
          { name: "Motorer", attributes: [FUEL] },
          { name: "Navigasjon", attributes: [TECH_BRAND] },
          { name: "Sikkerhet" },
        ],
      },
      {
        name: "MC-utstyr",
        products: [
          { name: "Hjelmer", attributes: [COLOR, CLOTHING_SIZE] },
          { name: "Kjøredress", attributes: [CLOTHING_SIZE, COLOR] },
          { name: "Deler" },
        ],
      },
      { name: "Annet", attributes: [CAR_BRAND] },
    ],
  },
  {
    name: "Fritid, hobby og underholdning",
    subs: [
      {
        name: "Musikkinstrumenter",
        products: [
          { name: "Gitar", attributes: [INSTRUMENT_BRAND, COLOR] },
          { name: "Piano og keyboard", attributes: [INSTRUMENT_BRAND] },
          { name: "Trommer", attributes: [INSTRUMENT_BRAND] },
          { name: "Blåseinstrumenter", attributes: [INSTRUMENT_BRAND] },
        ],
      },
      { name: "Bøker og blader" },
      {
        name: "Film og musikk",
        products: [{ name: "Filmer" }, { name: "Vinyl" }, { name: "CD" }],
      },
      { name: "Samleobjekter", attributes: [ERA] },
      { name: "Brettspill og puslespill" },
      { name: "Annet" },
    ],
  },
  {
    name: "Hage, oppussing og hus",
    subs: [
      {
        name: "Verktøy",
        products: [
          { name: "Elektroverktøy", attributes: [TOOL_BRAND] },
          { name: "Håndverktøy", attributes: [TOOL_BRAND] },
          { name: "Måleverktøy", attributes: [TOOL_BRAND] },
        ],
      },
      {
        name: "Byggevarer",
        products: [
          { name: "Trelast", attributes: [MATERIAL] },
          { name: "Isolasjon" },
          { name: "Maling", attributes: [COLOR] },
        ],
      },
      {
        name: "Hage",
        products: [
          { name: "Hagemøbler", attributes: [MATERIAL, COLOR] },
          { name: "Gressklipper", attributes: [TOOL_BRAND] },
          { name: "Planter" },
        ],
      },
      {
        name: "Oppvarming",
        products: [{ name: "Peis og ovn", attributes: [MATERIAL] }, { name: "Varmepumpe", attributes: [TECH_BRAND] }],
      },
      { name: "Annet", attributes: [TOOL_BRAND] },
    ],
  },
  {
    name: "Foreldre og barn",
    subs: [
      {
        name: "Barneklær",
        products: [
          { name: "0-2 år", attributes: [KIDS_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "2-6 år", attributes: [KIDS_SIZE, CLOTHING_BRAND, COLOR] },
          { name: "6-12 år", attributes: [KIDS_SIZE, CLOTHING_BRAND, COLOR] },
        ],
      },
      {
        name: "Barnevogn og bilstol",
        products: [
          { name: "Barnevogner", attributes: [BABY_BRAND, COLOR] },
          { name: "Bilstoler", attributes: [BABY_BRAND, COLOR] },
          { name: "Bæreseler", attributes: [BABY_BRAND, COLOR] },
        ],
      },
      {
        name: "Leker",
        products: [
          { name: "Byggeleker", attributes: [BABY_BRAND] },
          { name: "Utendørsleker", attributes: [BABY_BRAND] },
          { name: "Kosedyr" },
        ],
      },
      { name: "Barnemøbler", attributes: [BABY_BRAND, MATERIAL, COLOR] },
      { name: "Annet", attributes: [BABY_BRAND] },
    ],
  },
  {
    name: "Dyr og utstyr",
    subs: [
      {
        name: "Hund",
        products: [{ name: "Utstyr" }, { name: "Fôr" }, { name: "Bur og senger" }],
      },
      {
        name: "Katt",
        products: [{ name: "Utstyr" }, { name: "Fôr" }, { name: "Klorestativ" }],
      },
      { name: "Hest og ridning" },
      { name: "Smådyr og fugler", attributes: [PET_TYPE] },
      { name: "Akvarium" },
      { name: "Annet", attributes: [PET_TYPE] },
    ],
  },
  {
    name: "Antikviteter og kunst",
    subs: [
      {
        name: "Kunst",
        products: [
          { name: "Malerier", attributes: [ERA, COLOR] },
          { name: "Grafikk", attributes: [ERA] },
          { name: "Skulptur", attributes: [ERA, MATERIAL] },
        ],
      },
      { name: "Antikke møbler", attributes: [ERA, MATERIAL] },
      { name: "Glass og porselen", attributes: [ERA] },
      { name: "Mynter og frimerker", attributes: [ERA] },
      { name: "Annet", attributes: [ERA] },
    ],
  },
  {
    name: "Næringsvirksomhet",
    subs: [
      { name: "Kontorutstyr", attributes: [TECH_BRAND] },
      { name: "Maskiner", attributes: [TOOL_BRAND] },
      { name: "Butikkinnredning", attributes: [MATERIAL] },
      { name: "Annet" },
    ],
  },
  {
    name: "Annet",
    subs: [
      { name: "Diverse", products: [{ name: "Ukategorisert" }] },
      { name: "Gis bort" },
      { name: "Ønskes kjøpt" },
    ],
  },
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Antikviteter og kunst": "🖼️",
  "Dyr og utstyr": "🐾",
  "Elektronikk og hvitevarer": "💻",
  "Foreldre og barn": "🧸",
  "Fritid, hobby og underholdning": "🎸",
  "Hage, oppussing og hus": "🔨",
  "Klær, kosmetikk og tilbehør": "👕",
  "Møbler og interiør": "🛋️",
  "Næringsvirksomhet": "🏢",
  "Sport og friluftsliv": "⚽",
  "Utstyr til bil, båt og MC": "🚗",
  "Annet": "🏷️",
};

// --- Lookup helpers -------------------------------------------------------

export function getMain(name: string) {
  return TAXONOMY.find((m) => m.name === name);
}

export function getSubs(mainName: string): SubCategory[] {
  return getMain(mainName)?.subs ?? [];
}

export function getProducts(mainName: string, subName: string): ProductCategory[] {
  return getSubs(mainName).find((s) => s.name === subName)?.products ?? [];
}

/** Attribute fields for the deepest selected level (product wins over sub). */
export function getAttributes(mainName: string, subName: string, productName: string): AttributeField[] {
  const sub = getSubs(mainName).find((s) => s.name === subName);
  if (!sub) return [];
  const product = sub.products?.find((p) => p.name === productName);
  return product?.attributes ?? sub.attributes ?? [];
}

/** Maps attribute keys to their Norwegian labels, built from the taxonomy. */
export const ATTRIBUTE_LABELS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const main of TAXONOMY) {
    for (const sub of main.subs) {
      for (const f of sub.attributes ?? []) map[f.key] = f.label;
      for (const p of sub.products ?? []) {
        for (const f of p.attributes ?? []) map[f.key] = f.label;
      }
    }
  }
  return map;
})();

/** Backwards compatible: the old flat list of category names. */
export const CATEGORIES = TAXONOMY.map((m) => m.name);
