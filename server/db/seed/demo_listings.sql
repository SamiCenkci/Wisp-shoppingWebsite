SET client_encoding = 'UTF8';

-- Demo listings for a populated-looking marketplace.
-- Remove later with:
--   UPDATE listings SET deleted_at = NOW()
--   WHERE user_id = (SELECT id FROM users WHERE email = 'demo@wispapp.net');

INSERT INTO users (email, password_hash, name, display_name, city, verified_at)
VALUES (
  'demo@wispapp.net',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Wisp Demo',
  'Wisp Demo',
  'Oslo',
  NOW()
)
ON CONFLICT (email) DO NOTHING;

WITH seller AS (
  SELECT id FROM users WHERE email = 'demo@wispapp.net'
),
new_listings AS (
  INSERT INTO listings (
    user_id, title, description, price_ore, category, condition,
    county, municipality, postal_code, street_address, latitude, longitude,
    ad_type, sub_category, product_category, attributes, status
  )
  SELECT
    seller.id, v.title, v.description, v.price_ore, v.category, v.condition,
    v.county, v.municipality, v.postal_code, v.street_address, v.lat, v.lon,
    v.ad_type, v.sub_category, v.product_category, v.attributes::jsonb, 'active'
  FROM seller, (VALUES
    ('MacBook Air M2 13" 256GB',
     'Selger min MacBook Air M2 fra 2023. Brukt til studier, ingen riper eller bulker. Batterihelse 94%. Lader følger med.',
     899900, 'Elektronikk og hvitevarer', 'like_new',
     'Oslo', 'Oslo', '0150', 'Karl Johans gate 1', 59.9127, 10.7461,
     'sale', 'Data', 'Bærbar PC', '{"merke":"Apple"}'),

    ('PlayStation 5 med to kontroller',
     'PS5 disc-utgave, kjøpt i fjor. Følger med to DualSense-kontroller og fire spill. Alt fungerer perfekt.',
     599900, 'Elektronikk og hvitevarer', 'good',
     'Vestland', 'Bergen', '5003', 'Torgallmenningen 8', 60.3925, 5.3242,
     'sale', 'Spill og konsoll', 'Spillkonsoller', '{"plattform":"PlayStation 5","merke":"Sony"}'),

    ('Elden Ring til PS5',
     'Ferdigspilt, plata er i god stand. Kan sendes eller hentes.',
     29900, 'Elektronikk og hvitevarer', 'good',
     'Oslo', 'Oslo', '0560', 'Markveien 35', 59.9231, 10.7579,
     'sale', 'Spill og konsoll', 'Spill', '{"plattform":"PlayStation 5"}'),

    ('iPhone 13 128GB, blå',
     'God stand, skjermbeskytter har vært på fra dag én. Batterihelse 88%. Deksel og kabel følger med.',
     449900, 'Elektronikk og hvitevarer', 'good',
     'Trøndelag', 'Trondheim', '7010', 'Nordre gate 11', 63.4305, 10.3951,
     'sale', 'Telefoner og tilbehør', 'Mobiltelefoner', '{"merke":"Apple","farge":"Blå"}'),

    ('IKEA Ektorp 3-seter sofa',
     'Lys grå Ektorp med vaskbart trekk. Noen brukstegn på armlenene, ellers fin. Hentes selv.',
     129900, 'Møbler og interiør', 'good',
     'Oslo', 'Oslo', '0655', 'Ensjøveien 20', 59.9186, 10.7885,
     'sale', 'Sofa og lenestol', 'Sofa', '{"merke":"IKEA","materiale":"Stoff","farge":"Grå"}'),

    ('Spisebord i eik, 180 cm',
     'Massivt eikebord med plass til seks. Noen merker etter bruk, men solid. Stoler selges ikke.',
     249900, 'Møbler og interiør', 'good',
     'Rogaland', 'Stavanger', '4006', 'Øvre Holmegate 12', 58.9700, 5.7331,
     'sale', 'Bord og stoler', 'Spisebord', '{"materiale":"Tre","farge":"Brun"}'),

    ('Skrivebord med hev/senk',
     'Elektrisk hev/senk-pult, 140x70 cm. Fungerer som den skal. Selges fordi jeg har flyttet.',
     179900, 'Møbler og interiør', 'like_new',
     'Oslo', 'Oslo', '0182', 'Thorvald Meyers gate 60', 59.9247, 10.7594,
     'sale', 'Bord og stoler', 'Skrivebord', '{"merke":"IKEA","farge":"Hvit"}'),

    ('Trek Marlin 7 terrengsykkel',
     'Størrelse M, 2022-modell. Nylig service, nye bremseklosser. Passer 170-180 cm.',
     549900, 'Sport og friluftsliv', 'good',
     'Viken', 'Drammen', '3015', 'Bragernes torg 4', 59.7440, 10.2045,
     'sale', 'Sykkel', 'Sykler', '{"sykkeltype":"Terrengsykkel","merke":"Trek","farge":"Blå"}'),

    ('Bergans turjakke, str L',
     'Vanntett skalljakke i god stand. Brukt på noen turer, ingen skader.',
     89900, 'Sport og friluftsliv', 'good',
     'Innlandet', 'Lillehammer', '2609', 'Storgata 80', 61.1153, 10.4662,
     'sale', 'Camping og friluft', 'Sekker', '{"merke":"Bergans"}'),

    ('Alpinski Atomic 170 cm med binding',
     'Brukt to sesonger. Sålen er i fin stand, kanter nyslipt.',
     199900, 'Sport og friluftsliv', 'good',
     'Innlandet', 'Hamar', '2317', 'Torggata 22', 60.7945, 11.0680,
     'sale', 'Ski og vintersport', 'Alpint', '{"merke":"Atomic"}'),

    ('Fender Stratocaster, mexicansk',
     'Player Series fra 2019. Spilles lite de siste årene. Myk koffert følger med.',
     799900, 'Fritid, hobby og underholdning', 'good',
     'Oslo', 'Oslo', '0271', 'Bygdøy allé 30', 59.9163, 10.7096,
     'sale', 'Musikkinstrumenter', 'Gitar', '{"merke":"Fender","farge":"Rød"}'),

    ('Bosch slagbormaskin 18V',
     'To batterier og lader inkludert. Brukt på ett oppussingsprosjekt.',
     149900, 'Hage, oppussing og hus', 'like_new',
     'Vestfold og Telemark', 'Tønsberg', '3110', 'Storgaten 17', 59.2674, 10.4076,
     'sale', 'Verktøy', 'Elektroverktøy', '{"merke":"Bosch"}'),

    ('Stokke Tripp Trapp barnestol',
     'Klassisk Tripp Trapp i bøk. Litt slitasje, men helt hel. Baby set følger ikke med.',
     129900, 'Foreldre og barn', 'good',
     'Oslo', 'Oslo', '0357', 'Sognsveien 20', 59.9420, 10.7280,
     'sale', 'Barnemøbler', '', '{"merke":"Stokke","materiale":"Tre"}'),

    ('Vinterdekk 205/55 R16, 4 stk',
     'Continental vinterdekk, brukt tre sesonger. Cirka 5 mm mønster igjen.',
     249900, 'Utstyr til bil, båt og MC', 'good',
     'Agder', 'Kristiansand', '4610', 'Markens gate 9', 58.1467, 7.9956,
     'sale', 'Bildeler', 'Dekk og felger', '{}'),

    ('Flyttekasser - gis bort',
     'Cirka 15 kasser i god stand etter flytting. Hentes i Oslo sentrum denne uka.',
     0, 'Annet', 'good',
     'Oslo', 'Oslo', '0159', 'Akersgata 55', 59.9139, 10.7398,
     'giveaway', 'Gis bort', '', '{}'),

    ('Sofabord i glass - gis bort',
     'Fungerer fint, men passer ikke i ny leilighet. Må hentes selv, det er tungt.',
     0, 'Møbler og interiør', 'fair',
     'Oslo', 'Oslo', '0473', 'Sandakerveien 24', 59.9385, 10.7620,
     'giveaway', 'Bord og stoler', 'Salongbord', '{"materiale":"Glass"}')
  ) AS v(title, description, price_ore, category, condition,
         county, municipality, postal_code, street_address, lat, lon,
         ad_type, sub_category, product_category, attributes)
  RETURNING id, title
)
INSERT INTO listing_images (listing_id, url, sort_order)
SELECT
  nl.id,
  'https://picsum.photos/seed/' || replace(lower(left(nl.title, 20)), ' ', '-') || '/800/600',
  0
FROM new_listings nl;