-- Create enum for staff roles
CREATE TYPE public.staff_role AS ENUM ('admin', 'manager', 'agent', 'support');

-- Create staff_members table for extended staff info
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role staff_role NOT NULL DEFAULT 'agent',
  employee_id TEXT,
  department TEXT,
  phone TEXT,
  address TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create staff activity log table
CREATE TABLE public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check staff role
CREATE OR REPLACE FUNCTION public.has_staff_role(_user_id UUID, _role staff_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_members
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Check if user is any staff member
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_members
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Get staff role for a user
CREATE OR REPLACE FUNCTION public.get_staff_role(_user_id UUID)
RETURNS staff_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.staff_members
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- RLS Policies for staff_members
CREATE POLICY "Admins can manage all staff"
ON public.staff_members
FOR ALL
USING (is_admin());

CREATE POLICY "Staff can view own profile"
ON public.staff_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Staff can update own profile"
ON public.staff_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for staff_activity_log
CREATE POLICY "Admins can view all activity logs"
ON public.staff_activity_log
FOR SELECT
USING (is_admin());

CREATE POLICY "Staff can view own activity logs"
ON public.staff_activity_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Staff can insert own activity logs"
ON public.staff_activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_staff_members_updated_at
BEFORE UPDATE ON public.staff_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_staff_activity_log_staff_id ON public.staff_activity_log(staff_id);
CREATE INDEX idx_staff_activity_log_created_at ON public.staff_activity_log(created_at DESC);
CREATE INDEX idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX idx_staff_members_role ON public.staff_members(role);