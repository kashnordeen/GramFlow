CREATE OR REPLACE FUNCTION validate_journal_entry() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE line_count INTEGER; debit_total NUMERIC(14,2); credit_total NUMERIC(14,2); target_id BIGINT;
BEGIN
  target_id:=COALESCE(NEW.journal_entry_id,OLD.journal_entry_id);
  SELECT count(*),COALESCE(sum(debit),0),COALESCE(sum(credit),0) INTO line_count,debit_total,credit_total FROM journal_lines WHERE journal_entry_id=target_id;
  IF line_count<2 OR debit_total<>credit_total THEN RAISE EXCEPTION 'Journal entry % must have at least two balanced lines',target_id; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER journal_entry_must_balance AFTER INSERT OR UPDATE OR DELETE ON journal_lines
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_journal_entry();
CREATE OR REPLACE FUNCTION prevent_immutable_changes() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION '% records are immutable; create a reversal or adjustment instead',TG_TABLE_NAME; END $$;
CREATE TRIGGER immutable_journal_entries BEFORE UPDATE OR DELETE ON journal_entries FOR EACH ROW EXECUTE FUNCTION prevent_immutable_changes();
CREATE TRIGGER immutable_journal_lines BEFORE UPDATE OR DELETE ON journal_lines FOR EACH ROW EXECUTE FUNCTION prevent_immutable_changes();
CREATE TRIGGER immutable_audit_logs BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_immutable_changes();
CREATE OR REPLACE FUNCTION prevent_audit_truncate() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_logs cannot be truncated'; END $$;
CREATE TRIGGER immutable_audit_truncate BEFORE TRUNCATE ON audit_logs FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_truncate();
