-- ============================================================================
--  Seed data — restaurants, categories, food items, offers
--  Users (customer + owner) are inserted by seed.js with hashed passwords.
--  This file is executed by `npm run seed` after the users are created.
-- ============================================================================

-- Restaurants ---------------------------------------------------------------
INSERT INTO restaurants (id, name, description, cuisine, image_url, rating, delivery_time, price_for_two, address, is_open, offer_text) VALUES
(1, 'Spice Junction', 'Authentic North Indian curries, biryanis and tandoor.', 'North Indian, Biryani',
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 4.5, '25-35 min', 400, 'MG Road, Bengaluru', true, '50% OFF up to ₹100'),
(2, 'Pizza Republic', 'Wood-fired pizzas, pastas and garlic bread.', 'Italian, Pizza',
 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', 4.3, '30-40 min', 500, 'Indiranagar, Bengaluru', true, 'Free delivery'),
(3, 'Sushi & Co', 'Fresh sushi, ramen and Japanese bowls.', 'Japanese, Sushi',
 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80', 4.6, '35-45 min', 700, 'Koramangala, Bengaluru', true, '20% OFF'),
(4, 'Burger Barn', 'Juicy burgers, loaded fries and shakes.', 'American, Burgers',
 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 4.2, '20-30 min', 350, 'HSR Layout, Bengaluru', true, 'Buy 1 Get 1'),
(5, 'Green Bowl', 'Healthy salads, wraps and smoothies.', 'Healthy, Salads',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', 4.4, '25-35 min', 450, 'Whitefield, Bengaluru', true, NULL),
(6, 'Dragon Wok', 'Chinese and pan-Asian favourites.', 'Chinese, Asian',
 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80', 4.1, '30-40 min', 400, 'Jayanagar, Bengaluru', true, '15% OFF above ₹299');
SELECT setval('restaurants_id_seq', (SELECT MAX(id) FROM restaurants));

-- Categories ----------------------------------------------------------------
INSERT INTO categories (id, restaurant_id, name) VALUES
(1, 1, 'Starters'), (2, 1, 'Main Course'), (3, 1, 'Breads'),
(4, 2, 'Pizzas'), (5, 2, 'Pastas'),
(6, 3, 'Sushi'), (7, 3, 'Ramen'),
(8, 4, 'Burgers'), (9, 4, 'Sides'),
(10, 5, 'Salads'), (11, 5, 'Smoothies'),
(12, 6, 'Noodles'), (13, 6, 'Starters');
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- Food items ----------------------------------------------------------------
INSERT INTO food_items (restaurant_id, category_id, name, description, price, image_url, is_veg) VALUES
-- Spice Junction
(1, 1, 'Paneer Tikka', 'Char-grilled cottage cheese with spices', 220, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', true),
(1, 1, 'Chicken 65', 'Spicy deep-fried chicken', 260, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80', false),
(1, 2, 'Butter Chicken', 'Creamy tomato chicken curry', 340, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', false),
(1, 2, 'Paneer Butter Masala', 'Rich makhani gravy', 300, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', true),
(1, 2, 'Chicken Biryani', 'Fragrant basmati with chicken', 320, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80', false),
(1, 3, 'Butter Naan', 'Soft tandoor bread', 60, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', true),
-- Pizza Republic
(2, 4, 'Margherita Pizza', 'Classic tomato & mozzarella', 280, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80', true),
(2, 4, 'Pepperoni Pizza', 'Loaded pepperoni & cheese', 380, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80', false),
(2, 4, 'Veggie Supreme', 'Peppers, olives, onions, corn', 340, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', true),
(2, 5, 'Alfredo Pasta', 'Creamy white sauce pasta', 300, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80', true),
-- Sushi & Co
(3, 6, 'Salmon Nigiri (6 pc)', 'Fresh salmon over rice', 480, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80', false),
(3, 6, 'California Roll (8 pc)', 'Crab, avocado, cucumber', 420, 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80', false),
(3, 7, 'Shoyu Ramen', 'Soy-based broth with noodles', 380, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80', false),
-- Burger Barn
(4, 8, 'Classic Cheeseburger', 'Beef patty, cheddar, lettuce', 240, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', false),
(4, 8, 'Veg Zinger Burger', 'Crispy veg patty & mayo', 200, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=80', true),
(4, 9, 'Loaded Fries', 'Fries with cheese & jalapenos', 160, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80', true),
-- Green Bowl
(5, 10, 'Caesar Salad', 'Romaine, croutons, parmesan', 260, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80', true),
(5, 10, 'Quinoa Power Bowl', 'Quinoa, veggies, hummus', 300, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', true),
(5, 11, 'Berry Smoothie', 'Mixed berries & yogurt', 180, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&q=80', true),
-- Dragon Wok
(6, 12, 'Hakka Noodles', 'Stir-fried veg noodles', 220, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', true),
(6, 12, 'Chicken Chow Mein', 'Noodles with chicken', 260, 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&q=80', false),
(6, 13, 'Veg Manchurian', 'Fried veg balls in sauce', 240, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&q=80', true);

-- Coupons ---------------------------------------------------------------
INSERT INTO coupons (code, description, discount_type, discount_value, min_order, max_discount, is_active) VALUES
('WELCOME50', 'Flat ₹50 off on your first order', 'flat', 50, 200, NULL, true),
('SAVE10', '10% off, up to ₹100', 'percent', 10, 300, 100, true),
('FOODIE20', '20% off on orders above ₹500', 'percent', 20, 500, 150, true)
ON CONFLICT (code) DO NOTHING;
