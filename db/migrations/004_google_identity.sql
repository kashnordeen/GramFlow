ALTER TABLE users ADD COLUMN google_subject TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_auth_method_check CHECK (password_hash IS NOT NULL OR google_subject IS NOT NULL);
