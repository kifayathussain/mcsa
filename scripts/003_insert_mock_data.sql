-- Insert mock data for testing and demonstration

-- Note: user_id will be automatically set by RLS policies based on authenticated user
-- For this mock data, we'll use a placeholder UUID that should be replaced with actual user IDs

-- Insert mock channels
INSERT INTO channels (name, type, api_key, api_secret, access_token, marketplace_id, is_active) VALUES
('Amazon US Store', 'amazon', 'AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 'Atza|IwEBIP...', 'ATVPDKIKX0DER', true),
('eBay Main Store', 'ebay', 'YourAppI-YourApp-PRD-1234567890', 'PRD-1234567890-abcd-efgh', 'v^1.1#i^1#...', NULL, true),
('Etsy Handmade Shop', 'etsy', 'abcdefghijklmnop', NULL, 'qrstuvwxyz123456', NULL, true),
('Shopify Store', 'shopify', 'shpat_abcdef1234567890', NULL, NULL, 'mystore.myshopify.com', true);

-- Insert mock products
INSERT INTO products (sku, title, description, price, cost, category, brand, weight, dimensions, is_active) VALUES
('TECH-LAP-001', 'Premium Wireless Mouse', 'Ergonomic wireless mouse with precision tracking and long battery life', 29.99, 12.50, 'Electronics', 'TechPro', 0.25, '{"length": 4.5, "width": 2.8, "height": 1.5}', true),
('TECH-KEY-002', 'Mechanical Gaming Keyboard', 'RGB backlit mechanical keyboard with blue switches', 89.99, 45.00, 'Electronics', 'TechPro', 2.5, '{"length": 17, "width": 5, "height": 1.5}', true),
('HOME-MUG-001', 'Ceramic Coffee Mug Set', 'Set of 4 handcrafted ceramic mugs with unique designs', 34.99, 15.00, 'Home & Kitchen', 'HomeStyle', 3.0, '{"length": 8, "width": 8, "height": 10}', true),
('FASH-TEE-001', 'Organic Cotton T-Shirt', 'Comfortable organic cotton t-shirt available in multiple colors', 24.99, 8.00, 'Clothing', 'EcoWear', 0.4, '{"length": 12, "width": 10, "height": 1}', true),
('BOOK-FIC-001', 'The Digital Nomad Guide', 'Complete guide to working remotely while traveling the world', 19.99, 5.00, 'Books', 'Wanderlust Press', 1.2, '{"length": 9, "width": 6, "height": 1}', true),
('TECH-CAB-003', 'USB-C Cable 3-Pack', 'Durable braided USB-C cables, 6ft length', 15.99, 4.50, 'Electronics', 'TechPro', 0.3, '{"length": 6, "width": 4, "height": 1}', true),
('HOME-CAN-002', 'Scented Soy Candle', 'Hand-poured soy candle with lavender scent, 8oz', 12.99, 4.00, 'Home & Kitchen', 'HomeStyle', 0.8, '{"length": 3, "width": 3, "height": 4}', true),
('FASH-HAT-002', 'Wool Beanie Hat', 'Warm wool beanie perfect for winter', 18.99, 6.00, 'Clothing', 'EcoWear', 0.2, '{"length": 8, "width": 8, "height": 3}', true);

-- Insert product listings (products listed on different channels)
INSERT INTO product_listings (product_id, channel_id, external_id, external_sku, price, quantity, status)
SELECT 
    p.id,
    c.id,
    'ASIN-' || substr(md5(random()::text), 1, 10),
    p.sku || '-' || c.type,
    p.price * (1 + (random() * 0.2 - 0.1)), -- Price varies slightly by channel
    floor(random() * 50 + 10)::int,
    CASE WHEN random() > 0.1 THEN 'active' ELSE 'inactive' END
FROM products p
CROSS JOIN channels c
WHERE random() > 0.3; -- Not all products on all channels

-- Insert inventory for all products
INSERT INTO inventory (product_id, quantity_available, quantity_reserved, reorder_point, reorder_quantity)
SELECT 
    id,
    floor(random() * 100 + 20)::int,
    floor(random() * 10)::int,
    floor(random() * 20 + 5)::int,
    floor(random() * 50 + 20)::int
FROM products;

-- Insert mock orders (last 90 days)
INSERT INTO orders (channel_id, external_order_id, order_date, status, customer_name, customer_email, shipping_address, total_amount, tax_amount, shipping_amount, tracking_number)
SELECT 
    c.id,
    c.type || '-' || substr(md5(random()::text), 1, 12),
    NOW() - (random() * interval '90 days'),
    CASE floor(random() * 10)
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'processing'
        WHEN 2, 3 THEN 'shipped'
        ELSE 'delivered'
    END,
    (ARRAY['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Anderson', 'James Taylor', 'Jennifer Martinez', 'Robert Garcia', 'Mary Rodriguez'])[floor(random() * 10 + 1)],
    (ARRAY['john.smith', 'sarah.j', 'michael.b', 'emily.d', 'david.w', 'lisa.a', 'james.t', 'jennifer.m', 'robert.g', 'mary.r'])[floor(random() * 10 + 1)] || '@example.com',
    jsonb_build_object(
        'street', (floor(random() * 9999 + 1))::text || ' Main St',
        'city', (ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'])[floor(random() * 10 + 1)],
        'state', (ARRAY['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'])[floor(random() * 10 + 1)],
        'zip', (floor(random() * 90000 + 10000))::text,
        'country', 'USA'
    ),
    0, -- Will be calculated from order items
    0, -- Will be calculated
    0, -- Will be calculated
    CASE WHEN random() > 0.3 THEN '1Z999AA1' || floor(random() * 1000000000)::text ELSE NULL END
FROM channels c
CROSS JOIN generate_series(1, 15) -- 15 orders per channel
WHERE c.is_active = true;

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    floor(random() * 3 + 1)::int,
    p.price,
    p.price * floor(random() * 3 + 1)::int
FROM orders o
CROSS JOIN LATERAL (
    SELECT id, price 
    FROM products 
    WHERE random() > 0.5 
    LIMIT floor(random() * 3 + 1)::int
) p;

-- Update order totals based on order items
UPDATE orders o
SET 
    total_amount = COALESCE(oi.total, 0) + COALESCE(oi.total * 0.08, 0) + 
        CASE 
            WHEN COALESCE(oi.total, 0) > 50 THEN 0 
            ELSE 8.99 
        END,
    tax_amount = COALESCE(oi.total * 0.08, 0),
    shipping_amount = CASE 
        WHEN COALESCE(oi.total, 0) > 50 THEN 0 
        ELSE 8.99 
    END
FROM (
    SELECT order_id, SUM(total_price) as total
    FROM order_items
    GROUP BY order_id
) oi
WHERE o.id = oi.order_id;

-- Update inventory reserved quantities based on pending/processing orders
UPDATE inventory inv
SET quantity_reserved = COALESCE(oi.reserved, 0)
FROM (
    SELECT 
        oi.product_id,
        SUM(oi.quantity) as reserved
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('pending', 'processing')
    GROUP BY oi.product_id
) oi
WHERE inv.product_id = oi.product_id;
