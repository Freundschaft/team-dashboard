-- Team Dashboard Seed Data
-- Sample data only - no schema

-- Insert sample users
INSERT INTO users (name, email) VALUES
('John Doe', 'john.doe@company.com'),
('Jane Smith', 'jane.smith@company.com'),
('Mike Johnson', 'mike.johnson@company.com'),
('Sarah Wilson', 'sarah.wilson@company.com'),
('David Brown', 'david.brown@company.com'),
('Emily Davis', 'emily.davis@company.com'),
('Robert Miller', 'robert.miller@company.com'),
('Lisa Garcia', 'lisa.garcia@company.com');

-- Insert hierarchical teams
-- Top level teams
INSERT INTO teams (name, description, department, parent_id) VALUES
('Engineering', 'Software engineering division', 'Technology', NULL),
('Marketing', 'Marketing and communications', 'Marketing', NULL),
('Sales', 'Sales and business development', 'Sales', NULL);

-- Sub-teams under Engineering
INSERT INTO teams (name, description, department, parent_id) VALUES
('Frontend Team', 'UI/UX and frontend development', 'Technology', 1),
('Backend Team', 'Server-side and infrastructure', 'Technology', 1),
('DevOps Team', 'CI/CD and infrastructure management', 'Technology', 1);

-- Sub-teams under Marketing
INSERT INTO teams (name, description, department, parent_id) VALUES
('Content Team', 'Content creation and strategy', 'Marketing', 2),
('Digital Marketing', 'Online marketing and campaigns', 'Marketing', 2);

-- Sub-teams under Frontend Team
INSERT INTO teams (name, description, department, parent_id) VALUES
('React Team', 'React and component development', 'Technology', 4),
('Design System', 'UI components and design tokens', 'Technology', 4);

-- Assign team members with different roles
INSERT INTO team_members (user_id, team_id, role, is_active) VALUES
-- Engineering team
(1, 1, 'lead', true),
(2, 1, 'senior_engineer', true),

-- Frontend team
(2, 4, 'lead', true),
(3, 4, 'senior_engineer', true),
(4, 4, 'engineer', true),

-- Backend team  
(1, 5, 'lead', true),
(5, 5, 'senior_engineer', true),

-- DevOps team
(6, 6, 'lead', true),

-- Marketing team
(7, 2, 'lead', true),
(8, 2, 'manager', true),

-- Content team
(8, 7, 'lead', true),

-- Digital Marketing
(7, 8, 'manager', true),

-- React team
(3, 9, 'lead', true),
(4, 9, 'engineer', true),

-- Design System
(2, 10, 'lead', true),

-- Sales team
(5, 3, 'lead', true),
(6, 3, 'senior_sales', true);