ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1 CHECK (session_version > 0);

CREATE TABLE auth_login_attempts (
  email TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  first_failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_journal_header() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE line_count INTEGER; debit_total NUMERIC(14,2); credit_total NUMERIC(14,2);
BEGIN
  SELECT count(*), COALESCE(sum(debit),0), COALESCE(sum(credit),0)
    INTO line_count,debit_total,credit_total FROM journal_lines WHERE journal_entry_id=NEW.id;
  IF line_count<2 OR debit_total<>credit_total THEN
    RAISE EXCEPTION 'Journal entry % must have at least two balanced lines',NEW.id;
  END IF;
  RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER journal_header_must_balance
AFTER INSERT ON journal_entries DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validate_journal_header();

CREATE UNIQUE INDEX journal_reversal_once ON journal_entries(reversal_of_id) WHERE reversal_of_id IS NOT NULL;

CREATE OR REPLACE FUNCTION prevent_financial_truncate() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION '% cannot be truncated',TG_TABLE_NAME; END $$;
CREATE TRIGGER immutable_journal_entries_truncate BEFORE TRUNCATE ON journal_entries
FOR EACH STATEMENT EXECUTE FUNCTION prevent_financial_truncate();
CREATE TRIGGER immutable_journal_lines_truncate BEFORE TRUNCATE ON journal_lines
FOR EACH STATEMENT EXECUTE FUNCTION prevent_financial_truncate();
