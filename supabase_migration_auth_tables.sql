-- Create allowed_emails
CREATE TABLE public.allowed_emails (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT allowed_emails_pkey PRIMARY KEY (id),
    CONSTRAINT allowed_emails_email_key UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Create it_device_passwords
CREATE TABLE public.it_device_passwords (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    device_type text NOT NULL,
    device_name text NOT NULL,
    department_id uuid,
    encrypted_password bytea NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT it_device_passwords_pkey PRIMARY KEY (id),
    CONSTRAINT it_device_passwords_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.it_departments(id)
);

-- Enable RLS
ALTER TABLE public.it_device_passwords ENABLE ROW LEVEL SECURITY;

-- Create function
CREATE OR REPLACE FUNCTION public.is_allowed_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$function$;

-- Policies for allowed_emails
CREATE POLICY allowed_emails_select ON public.allowed_emails FOR SELECT TO public USING (auth.role() = 'authenticated'::text);
CREATE POLICY allowed_emails_insert ON public.allowed_emails FOR INSERT TO public WITH CHECK (is_allowed_user());
CREATE POLICY allowed_emails_delete ON public.allowed_emails FOR DELETE TO public USING (is_allowed_user());

-- Policies for it_device_passwords
CREATE POLICY it_device_passwords_select ON public.it_device_passwords FOR SELECT TO public USING (is_allowed_user());
CREATE POLICY it_device_passwords_insert ON public.it_device_passwords FOR INSERT TO public WITH CHECK (is_allowed_user());
CREATE POLICY it_device_passwords_update ON public.it_device_passwords FOR UPDATE TO public USING (is_allowed_user());
CREATE POLICY it_device_passwords_delete ON public.it_device_passwords FOR DELETE TO public USING (is_allowed_user());
