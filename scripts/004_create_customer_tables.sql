-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customers"
  ON public.customers FOR ALL
  USING (auth.uid() = user_id);

-- Create customer_segments table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on customer_segments
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customer segments"
  ON public.customer_segments FOR ALL
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_tags ON public.customers USING GIN(tags);
CREATE INDEX idx_customer_segments_user_id ON public.customer_segments(user_id);

-- Function to automatically create customer from order
CREATE OR REPLACE FUNCTION public.create_customer_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert customer if email doesn't exist
  INSERT INTO public.customers (user_id, email, first_name, last_name, phone)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.customer_email, ''),
    CASE 
      WHEN NEW.customer_name ~ '^[A-Za-z]+ [A-Za-z]+$' THEN 
        split_part(NEW.customer_name, ' ', 1)
      ELSE NULL
    END,
    CASE 
      WHEN NEW.customer_name ~ '^[A-Za-z]+ [A-Za-z]+$' THEN 
        split_part(NEW.customer_name, ' ', 2)
      ELSE NULL
    END,
    NEW.customer_phone
  )
  ON CONFLICT (user_id, email) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create customer from order
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_customer_from_order();
