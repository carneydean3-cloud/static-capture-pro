
-- Create subscribers table
CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'free_audit',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts on subscribers"
  ON public.subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create audits table
CREATE TABLE public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  url text NOT NULL,
  overall_score smallint,
  verdict text,
  clarity_score smallint,
  hook_score smallint,
  trust_score smallint,
  desire_score smallint,
  action_score smallint,
  objections_score smallint,
  top_3_fixes jsonb,
  full_results jsonb,
  tier text NOT NULL DEFAULT 'free',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts on audits"
  ON public.audits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
