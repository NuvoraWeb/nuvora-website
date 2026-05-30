-- Run this in your Supabase SQL editor
-- Go to: supabase.com → your project → SQL Editor → New query

CREATE TABLE IF NOT EXISTS review_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  type text NOT NULL CHECK (type IN ('positive', 'negative')),
  feedback text,
  client_name text,
  client_email text,
  business_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE review_feedback ENABLE ROW LEVEL SECURITY;

-- Allow your serverless functions (service role) to insert
CREATE POLICY "Service can insert review feedback"
  ON review_feedback FOR INSERT
  WITH CHECK (true);

-- Only allow reading via service role (not anon)
CREATE POLICY "No public read"
  ON review_feedback FOR SELECT
  USING (false);
