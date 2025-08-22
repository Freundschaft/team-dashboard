-- Fix: Improved circular reference constraint for teams table
-- This version properly handles all circular reference cases

-- Drop existing constraint and function first
DROP TRIGGER IF EXISTS check_team_circular_reference ON teams;
DROP FUNCTION IF EXISTS prevent_circular_team_reference();

-- Create improved function to detect circular references
CREATE OR REPLACE FUNCTION prevent_circular_team_reference()
RETURNS TRIGGER AS $$
DECLARE
has_cycle BOOLEAN := FALSE;
  max_depth INTEGER := 100; -- Prevent infinite loops
BEGIN
  -- Skip check if parent_id is NULL (root team)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
END IF;

  -- Skip check if this is an UPDATE and parent_id is not actually changing
  IF TG_OP = 'UPDATE' AND OLD.parent_id = NEW.parent_id THEN
    RETURN NEW;
END IF;

  -- Check for direct self-reference
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'Team cannot be its own parent (circular reference detected)';
END IF;

  -- For UPDATE operations, we need to check what the hierarchy would look like
  -- if we exclude the current team from its current position
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
    -- But skip the team we're currently updating to avoid false positives
    SELECT
        t.id,
        CASE
            -- If this is the team we're updating, use NULL as its parent
            -- (effectively removing it from the chain temporarily)
            WHEN t.id = NEW.id THEN NULL
            ELSE t.parent_id
            END as parent_id,
        pc.level + 1
    FROM teams t
             JOIN parent_chain pc ON t.id = pc.parent_id
    WHERE pc.level < max_depth  -- Prevent infinite recursion
      AND pc.parent_id IS NOT NULL
    -- Continue traversing even if we hit the team being updated
)
SELECT EXISTS(
    SELECT 1
    FROM parent_chain
    WHERE id = NEW.id AND level > 1  -- level > 1 means we found a cycle
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
'Prevents circular references in team hierarchy by checking parent chain before INSERT/UPDATE - Fixed version';

COMMENT ON TRIGGER check_team_circular_reference ON teams IS
'Ensures no circular references can be created in the team hierarchy - Fixed version';