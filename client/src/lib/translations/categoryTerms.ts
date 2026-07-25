// ---------------------------------------------------------------------------
// English display names for category taxonomy terms.
//
// Category names, attribute labels and attribute option values are stored in
// Norwegian — they are identifiers in the database and the API. This map is
// display-only: the UI shows the English name while forms and filters keep
// submitting the canonical Norwegian value. A term missing here simply
// renders in Norwegian (proper nouns like "IKEA" or "PlayStation 4" don't
// need an entry).
// ---------------------------------------------------------------------------

export const categoryTermsEn: Record<string, string> = {
  // --- Main categories ----------------------------------------------------
  "Elektronikk og hvitevarer": "Electronics and appliances",
  "Møbler og interiør": "Furniture and interior",
  "Klær, kosmetikk og tilbehør": "Clothing, cosmetics and accessories",
  "Sport og friluftsliv": "Sports and outdoors",
  "Utstyr til bil, båt og MC": "Car, boat and motorcycle equipment",
  "Fritid, hobby og underholdning": "Leisure, hobbies and entertainment",
  "Hage, oppussing og hus": "Garden, renovation and home",
  "Foreldre og barn": "Parents and children",
  "Dyr og utstyr": "Pets and supplies",
  "Antikviteter og kunst": "Antiques and art",
  "Næringsvirksomhet": "Business",
  // "Annet" is shared with subcategories and attribute options — see below.

  // --- Subcategories ------------------------------------------------------
  // Elektronikk og hvitevarer
  "Spill og konsoll": "Games and consoles",
  "Data": "Computers",
  "Telefoner og tilbehør": "Phones and accessories",
  "Lyd og bilde": "Audio and video",
  "Foto og video": "Photo and video",
  "Hvitevarer": "White goods",
  "Husholdningsapparater": "Household appliances",
  "Personlig pleie": "Personal care",
  // Møbler og interiør
  "Sofa og lenestol": "Sofas and armchairs",
  "Bord og stoler": "Tables and chairs",
  "Oppbevaring": "Storage",
  "Seng og soverom": "Beds and bedroom",
  "Belysning": "Lighting",
  "Dekorasjon": "Decoration",
  // Klær, kosmetikk og tilbehør
  "Dameklær": "Women's clothing",
  "Herreklær": "Men's clothing",
  "Sko": "Shoes",
  "Vesker og bagasje": "Bags and luggage",
  "Klokker og smykker": "Watches and jewelry",
  "Kosmetikk": "Cosmetics",
  // Sport og friluftsliv
  "Sykkel": "Bicycles",
  "Ski og vintersport": "Skiing and winter sports",
  "Trening og styrke": "Fitness and strength",
  "Camping og friluft": "Camping and outdoors",
  "Fiske og jakt": "Fishing and hunting",
  "Vannsport": "Water sports",
  // Utstyr til bil, båt og MC
  "Bildeler": "Car parts",
  "Bilutstyr": "Car accessories",
  "Båtutstyr": "Boat equipment",
  "MC-utstyr": "Motorcycle equipment",
  // Fritid, hobby og underholdning
  "Musikkinstrumenter": "Musical instruments",
  "Bøker og blader": "Books and magazines",
  "Film og musikk": "Movies and music",
  "Samleobjekter": "Collectibles",
  "Brettspill og puslespill": "Board games and puzzles",
  // Hage, oppussing og hus
  "Verktøy": "Tools",
  "Byggevarer": "Building materials",
  "Hage": "Garden",
  "Oppvarming": "Heating",
  // Foreldre og barn
  "Barneklær": "Children's clothing",
  "Barnevogn og bilstol": "Strollers and car seats",
  "Leker": "Toys",
  "Barnemøbler": "Children's furniture",
  // Dyr og utstyr ("Hund"/"Katt" are shared with the Dyretype options below)
  "Hest og ridning": "Horses and riding",
  "Smådyr og fugler": "Small pets and birds",
  "Akvarium": "Aquarium",
  // Antikviteter og kunst
  "Kunst": "Art",
  "Antikke møbler": "Antique furniture",
  "Glass og porselen": "Glass and porcelain",
  "Mynter og frimerker": "Coins and stamps",
  // Næringsvirksomhet
  "Kontorutstyr": "Office equipment",
  "Maskiner": "Machines",
  "Butikkinnredning": "Shop fittings",
  // Annet
  "Diverse": "Miscellaneous",
  "Gis bort": "Giving away",
  "Ønskes kjøpt": "Wanted",

  // --- Product categories -------------------------------------------------
  // Electronics
  "Spill": "Games",
  "Spillkonsoller": "Game consoles",
  "Tilbehør": "Accessories",
  "Bærbar PC": "Laptop",
  "Stasjonær PC": "Desktop PC",
  "Nettbrett": "Tablets",
  "Skjermer": "Monitors",
  "Komponenter": "Components",
  "Mobiltelefoner": "Mobile phones",
  "Smartklokker": "Smartwatches",
  "Deksler og tilbehør": "Cases and accessories",
  "Høyttalere": "Speakers",
  "Hodetelefoner": "Headphones",
  "Hjemmekino": "Home cinema",
  "Kameraer": "Cameras",
  "Objektiver": "Lenses",
  "Droner": "Drones",
  "Kjøleskap": "Refrigerators",
  "Vaskemaskin": "Washing machine",
  "Oppvaskmaskin": "Dishwasher",
  "Komfyr": "Stove",
  "Støvsuger": "Vacuum cleaner",
  "Kjøkkenmaskiner": "Kitchen appliances",
  "Kaffemaskiner": "Coffee machines",
  // Furniture
  "Lenestol": "Armchair",
  "Sovesofa": "Sofa bed",
  "Spisebord": "Dining table",
  "Salongbord": "Coffee table",
  "Stoler": "Chairs",
  "Skrivebord": "Desk",
  "Hyller": "Shelves",
  "Skap": "Cabinets",
  "Kommode": "Chest of drawers",
  "Senger": "Beds",
  "Madrasser": "Mattresses",
  "Sengetøy": "Bedding",
  // Clothing and shoes
  "Overdeler": "Tops",
  "Bukser": "Pants",
  "Kjoler": "Dresses",
  "Jakker": "Jackets",
  "Dresser": "Suits",
  "Damesko": "Women's shoes",
  "Herresko": "Men's shoes",
  "Barnesko": "Children's shoes",
  // Sports
  "Sykler": "Bicycles",
  "Sykkeldeler": "Bicycle parts",
  "Sykkeltilbehør": "Bicycle accessories",
  "Alpint": "Alpine skiing",
  "Langrenn": "Cross-country skiing",
  "Skøyter": "Skates",
  "Vekter": "Weights",
  "Treningsapparater": "Exercise machines",
  "Telt": "Tents",
  "Soveposer": "Sleeping bags",
  "Sekker": "Backpacks",
  // Vehicles
  "Dekk og felger": "Tires and rims",
  "Motordeler": "Engine parts",
  "Interiør": "Interior",
  "Eksteriør": "Exterior",
  "Takstativ": "Roof racks",
  "Barneseter": "Child seats",
  "Elektronikk": "Electronics",
  "Motorer": "Engines",
  "Navigasjon": "Navigation",
  "Sikkerhet": "Safety",
  "Hjelmer": "Helmets",
  "Kjøredress": "Riding suits",
  "Deler": "Parts",
  // Leisure
  "Gitar": "Guitar",
  "Piano og keyboard": "Piano and keyboard",
  "Trommer": "Drums",
  "Blåseinstrumenter": "Wind instruments",
  "Filmer": "Movies",
  // Garden and home
  "Elektroverktøy": "Power tools",
  "Håndverktøy": "Hand tools",
  "Måleverktøy": "Measuring tools",
  "Trelast": "Timber",
  "Isolasjon": "Insulation",
  "Maling": "Paint",
  "Hagemøbler": "Garden furniture",
  "Gressklipper": "Lawn mowers",
  "Planter": "Plants",
  "Peis og ovn": "Fireplaces and stoves",
  "Varmepumpe": "Heat pump",
  // Kids
  "0-2 år": "0-2 years",
  "2-6 år": "2-6 years",
  "6-12 år": "6-12 years",
  "Barnevogner": "Strollers",
  "Bilstoler": "Car seats",
  "Bæreseler": "Baby carriers",
  "Byggeleker": "Building toys",
  "Utendørsleker": "Outdoor toys",
  "Kosedyr": "Stuffed animals",
  // Pets
  "Utstyr": "Equipment",
  "Fôr": "Food",
  "Bur og senger": "Cages and beds",
  "Klorestativ": "Scratching posts",
  // Art
  "Malerier": "Paintings",
  "Grafikk": "Prints",
  "Skulptur": "Sculpture",
  // Other
  "Ukategorisert": "Uncategorized",

  // --- Attribute labels ---------------------------------------------------
  "Farge": "Color",
  "Materiale": "Material",
  "Plattform": "Platform",
  "Merke": "Brand",
  "Størrelse": "Size",
  "Størrelse (cm)": "Size (cm)",
  "Skostørrelse": "Shoe size",
  "Type sykkel": "Bicycle type",
  "Drivstoff": "Fuel",
  "Dyretype": "Animal type",
  "Epoke": "Era",
  "Tilstand": "Condition",

  // --- Colors -------------------------------------------------------------
  "Svart": "Black",
  "Hvit": "White",
  "Grå": "Gray",
  "Brun": "Brown",
  "Blå": "Blue",
  "Grønn": "Green",
  "Rød": "Red",
  "Gul": "Yellow",
  "Rosa": "Pink",
  "Lilla": "Purple",
  "Flerfarget": "Multicolored",

  // --- Materials ----------------------------------------------------------
  "Tre": "Wood",
  "Metall": "Metal",
  "Plast": "Plastic",
  "Stoff": "Fabric",
  "Skinn": "Leather",
  "Kunstskinn": "Faux leather",
  "Rotting": "Rattan",
  "Marmor": "Marble",

  // --- Bike types ---------------------------------------------------------
  "Terrengsykkel": "Mountain bike",
  "Landeveissykkel": "Road bike",
  "Hybridsykkel": "Hybrid bike",
  "Elsykkel": "Electric bike",
  "Barnesykkel": "Children's bike",

  // --- Fuel types ---------------------------------------------------------
  "Bensin": "Petrol",
  "Elektrisk": "Electric",

  // --- Animal types (also cover the "Hund"/"Katt" subcategories) ----------
  "Hund": "Dog",
  "Katt": "Cat",
  "Hest": "Horse",
  "Kanin": "Rabbit",
  "Gnager": "Rodent",
  "Fugl": "Bird",
  "Fisk": "Fish",
  "Krypdyr": "Reptile",

  // --- Eras ---------------------------------------------------------------
  "Før 1900": "Before 1900",
  "Etter 2000": "After 2000",
  "Ukjent": "Unknown",

  // --- Conditions (stored-value labels from the listing forms) ------------
  "Ny": "New",
  "Som ny": "Like new",
  "God": "Good",
  "Brukbar": "Fair",

  // --- Shared across contexts ---------------------------------------------
  // "Annet" is a main category, several subcategories/products, and the
  // catch-all option of nearly every attribute — "Other" fits all uses.
  "Annet": "Other",
};
