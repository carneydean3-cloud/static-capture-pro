CREATE POLICY "Allow anonymous inserts on leads"
ON public."Leads" FOR INSERT
TO anon, authenticated
WITH CHECK (true);