-- Create function to recalculate contact count for a list
CREATE OR REPLACE FUNCTION public.recalculate_crm_list_contact_count(list_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger function for INSERT
CREATE OR REPLACE FUNCTION public.update_list_count_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM recalculate_crm_list_contact_count(NEW.list_id);
  RETURN NEW;
END;
$$;

-- Create trigger function for DELETE
CREATE OR REPLACE FUNCTION public.update_list_count_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM recalculate_crm_list_contact_count(OLD.list_id);
  RETURN OLD;
END;
$$;

-- Add triggers to crm_list_memberships
DROP TRIGGER IF EXISTS trigger_update_list_count_on_insert ON crm_list_memberships;
CREATE TRIGGER trigger_update_list_count_on_insert
  AFTER INSERT ON crm_list_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_list_count_on_insert();

DROP TRIGGER IF EXISTS trigger_update_list_count_on_delete ON crm_list_memberships;
CREATE TRIGGER trigger_update_list_count_on_delete
  AFTER DELETE ON crm_list_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_list_count_on_delete();

-- Backfill existing contact counts
UPDATE crm_lists l
SET contact_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT list_id, COUNT(*) as cnt
  FROM crm_list_memberships
  GROUP BY list_id
) sub
WHERE l.id = sub.list_id;

-- Set count to 0 for lists with no members
UPDATE crm_lists
SET contact_count = 0
WHERE contact_count IS NULL;