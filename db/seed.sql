INSERT INTO permissions (name,description) VALUES
('inventory.read','View inventory'),('inventory.create','Create stock batches'),('inventory.update','Update stock batches'),('inventory.delete','Delete stock batches'),
('sales.read','View sales'),('sales.create','Create sales'),('sales.reverse','Reverse sales'),('customers.read','View customers'),('customers.create','Create customers'),
('customers.update','Update customers'),('customers.delete','Delete customers'),('payments.read','View payments'),('payments.create','Create customer payments'),
('reports.read','View and export reports'),('accounting.read','View accounting journals'),('accounting.post','Post accounting journals'),
('accounting.reverse','Reverse accounting journals'),('users.read','View users'),('users.create','Create users'),('users.update','Update users'),
('users.delete','Disable users'),('roles.read','View roles'),('roles.manage','Manage roles and permissions'),('audit.read','View audit history'),('settings.manage','Manage pricing settings')
ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description;
INSERT INTO roles (name,description) VALUES ('ADMIN','Full system administration'),('MANAGER','Sales, customer, inventory and reporting management'),
('INVENTORY_OPERATOR','Inventory operations'),('ACCOUNTANT','Payments, accounting and reporting') ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description;
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name='ADMIN' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name=ANY(ARRAY['inventory.read','inventory.create','inventory.update','sales.read','sales.create','sales.reverse','customers.read','customers.create','customers.update','payments.read','payments.create','reports.read','settings.manage']) WHERE r.name='MANAGER' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name=ANY(ARRAY['inventory.read','inventory.create','inventory.update']) WHERE r.name='INVENTORY_OPERATOR' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name=ANY(ARRAY['sales.read','customers.read','payments.read','payments.create','reports.read','accounting.read','accounting.post','accounting.reverse','audit.read']) WHERE r.name='ACCOUNTANT' ON CONFLICT DO NOTHING;
INSERT INTO accounts (account_code,account_name,account_type) VALUES ('1000','Cash','ASSET'),('1010','Bank','ASSET'),('1100','Accounts Receivable','ASSET'),
('1200','Inventory','ASSET'),('3000','Opening Balance Equity','EQUITY'),('4000','Sales Revenue','REVENUE'),('5000','Cost of Goods Sold','EXPENSE'),('5100','Inventory Loss','EXPENSE')
ON CONFLICT (account_code) DO UPDATE SET account_name=EXCLUDED.account_name,account_type=EXCLUDED.account_type;
