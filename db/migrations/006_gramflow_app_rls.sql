DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'roles', 'permissions', 'user_roles', 'role_permissions',
    'customers', 'stock_batches', 'sales', 'sale_batch_assignments',
    'payments', 'settings', 'accounts', 'journal_entries', 'journal_lines',
    'audit_logs', 'auth_login_attempts'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY gramflow_app_server_access ON %I FOR ALL TO PUBLIC USING (current_user = ''gramflow_app'') WITH CHECK (current_user = ''gramflow_app'')',
      table_name
    );
  END LOOP;
END $$;
