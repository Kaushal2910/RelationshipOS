-- RelationshipOS — P0 seed: 5 real date spots in Pune.
-- Run AFTER 0001_places.sql, in the Supabase SQL Editor.
-- cover_url uses stable Unsplash URLs so images render without Storage (P0).
-- Re-runnable: clears prior manual seed first.

delete from places where source = 'manual' and city = 'Pune';

insert into places (name, category, description, city, area, price_level, avg_cost_inr, rating, moods, tags, cover_url) values
  ('Vohuman Cafe', 'cafe',
   'Iconic Irani cafe famous for cheese omelettes and bun maska — cosy, nostalgic, unpretentious.',
   'Pune', 'Camp', 1, 300, 4.5,
   '{chill,budget,foodie}', '{"breakfast","irani","classic"}',
   'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80'),

  ('Malaka Spice', 'restaurant',
   'Lush garden seating and pan-Asian plates — a long-standing romantic dinner favourite.',
   'Pune', 'Koregaon Park', 3, 1800, 4.6,
   '{romantic,foodie,outdoor}', '{"asian","dinner","garden"}',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'),

  ('The Flour Works', 'cafe',
   'Airy all-day European cafe with great coffee and a slow, sunlit weekend-brunch vibe.',
   'Pune', 'Kalyani Nagar', 2, 900, 4.4,
   '{chill,romantic,indoor}', '{"brunch","coffee","european"}',
   'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'),

  ('Sinhagad Fort', 'attraction',
   'Sunrise trek and misty ramparts with valley views — pithla-bhakri and hot chai at the top.',
   'Pune', 'Sinhagad', 1, 200, 4.7,
   '{adventure,nature,outdoor}', '{"trek","fort","sunrise"}',
   'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80'),

  ('Shisha Jazz Cafe', 'live_music',
   'Leafy courtyard with live acoustic sets most evenings — mellow, candle-lit, made for two.',
   'Pune', 'Koregaon Park', 3, 1500, 4.3,
   '{romantic,nightlife,chill}', '{"live-music","evening","courtyard"}',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80');
