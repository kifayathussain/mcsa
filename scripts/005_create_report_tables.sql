-- Create report templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'custom',
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated reports table
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  data JSONB,
  status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  schedule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own report templates" ON report_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own report templates" ON report_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report templates" ON report_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report templates" ON report_templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own generated reports" ON generated_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated reports" ON generated_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated reports" ON generated_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated reports" ON generated_reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scheduled reports" ON scheduled_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled reports" ON scheduled_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled reports" ON scheduled_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled reports" ON scheduled_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_user_id ON report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_generated_reports_user_id ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_template_id ON generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user_id ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_template_id ON scheduled_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_reports_updated_at
  BEFORE UPDATE ON generated_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default report templates
INSERT INTO report_templates (user_id, name, description, category, config, is_default) VALUES
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Sales Summary Report',
    'Comprehensive sales overview with revenue, orders, and customer metrics',
    'sales',
    '{
      "title": "Sales Summary Report",
      "description": "Comprehensive sales overview",
      "dateRange": {"type": "preset", "preset": "30d"},
      "metrics": [
        {"id": "revenue", "name": "Total Revenue", "type": "revenue", "aggregation": "sum", "label": "Revenue"},
        {"id": "orders", "name": "Total Orders", "type": "orders", "aggregation": "count", "label": "Orders"},
        {"id": "customers", "name": "New Customers", "type": "customers", "aggregation": "count", "label": "Customers"}
      ],
      "visualization": {"type": "both", "chartType": "bar"}
    }',
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Channel Performance Report',
    'Performance metrics across all sales channels',
    'channels',
    '{
      "title": "Channel Performance Report",
      "description": "Channel performance analysis",
      "dateRange": {"type": "preset", "preset": "30d"},
      "metrics": [
        {"id": "revenue", "name": "Revenue by Channel", "type": "revenue", "aggregation": "sum", "label": "Revenue"},
        {"id": "orders", "name": "Orders by Channel", "type": "orders", "aggregation": "count", "label": "Orders"}
      ],
      "visualization": {"type": "chart", "chartType": "pie", "groupBy": "channel"}
    }',
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Customer Analytics Report',
    'Customer acquisition, retention, and lifetime value analysis',
    'customers',
    '{
      "title": "Customer Analytics Report",
      "description": "Customer insights and analytics",
      "dateRange": {"type": "preset", "preset": "90d"},
      "metrics": [
        {"id": "customers", "name": "New Customers", "type": "customers", "aggregation": "count", "label": "Customers"},
        {"id": "clv", "name": "Average CLV", "type": "customers", "aggregation": "average", "field": "customer_lifetime_value", "label": "CLV"}
      ],
      "visualization": {"type": "both", "chartType": "line"}
    }',
    true
  );
