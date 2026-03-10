-- Migration: Assistant Roles and Permissions
-- Description: Adds parent_id to profiles, creates assistant_permissions table, and updates RLS.

-- 1. Modify roles to accept 'assistant' and add parent_id for hierarchy
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
  
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'agent', 'assistant'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- 2. Create the permissions table for assistants
CREATE TABLE IF NOT EXISTS public.assistant_permissions (
  assistant_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  can_manage_clients BOOLEAN DEFAULT true,
  can_view_financials BOOLEAN DEFAULT false,
  can_manage_claims BOOLEAN DEFAULT true,
  can_manage_quotes BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assistant_permissions ENABLE ROW LEVEL SECURITY;

-- Agents can manage their assistants' permissions
CREATE POLICY "Agents can manage their assistants permissions" ON public.assistant_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = public.assistant_permissions.assistant_id 
      AND public.profiles.parent_id = auth.uid()
    )
  );

-- Agents can update the profile of their assistants
CREATE POLICY "Agents can update assistants profiles" ON public.profiles
  FOR UPDATE USING (parent_id = auth.uid());

-- Assistants can view their own permissions
CREATE POLICY "Assistants can view own permissions" ON public.assistant_permissions
  FOR SELECT USING (auth.uid() = assistant_id);

-- 3. Update existing RLS on core tables to account for assistants (Data Delegation)

-- Helper function to get the logical agent owner ID
-- Returns the user's ID if agent/admin, or the parent_id if assistant
CREATE OR REPLACE FUNCTION get_logical_agent_id(current_uid UUID)
RETURNS UUID AS $$
DECLARE
  v_role TEXT;
  v_parent_id UUID;
BEGIN
  SELECT role, parent_id INTO v_role, v_parent_id FROM public.profiles WHERE id = current_uid;
  
  IF v_role = 'assistant' AND v_parent_id IS NOT NULL THEN
    RETURN v_parent_id;
  END IF;
  
  RETURN current_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Clients RLS (Assistant needs to act on behalf of the Agent)
DROP POLICY IF EXISTS "Agents can view own clients" ON public.clients;
CREATE POLICY "Agents and their assistants can view clients" ON public.clients 
FOR SELECT USING (user_id = auth.uid() OR user_id = get_logical_agent_id(auth.uid()));

DROP POLICY IF EXISTS "Agents can insert own clients" ON public.clients;
CREATE POLICY "Agents and their assistants can insert clients" ON public.clients 
FOR INSERT WITH CHECK (
  (user_id = auth.uid() OR user_id = get_logical_agent_id(auth.uid()))
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'assistant' OR 
    EXISTS (SELECT 1 FROM public.assistant_permissions WHERE assistant_id = auth.uid() AND can_manage_clients = true)
  )
);

DROP POLICY IF EXISTS "Agents can update own clients" ON public.clients;
CREATE POLICY "Agents and their assistants can update clients" ON public.clients 
FOR UPDATE USING (
  (user_id = auth.uid() OR user_id = get_logical_agent_id(auth.uid()))
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'assistant' OR 
    EXISTS (SELECT 1 FROM public.assistant_permissions WHERE assistant_id = auth.uid() AND can_manage_clients = true)
  )
);

-- Note: Similar logic should be applied to Policies, Claims, CrossSell pipelines, etc.
-- But since they are usually tied to client_id (like public.policies), if the assistant can't see the client, they can't see the policy.
