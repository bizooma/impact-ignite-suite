-- Fix search_path security warnings for the list count functions
CREATE OR REPLACE FUNCTION public.recalculate_crm_list_contact_count(list_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE crm_lists
  SET contact_count = (
    SELECT COUNT(*)
    FROM crm_list_memberships
    WHERE crm_list_memberships.list_id = recalculate_crm_list_contact_count.list_id
  )
  WHERE id = recalculate_crm_list_contact_count.list_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_list_count_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_crm_list_contact_count(NEW.list_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_list_count_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_crm_list_contact_count(OLD.list_id);
  RETURN OLD;
END;
$$;