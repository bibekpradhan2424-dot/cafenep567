-- =============================================
-- CAFÉ SUPABASE SETUP SCRIPT
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'Drinks',
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  customer_email TEXT,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES menu_items(id),
  item_name TEXT,
  item_price NUMERIC(10,2),
  quantity INTEGER NOT NULL DEFAULT 1
);

-- 4. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT,
  location TEXT,
  image_url TEXT,
  capacity INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RSVPs
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_email)
);

-- 6. GALLERY
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ: menu_items, events, gallery
CREATE POLICY "Public can read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can read gallery" ON gallery FOR SELECT USING (true);

-- PUBLIC INSERT: rsvps, orders, order_items
CREATE POLICY "Public can create rsvps" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read rsvps" ON rsvps FOR SELECT USING (true);
CREATE POLICY "Public can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create order_items" ON order_items FOR INSERT WITH CHECK (true);

-- ADMIN FULL ACCESS (authenticated users)
CREATE POLICY "Admin full access menu_items" ON menu_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access order_items" ON order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access events" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access rsvps" ON rsvps FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access gallery" ON gallery FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO menu_items (name, description, price, category, available) VALUES
  ('Signature Espresso', 'Double shot of our house-roasted blend with notes of dark chocolate and caramel', 3.50, 'Coffee', true),
  ('Vanilla Latte', 'Smooth espresso with steamed milk and house-made vanilla syrup', 5.00, 'Coffee', true),
  ('Cold Brew', 'Steeped 18 hours, served over ice with a hint of sweetness', 4.75, 'Coffee', true),
  ('Matcha Latte', 'Ceremonial grade matcha whisked with oat milk', 5.50, 'Tea', true),
  ('Chai Spice', 'House-blend spices, black tea, and steamed milk', 4.50, 'Tea', true),
  ('Avocado Toast', 'Sourdough, smashed avocado, cherry tomatoes, chili flakes', 9.00, 'Food', true),
  ('Butter Croissant', 'Freshly baked daily, golden and flaky', 3.75, 'Pastries', true),
  ('Blueberry Muffin', 'House-made with fresh blueberries and lemon zest', 3.50, 'Pastries', true),
  ('Granola Bowl', 'House granola, Greek yogurt, seasonal fruits, honey drizzle', 8.50, 'Food', true),
  ('Flat White', 'Ristretto shots with micro-foam whole milk', 4.50, 'Coffee', true);

INSERT INTO events (title, date, description, location, capacity) VALUES
  ('Morning Brew & Jazz', NOW() + INTERVAL '7 days', 'Start your weekend with live jazz and our finest pour-overs. Local artists perform from 9am to noon.', 'Main Floor', 40),
  ('Latte Art Workshop', NOW() + INTERVAL '14 days', 'Learn the basics of latte art from our head barista. All skill levels welcome. Includes 2 drinks.', 'Workshop Room', 12),
  ('Book Club Sunday', NOW() + INTERVAL '21 days', 'Monthly book club gathering. This month: "The Midnight Library". Coffee and conversation included.', 'Reading Nook', 20),
  ('Open Mic Night', NOW() + INTERVAL '5 days', 'Share your poetry, music, or stories. Sign up at the counter. Doors open at 7pm.', 'Main Floor', 60);

INSERT INTO gallery (image_url, caption) VALUES
  ('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', 'Morning light through our windows'),
  ('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600', 'The perfect pour'),
  ('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600', 'Our cozy corner'),
  ('https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600', 'Fresh pastries daily'),
  ('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', 'Latte art in progress'),
  ('https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600', 'Weekend vibes');
