-- SegWitz Communications Hub - Row Level Security Policies
-- Run this in Supabase SQL Editor after Prisma migrations

-- Enable RLS on all tables
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE auth_id = auth.uid()::TEXT LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get current user's department
CREATE OR REPLACE FUNCTION get_user_department_id()
RETURNS TEXT AS $$
  SELECT department_id FROM users WHERE auth_id = auth.uid()::TEXT LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Authenticated users can read divisions and departments
CREATE POLICY "Authenticated read divisions" ON divisions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage divisions" ON divisions
  FOR ALL TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "Authenticated read departments" ON departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage departments" ON departments
  FOR ALL TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

-- Users table
CREATE POLICY "Users read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid()::TEXT OR get_user_role() = 'ADMIN');

CREATE POLICY "Admin manage users" ON users
  FOR ALL TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

-- Contacts - staff and above can manage
CREATE POLICY "Staff manage contacts" ON contacts
  FOR ALL TO authenticated
  USING (get_user_role() IN ('ADMIN', 'DEPARTMENT_MANAGER', 'STAFF'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'DEPARTMENT_MANAGER', 'STAFF'));

CREATE POLICY "View only read contacts" ON contacts
  FOR SELECT TO authenticated
  USING (get_user_role() = 'VIEW_ONLY');

-- Email templates
CREATE POLICY "Read approved templates" ON email_templates
  FOR SELECT TO authenticated
  USING (
    status = 'APPROVED'
    OR get_user_role() = 'ADMIN'
    OR (get_user_role() = 'DEPARTMENT_MANAGER' AND department_id = get_user_department_id())
    OR owner_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::TEXT)
  );

CREATE POLICY "Managers create templates" ON email_templates
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('ADMIN', 'DEPARTMENT_MANAGER'));

CREATE POLICY "Managers update templates" ON email_templates
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('ADMIN', 'DEPARTMENT_MANAGER'));

-- Sent emails
CREATE POLICY "Read sent emails" ON sent_emails
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('ADMIN', 'DEPARTMENT_MANAGER')
    OR sent_by_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::TEXT)
  );

CREATE POLICY "Staff send emails" ON sent_emails
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('ADMIN', 'DEPARTMENT_MANAGER', 'STAFF'));

-- Settings - admin only
CREATE POLICY "Admin manage settings" ON settings
  FOR ALL TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

-- Audit logs - admin read
CREATE POLICY "Admin read audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'ADMIN');

-- Storage bucket policies (run in Supabase Dashboard > Storage)
-- Bucket: email-templates - authenticated upload/read
-- Bucket: attachments - authenticated upload/read
-- Bucket: company-assets - admin upload, authenticated read
