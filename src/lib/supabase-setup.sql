-- SQL commands to set up the database schema
-- Run these in your Supabase SQL editor

-- Create tables table
CREATE TABLE IF NOT EXISTS tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('available', 'occupied', 'reserved')) DEFAULT 'available',
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    customer_name TEXT,
    status TEXT CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price_per_item DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample tables
INSERT INTO tables (table_number, qr_code) VALUES
(1, 'table-1'), (2, 'table-2'), (3, 'table-3'), (4, 'table-4'), (5, 'table-5'),
(6, 'table-6'), (7, 'table-7'), (8, 'table-8'), (9, 'table-9'), (10, 'table-10'),
(11, 'table-11'), (12, 'table-12'), (13, 'table-13'), (14, 'table-14'), (15, 'table-15'),
(16, 'table-16'), (17, 'table-17'), (18, 'table-18'), (19, 'table-19'), (20, 'table-20')
ON CONFLICT (table_number) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, is_vegetarian, image_url) VALUES
('Signature Gourmet Burger', 'Juicy beef patty with aged cheddar, caramelized onions, crispy bacon, and our special sauce on a brioche bun', 18.99, 'Main Course', false, '/assets/food-burger.jpg'),
('Fresh Caesar Salad', 'Crisp romaine lettuce with grilled chicken, parmesan cheese, croutons, and house-made Caesar dressing', 14.99, 'Salads', false, '/assets/food-salad.jpg'),
('Chocolate Decadence', 'Rich dark chocolate mousse with fresh berries, whipped cream, and a delicate chocolate tuile', 12.99, 'Desserts', true, '/assets/food-dessert.jpg'),
('Margherita Pizza', 'Classic pizza with fresh mozzarella, tomato sauce, and basil', 16.99, 'Main Course', true, null),
('Grilled Salmon', 'Atlantic salmon with lemon herb seasoning, served with roasted vegetables', 24.99, 'Main Course', false, null),
('Greek Salad', 'Mixed greens with feta cheese, olives, tomatoes, and olive oil dressing', 13.99, 'Salads', true, null),
('Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 9.99, 'Desserts', true, null),
('Espresso', 'Rich, full-bodied coffee shot', 3.99, 'Beverages', true, null),
('Fresh Orange Juice', 'Freshly squeezed orange juice', 5.99, 'Beverages', true, null),
('Craft Beer', 'Local craft beer selection', 7.99, 'Beverages', true, null)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on tables" ON tables FOR ALL USING (true);
CREATE POLICY "Allow all operations on menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on order_items" ON order_items FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();