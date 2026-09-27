-- Once the new application is live, an unset business context must see nothing.
-- Legacy global disablement has already been copied to each membership.
UPDATE users SET is_active=TRUE WHERE NOT is_active;
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'customers', 'stock_batches', 'sales', 'sale_batch_assignments',
    'payments', 'settings', 'accounts', 'journal_entries', 'journal_lines', 'audit_logs'
  ] LOOP
    EXECUTE format(
      'ALTER POLICY gramflow_business_access ON %I USING (current_user = ''gramflow_app'' AND business_id = NULLIF(current_setting(''app.business_id'', true), '''')::bigint) WITH CHECK (current_user = ''gramflow_app'' AND business_id = NULLIF(current_setting(''app.business_id'', true), '''')::bigint)',
      table_name
    );
  END LOOP;
END $$;

ALTER POLICY gramflow_business_access ON rate_ranges
  USING (current_user = 'gramflow_app' AND business_id = NULLIF(current_setting('app.business_id', true), '')::bigint)
  WITH CHECK (current_user = 'gramflow_app' AND business_id = NULLIF(current_setting('app.business_id', true), '')::bigint);
