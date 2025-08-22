-- Migration: Add circular reference constraint to teams table
-- This prevents circular references in the team hierarchy at the database level

-- Create function to detect circular references
CREATE OR REPLACE FUNCTION prevent_circular_team_reference()
RETURNS TRIGGER AS $$
DECLARE
  has_cycle BOOLEAN := FALSE;
  max_depth INTEGER := 100; -- Prevent infinite loops
BEGIN
  -- Skip check if parent_id is NULL (root team) or if parent_id is not changing
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Skip check if this is not actually changing the parent_id
  IF TG_OP = 'UPDATE' AND OLD.parent_id = NEW.parent_id THEN
    RETURN NEW;
  END IF;
  
  -- Check for direct self-reference
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'Team cannot be its own parent (circular reference detected)';
  END IF;
  
  -- Use recursive CTE to check if setting this parent would create a cycle
  -- We traverse UP the parent chain from the proposed parent to see if we encounter the current team
  WITH RECURSIVE parent_chain AS (
    -- Base case: start from the proposed parent
    SELECT 
      id,
      parent_id,
      1 as level
    FROM teams 
    WHERE id = NEW.parent_id
    
    UNION ALL
    
    -- Recursive case: follow parent chain upward
    SELECT 
      t.id,
      t.parent_id,
      pc.level + 1
    FROM teams t
    JOIN parent_chain pc ON t.id = pc.parent_id
    WHERE pc.level < max_depth  -- Prevent infinite recursion
      AND t.parent_id IS NOT NULL
  )
  SELECT EXISTS(
    SELECT 1 
    FROM parent_chain 
    WHERE id = NEW.id
  ) INTO has_cycle;
  
  IF has_cycle THEN
    RAISE EXCEPTION 'Cannot set parent team: would create circular reference in hierarchy';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before INSERT or UPDATE on teams table
CREATE TRIGGER check_team_circular_reference
  BEFORE INSERT OR UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_team_reference();

-- Add comment for documentation
COMMENT ON FUNCTION prevent_circular_team_reference() IS 
'Prevents circular references in team hierarchy by checking parent chain before INSERT/UPDATE';

COMMENT ON TRIGGER check_team_circular_reference ON teams IS 
'Ensures no circular references can be created in the team hierarchy';