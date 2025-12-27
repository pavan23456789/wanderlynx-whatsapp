-- Enable Row Level Security (RLS) for the 'users' table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- POLICIES FOR 'users' TABLE
-- ----------------------------------------------------------------

-- 1. Admin Full Access Policy
--    Admins should have unrestricted access to perform any
--    operation (SELECT, INSERT, UPDATE, DELETE) on the users table.
--
--    - The `get_my_claim('user_role')` function retrieves the 'user_role'
--      claim from the authenticated user's JWT.
--    - The policy checks if the role is 'admin'.
CREATE POLICY "Allow admin full access to users"
ON users
FOR ALL
USING (get_my_claim('user_role')::text = 'admin')
WITH CHECK (get_my_claim('user_role')::text = 'admin');


-- 2. Read-Only Policy for Authenticated Users
--    All authenticated users (including 'support' and 'marketing')
--    should be able to view the list of users in the system.
--    They cannot insert, update, or delete records.
CREATE POLICY "Allow authenticated users read access"
ON users
FOR SELECT
USING (auth.role() = 'authenticated');
