-- Rollback Migration: Remove circular reference constraint from teams table
-- This removes the database-level circular reference prevention

-- Drop the trigger first
DROP TRIGGER IF EXISTS check_team_circular_reference ON teams;

-- Drop the function
DROP FUNCTION IF EXISTS prevent_circular_team_reference();

-- Add comment for documentation
-- COMMENT: Circular reference constraint has been removed