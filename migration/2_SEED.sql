-- ============================================================================
--  STARTER SEED DATA  (OPTIONAL)
--  Paste into Supabase -> SQL Editor -> Run, AFTER running 1_SCHEMA.sql.
--
--  This gives your fresh database enough to work immediately. You can then
--  edit/add everything else from the website's Admin (Commander) panel.
--  Uses "on conflict do nothing" so re-running won't create duplicates.
-- ============================================================================

-- Admin login (Commander panel).  ID: command   Passcode: mavala2025
-- CHANGE THIS PASSCODE from the Admin -> Security panel after first login!
insert into admin_config (admin_id, passcode)
select 'command', 'mavala2025'
where not exists (select 1 from admin_config);

-- Business / contact details
insert into business_settings (phone, emergency_phone, email, whatsapp, address_en, address_mr, map_embed, next_departure, instagram)
select
  '+91 80109 86946', '+91 91234 56789', 'command@trekkiemavala.in', '918010986946',
  'Base Camp HQ, Malshej Ghat Road, Junnar, Pune District, Maharashtra 410502',
  'बेस कॅम्प मुख्यालय, माळशेज घाट रस्ता, जुन्नर, पुणे जिल्हा, महाराष्ट्र ४१०५०२',
  'https://www.openstreetmap.org/export/embed.html?bbox=73.7%2C19.3%2C73.85%2C19.4&layer=mapnik&marker=19.35,73.77',
  '2025-08-15T05:30:00', '@trekkie_mavala'
where not exists (select 1 from business_settings);

-- A couple of starter treks
insert into treks (name_en, name_mr, fort, grade, duration, altitude, price, date, seats, description_en, description_mr, image, category)
select 'Rajgad Fort Night Expedition', 'राजगड किल्ला रात्र मोहीम', 'Rajgad', 'Moderate', '1 Day / 1 Night', '1376 m', 1799, '2025-08-22', 20,
  'The former capital of Shivaji Maharaj''s Swarajya. Trek under a canopy of stars.',
  'शिवाजी महाराजांच्या स्वराज्याची पूर्वीची राजधानी. ताऱ्यांच्या छताखाली ट्रेक करा.',
  'https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=800', 'Forts'
where not exists (select 1 from treks);

insert into treks (name_en, name_mr, fort, grade, duration, altitude, price, date, seats, description_en, description_mr, image, category)
select 'Kalsubai Summit — Everest of Sahyadri', 'कळसूबाई शिखर', 'Kalsubai', 'Moderate', '1 Day', '1646 m', 1499, '2025-08-30', 18,
  'Conquer the highest peak in Maharashtra with 360-degree ridge views.',
  'महाराष्ट्रातील सर्वोच्च शिखर सर करा.',
  'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=800', 'Forts'
where (select count(*) from treks) < 2;

-- Starter FAQ
insert into faqs (category, question_en, question_mr, answer_en, answer_mr)
select 'Bookings', 'How do I secure a seat?', 'मी जागा कशी राखू?',
  'Book through the website and pay online. A confirmation is sent instantly.',
  'वेबसाइटद्वारे बुक करा आणि ऑनलाइन पैसे भरा.'
where not exists (select 1 from faqs);

-- Starter review
insert into hiker_reviews (name, rating, text_en, text_mr, trek, pinned, approved)
select 'Aditya Deshmukh', 5,
  'The night trek was life-changing. True Mavala spirit!',
  'रात्र ट्रेक आयुष्य बदलणारा होता. खरा मावळा आत्मा!',
  'Rajgad', true, true
where not exists (select 1 from hiker_reviews);

-- Hero background + brand defaults (editable from Admin -> Site Customizer)
insert into site_content (content_key, value_en, value_mr, content_type)
select * from (values
  ('hero_media_type', 'video', 'video', 'config'),
  ('hero_media_url', '/videos/hero.mp4', '/videos/hero.mp4', 'media'),
  ('brand_name', 'TREKKIE', 'TREKKIE', 'text'),
  ('brand_name_accent', 'मावळा', 'मावळा', 'text'),
  ('brand_tagline', 'Sahyadri Expedition Desk', 'सह्याद्री मोहीम कक्ष', 'text'),
  ('parent_company', 'Mavala Adventure Guild Pvt. Ltd.', 'मावळा अ‍ॅडव्हेंचर गिल्ड प्रा. लि.', 'text')
) as v(content_key, value_en, value_mr, content_type)
where not exists (select 1 from site_content);

-- DONE. Next: run 3_RLS.sql to secure the tables.
