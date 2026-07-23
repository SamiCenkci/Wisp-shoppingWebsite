// ---------------------------------------------------------------------------
// Category taxonomy
//
// Three levels: Hovedkategori > Underkategori > Produktkategori
// Plus optional per-branch attributes (e.g. Plattform for games).
//
// To extend: add a node to TAXONOMY. Nothing else needs changing — the forms,
// filters and detail pages all read from this file.
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

const CLOTHING_SIZE: AttributeField = {
  key: "storrelse",
  label: "Størrelse",
  options: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "Annet"],
};

const SHOE_SIZE: AttributeField = {
  key: "skostorrelse",
  label: "Skostørrelse",
  options: Array.from({ length: 22 }, (_, i) => String(30 + i)),
};

const FUEL: AttributeField = {
  key: "drivstoff",
  label: "Drivstoff",
  options: ["Bensin", "Diesel", "Elektrisk", "Hybrid", "Annet"],
};

const BIKE_TYPE: AttributeField = {
  key: "sykkeltype",
  label: "Type sykkel",
  options: ["Terrengsykkel", "Landeveissykkel", "Hybridsykkel", "Elsykkel", "Barnesykkel", "BMX", "Annet"],
};

export const TAXONOMY: MainCategory[] = [
  {
    name: "Elektronikk og hvitevarer",
    subs: [
      {
        name: "Spill og konsoll",
        products: [
          { name: "Spill", attributes: [PLATFORMS] },
          { name: "Spillkonsoller", attributes: [PLATFORMS] },
          { name: "Tilbehør", attributes: [PLATFORMS] },
        ],
      },
      {
        name: "Data",
        products: [
          { name: "Bærbar PC" }, { name: "Stasjonær PC" }, { name: "Nettbrett" },
          { name: "Skjermer" }, { name: "Komponenter" }, { name: "Tilbehør" },
        ],
      },
      {
        name: "Telefoner og tilbehør",
        products: [{ name: "Mobiltelefoner" }, { name: "Smartklokker" }, { name: "Deksler og tilbehør" }],
      },
      {
        name: "Lyd og bilde",
        products: [{ name: "TV" }, { name: "Høyttalere" }, { name: "Hodetelefoner" }, { name: "Hjemmekino" }],
      },
      {
        name: "Foto og video",
        products: [{ name: "Kameraer" }, { name: "Objektiver" }, { name: "Droner" }, { name: "Tilbehør" }],
      },
      { name: "Hvitevarer", products: [{ name: "Kjøleskap" }, { name: "Vaskemaskin" }, { name: "Oppvaskmaskin" }, { name: "Komfyr" }] },
      { name: "Husholdningsapparater", products: [{ name: "Støvsuger" }, { name: "Kjøkkenmaskiner" }, { name: "Kaffemaskiner" }] },
      { name: "Personlig pleie" },
      { name: "Annet" },
    ],
  },
  {
    name: "Møbler og interiør",
    subs: [
      { name: "Sofa og lenestol", products: [{ name: "Sofa" }, { name: "Lenestol" }, { name: "Sovesofa" }] },
      { name: "Bord og stoler", products: [{ name: "Spisebord" }, { name: "Salongbord" }, { name: "Stoler" }, { name: "Skrivebord" }] },
      { name: "Oppbevaring", products: [{ name: "Hyller" }, { name: "Skap" }, { name: "Kommode" }] },
      { name: "Seng og soverom", products: [{ name: "Senger" }, { name: "Madrasser" }, { name: "Sengetøy" }] },
      { name: "Belysning" },
      { name: "Dekorasjon" },
      { name: "Annet" },
    ],
  },
  {
    name: "Klær, kosmetikk og tilbehør",
    subs: [
      { name: "Dameklær", products: [{ name: "Overdeler", attributes: [CLOTHING_SIZE] }, { name: "Bukser", attributes: [CLOTHING_SIZE] }, { name: "Kjoler", attributes: [CLOTHING_SIZE] }, { name: "Jakker", attributes: [CLOTHING_SIZE] }] },
      { name: "Herreklær", products: [{ name: "Overdeler", attributes: [CLOTHING_SIZE] }, { name: "Bukser", attributes: [CLOTHING_SIZE] }, { name: "Jakker", attributes: [CLOTHING_SIZE] }, { name: "Dresser", attributes: [CLOTHING_SIZE] }] },
      { name: "Sko", products: [{ name: "Damesko", attributes: [SHOE_SIZE] }, { name: "Herresko", attributes: [SHOE_SIZE] }, { name: "Barnesko", attributes: [SHOE_SIZE] }] },
      { name: "Vesker og bagasje" },
      { name: "Klokker og smykker" },
      { name: "Kosmetikk" },
      { name: "Annet" },
    ],
  },
  {
    name: "Sport og friluftsliv",
    subs: [
      { name: "Sykkel", products: [{ name: "Sykler", attributes: [BIKE_TYPE] }, { name: "Sykkeldeler" }, { name: "Sykkeltilbehør" }] },
      { name: "Ski og vintersport", products: [{ name: "Alpint" }, { name: "Langrenn" }, { name: "Snowboard" }, { name: "Skøyter" }] },
      { name: "Trening og styrke", products: [{ name: "Vekter" }, { name: "Treningsapparater" }, { name: "Tilbehør" }] },
      { name: "Camping og friluft", products: [{ name: "Telt" }, { name: "Soveposer" }, { name: "Sekker" }] },
      { name: "Fiske og jakt" },
      { name: "Vannsport" },
      { name: "Annet" },
    ],
  },
  {
    name: "Utstyr til bil, båt og MC",
    subs: [
      { name: "Bildeler", products: [{ name: "Dekk og felger" }, { name: "Motordeler", attributes: [FUEL] }, { name: "Interiør" }, { name: "Eksteriør" }] },
      { name: "Bilutstyr", products: [{ name: "Takstativ" }, { name: "Barneseter" }, { name: "Elektronikk" }] },
      { name: "Båtutstyr", products: [{ name: "Motorer" }, { name: "Navigasjon" }, { name: "Sikkerhet" }] },
      { name: "MC-utstyr", products: [{ name: "Hjelmer" }, { name: "Kjøredress" }, { name: "Deler" }] },
      { name: "Annet" },
    ],
  },
  {
    name: "Fritid, hobby og underholdning",
    subs: [
      { name: "Musikkinstrumenter", products: [{ name: "Gitar" }, { name: "Piano og keyboard" }, { name: "Trommer" }, { name: "Blåseinstrumenter" }] },
      { name: "Bøker og blader" },
      { name: "Film og musikk", products: [{ name: "Filmer" }, { name: "Vinyl" }, { name: "CD" }] },
      { name: "Samleobjekter" },
      { name: "Brettspill og puslespill" },
      { name: "Annet" },
    ],
  },
  {
    name: "Hage, oppussing og hus",
    subs: [
      { name: "Verktøy", products: [{ name: "Elektroverktøy" }, { name: "Håndverktøy" }, { name: "Måleverktøy" }] },
      { name: "Byggevarer", products: [{ name: "Trelast" }, { name: "Isolasjon" }, { name: "Maling" }] },
      { name: "Hage", products: [{ name: "Hagemøbler" }, { name: "Gressklipper" }, { name: "Planter" }] },
      { name: "Oppvarming", products: [{ name: "Peis og ovn" }, { name: "Varmepumpe" }] },
      { name: "Annet" },
    ],
  },
  {
    name: "Foreldre og barn",
    subs: [
      { name: "Barneklær", products: [{ name: "0-2 år", attributes: [CLOTHING_SIZE] }, { name: "2-6 år", attributes: [CLOTHING_SIZE] }, { name: "6-12 år", attributes: [CLOTHING_SIZE] }] },
      { name: "Barnevogn og bilstol", products: [{ name: "Barnevogner" }, { name: "Bilstoler" }, { name: "Bæreseler" }] },
      { name: "Leker", products: [{ name: "Byggeleker" }, { name: "Utendørsleker" }, { name: "Kosedyr" }] },
      { name: "Barnemøbler" },
      { name: "Annet" },
    ],
  },
  {
    name: "Dyr og utstyr",
    subs: [
      { name: "Hund", products: [{ name: "Utstyr" }, { name: "Fôr" }, { name: "Bur og senger" }] },
      { name: "Katt", products: [{ name: "Utstyr" }, { name: "Fôr" }, { name: "Klorestativ" }] },
      { name: "Hest og ridning" },
      { name: "Smådyr og fugler" },
      { name: "Akvarium" },
      { name: "Annet" },
    ],
  },
  {
    name: "Antikviteter og kunst",
    subs: [
      { name: "Kunst", products: [{ name: "Malerier" }, { name: "Grafikk" }, { name: "Skulptur" }] },
      { name: "Antikke møbler" },
      { name: "Glass og porselen" },
      { name: "Mynter og frimerker" },
      { name: "Annet" },
    ],
  },
  {
    name: "Næringsvirksomhet",
    subs: [
      { name: "Kontorutstyr" },
      { name: "Maskiner" },
      { name: "Butikkinnredning" },
      { name: "Annet" },
    ],
  },
];

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

/** Backwards compatible: the old flat list of category names. */
export const CATEGORIES = TAXONOMY.map((m) => m.name);