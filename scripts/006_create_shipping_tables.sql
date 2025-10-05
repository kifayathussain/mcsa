-- Create shipping carriers table
CREATE TABLE IF NOT EXISTS shipping_carriers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  api_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping services table
CREATE TABLE IF NOT EXISTS shipping_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID NOT NULL REFERENCES shipping_carriers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  estimated_days INTEGER NOT NULL DEFAULT 1,
  max_weight DECIMAL(10,2) NOT NULL DEFAULT 70.0,
  max_dimensions JSONB NOT NULL DEFAULT '{"length": 108, "width": 108, "height": 108}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping labels table
CREATE TABLE IF NOT EXISTS shipping_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES shipping_carriers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES shipping_services(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) NOT NULL UNIQUE,
  label_url TEXT,
  label_data TEXT,
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'printed', 'shipped', 'delivered', 'exception')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pick lists table
CREATE TABLE IF NOT EXISTS pick_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  order_ids UUID[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create packing slips table
CREATE TABLE IF NOT EXISTS packing_slips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  slip_number VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'packed', 'shipped')),
  packed_by VARCHAR(255),
  packed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_slips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shipping_carriers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_carriers' AND policyname = 'Users can view their own shipping carriers') THEN
    CREATE POLICY "Users can view their own shipping carriers" ON shipping_carriers
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_carriers' AND policyname = 'Users can insert their own shipping carriers') THEN
    CREATE POLICY "Users can insert their own shipping carriers" ON shipping_carriers
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_carriers' AND policyname = 'Users can update their own shipping carriers') THEN
    CREATE POLICY "Users can update their own shipping carriers" ON shipping_carriers
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_carriers' AND policyname = 'Users can delete their own shipping carriers') THEN
    CREATE POLICY "Users can delete their own shipping carriers" ON shipping_carriers
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for shipping_services
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_services' AND policyname = 'Users can view their own shipping services') THEN
    CREATE POLICY "Users can view their own shipping services" ON shipping_services
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM shipping_carriers 
          WHERE shipping_carriers.id = shipping_services.carrier_id 
          AND shipping_carriers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_services' AND policyname = 'Users can insert their own shipping services') THEN
    CREATE POLICY "Users can insert their own shipping services" ON shipping_services
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM shipping_carriers 
          WHERE shipping_carriers.id = shipping_services.carrier_id 
          AND shipping_carriers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_services' AND policyname = 'Users can update their own shipping services') THEN
    CREATE POLICY "Users can update their own shipping services" ON shipping_services
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM shipping_carriers 
          WHERE shipping_carriers.id = shipping_services.carrier_id 
          AND shipping_carriers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_services' AND policyname = 'Users can delete their own shipping services') THEN
    CREATE POLICY "Users can delete their own shipping services" ON shipping_services
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM shipping_carriers 
          WHERE shipping_carriers.id = shipping_services.carrier_id 
          AND shipping_carriers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create RLS policies for shipping_labels
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Users can view their own shipping labels') THEN
    CREATE POLICY "Users can view their own shipping labels" ON shipping_labels
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Users can insert their own shipping labels') THEN
    CREATE POLICY "Users can insert their own shipping labels" ON shipping_labels
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Users can update their own shipping labels') THEN
    CREATE POLICY "Users can update their own shipping labels" ON shipping_labels
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Users can delete their own shipping labels') THEN
    CREATE POLICY "Users can delete their own shipping labels" ON shipping_labels
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for warehouses
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'Users can view their own warehouses') THEN
    CREATE POLICY "Users can view their own warehouses" ON warehouses
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'Users can insert their own warehouses') THEN
    CREATE POLICY "Users can insert their own warehouses" ON warehouses
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'Users can update their own warehouses') THEN
    CREATE POLICY "Users can update their own warehouses" ON warehouses
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'Users can delete their own warehouses') THEN
    CREATE POLICY "Users can delete their own warehouses" ON warehouses
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for pick_lists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pick_lists' AND policyname = 'Users can view their own pick lists') THEN
    CREATE POLICY "Users can view their own pick lists" ON pick_lists
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pick_lists' AND policyname = 'Users can insert their own pick lists') THEN
    CREATE POLICY "Users can insert their own pick lists" ON pick_lists
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pick_lists' AND policyname = 'Users can update their own pick lists') THEN
    CREATE POLICY "Users can update their own pick lists" ON pick_lists
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pick_lists' AND policyname = 'Users can delete their own pick lists') THEN
    CREATE POLICY "Users can delete their own pick lists" ON pick_lists
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for packing_slips
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packing_slips' AND policyname = 'Users can view their own packing slips') THEN
    CREATE POLICY "Users can view their own packing slips" ON packing_slips
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packing_slips' AND policyname = 'Users can insert their own packing slips') THEN
    CREATE POLICY "Users can insert their own packing slips" ON packing_slips
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packing_slips' AND policyname = 'Users can update their own packing slips') THEN
    CREATE POLICY "Users can update their own packing slips" ON packing_slips
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packing_slips' AND policyname = 'Users can delete their own packing slips') THEN
    CREATE POLICY "Users can delete their own packing slips" ON packing_slips
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_user_id ON shipping_carriers(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_code ON shipping_carriers(code);
CREATE INDEX IF NOT EXISTS idx_shipping_services_carrier_id ON shipping_services(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_user_id ON shipping_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_order_id ON shipping_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_tracking_number ON shipping_labels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_status ON shipping_labels(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_user_id ON warehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_pick_lists_user_id ON pick_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_pick_lists_warehouse_id ON pick_lists(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pick_lists_status ON pick_lists(status);
CREATE INDEX IF NOT EXISTS idx_packing_slips_user_id ON packing_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_packing_slips_order_id ON packing_slips(order_id);
CREATE INDEX IF NOT EXISTS idx_packing_slips_warehouse_id ON packing_slips(warehouse_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shipping_carriers_updated_at') THEN
    CREATE TRIGGER update_shipping_carriers_updated_at
      BEFORE UPDATE ON shipping_carriers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shipping_services_updated_at') THEN
    CREATE TRIGGER update_shipping_services_updated_at
      BEFORE UPDATE ON shipping_services
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shipping_labels_updated_at') THEN
    CREATE TRIGGER update_shipping_labels_updated_at
      BEFORE UPDATE ON shipping_labels
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouses_updated_at') THEN
    CREATE TRIGGER update_warehouses_updated_at
      BEFORE UPDATE ON warehouses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pick_lists_updated_at') THEN
    CREATE TRIGGER update_pick_lists_updated_at
      BEFORE UPDATE ON pick_lists
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_packing_slips_updated_at') THEN
    CREATE TRIGGER update_packing_slips_updated_at
      BEFORE UPDATE ON packing_slips
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default shipping carriers
INSERT INTO shipping_carriers (user_id, name, code, api_config) VALUES
  (
    (SELECT id FROM auth.users LIMIT 1),
    'USPS',
    'usps',
    '{"testMode": true, "apiKey": "test-key"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'UPS',
    'ups',
    '{"testMode": true, "apiKey": "test-key", "apiSecret": "test-secret"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'FedEx',
    'fedex',
    '{"testMode": true, "apiKey": "test-key", "apiSecret": "test-secret"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'DHL',
    'dhl',
    '{"testMode": true, "apiKey": "test-key", "apiSecret": "test-secret", "accountNumber": "test-account"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Postex',
    'postex',
    '{"testMode": true, "apiKey": "test-key", "apiSecret": "test-secret"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Canada Post',
    'canadapost',
    '{"testMode": true, "apiKey": "test-key", "apiSecret": "test-secret"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Royal Mail',
    'royalmail',
    '{"testMode": true, "apiKey": "test-key", "apiSecret": "test-secret"}'
  );

-- Insert default shipping services
INSERT INTO shipping_services (carrier_id, name, code, description, estimated_days, max_weight, max_dimensions) VALUES
  -- USPS Services
  (
    (SELECT id FROM shipping_carriers WHERE code = 'usps' LIMIT 1),
    'USPS Ground',
    'usps-ground',
    'Economy ground shipping',
    5,
    70.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'usps' LIMIT 1),
    'USPS Priority Mail',
    'usps-priority',
    'Fast priority shipping',
    2,
    70.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'usps' LIMIT 1),
    'USPS Express Mail',
    'usps-express',
    'Overnight express shipping',
    1,
    70.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  -- UPS Services
  (
    (SELECT id FROM shipping_carriers WHERE code = 'ups' LIMIT 1),
    'UPS Ground',
    'ups-ground',
    'Economy ground shipping',
    3,
    150.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'ups' LIMIT 1),
    'UPS 2nd Day Air',
    'ups-2day',
    '2-day air shipping',
    2,
    150.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'ups' LIMIT 1),
    'UPS Next Day Air',
    'ups-nextday',
    'Next day air shipping',
    1,
    150.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  -- FedEx Services
  (
    (SELECT id FROM shipping_carriers WHERE code = 'fedex' LIMIT 1),
    'FedEx Ground',
    'fedex-ground',
    'Economy ground shipping',
    2,
    150.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'fedex' LIMIT 1),
    'FedEx 2Day',
    'fedex-2day',
    '2-day shipping',
    2,
    150.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'fedex' LIMIT 1),
    'FedEx Standard Overnight',
    'fedex-overnight',
    'Overnight shipping',
    1,
    150.0,
    '{"length": 108, "width": 108, "height": 108}'
  ),
  -- DHL Services
  (
    (SELECT id FROM shipping_carriers WHERE code = 'dhl' LIMIT 1),
    'DHL Express Worldwide',
    'dhl-express',
    'International express shipping',
    1,
    154.0,
    '{"length": 118, "width": 118, "height": 118}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'dhl' LIMIT 1),
    'DHL Express 12:00',
    'dhl-express-12',
    'Express delivery by 12:00',
    1,
    154.0,
    '{"length": 118, "width": 118, "height": 118}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'dhl' LIMIT 1),
    'DHL Express 10:30',
    'dhl-express-1030',
    'Express delivery by 10:30',
    1,
    154.0,
    '{"length": 118, "width": 118, "height": 118}'
  ),
  -- Postex Services
  (
    (SELECT id FROM shipping_carriers WHERE code = 'postex' LIMIT 1),
    'Postex Standard',
    'postex-standard',
    'Standard delivery',
    3,
    30.0,
    '{"length": 60, "width": 40, "height": 40}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'postex' LIMIT 1),
    'Postex Express',
    'postex-express',
    'Express delivery',
    1,
    30.0,
    '{"length": 60, "width": 40, "height": 40}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'postex' LIMIT 1),
    'Postex Same Day',
    'postex-sameday',
    'Same day delivery',
    1,
    30.0,
    '{"length": 60, "width": 40, "height": 40}'
  ),
  -- Canada Post Services
  (
    (SELECT id FROM shipping_carriers WHERE code = 'canadapost' LIMIT 1),
    'Canada Post Regular',
    'canadapost-regular',
    'Regular parcel service',
    5,
    30.0,
    '{"length": 100, "width": 100, "height": 100}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'canadapost' LIMIT 1),
    'Canada Post Expedited',
    'canadapost-expedited',
    'Expedited parcel service',
    2,
    30.0,
    '{"length": 100, "width": 100, "height": 100}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'canadapost' LIMIT 1),
    'Canada Post Xpresspost',
    'canadapost-xpresspost',
    'Express parcel service',
    1,
    30.0,
    '{"length": 100, "width": 100, "height": 100}'
  ),
  -- Royal Mail Services
  (
    (SELECT id FROM shipping_carriers WHERE code = 'royalmail' LIMIT 1),
    'Royal Mail 1st Class',
    'royalmail-1st',
    'First class mail',
    1,
    2.0,
    '{"length": 35, "width": 25, "height": 2.5}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'royalmail' LIMIT 1),
    'Royal Mail 2nd Class',
    'royalmail-2nd',
    'Second class mail',
    3,
    2.0,
    '{"length": 35, "width": 25, "height": 2.5}'
  ),
  (
    (SELECT id FROM shipping_carriers WHERE code = 'royalmail' LIMIT 1),
    'Royal Mail Special Delivery',
    'royalmail-special',
    'Special delivery guaranteed',
    1,
    2.0,
    '{"length": 35, "width": 25, "height": 2.5}'
  );

-- Insert default warehouse
INSERT INTO warehouses (user_id, name, code, address, is_default) VALUES
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Main Warehouse',
    'MAIN',
    '{"name": "Main Warehouse", "address1": "123 Main St", "city": "Anytown", "state": "CA", "postalCode": "12345", "country": "US"}',
    true
  );
