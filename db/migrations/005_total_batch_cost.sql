ALTER TABLE stock_batches RENAME COLUMN price_per_gram TO total_cost;
ALTER TABLE stock_batches ALTER COLUMN total_cost TYPE NUMERIC(18,2);
UPDATE stock_batches SET total_cost = ROUND(total_cost * grams, 2);
ALTER TABLE stock_batches RENAME CONSTRAINT stock_batches_price_per_gram_check TO stock_batches_total_cost_check;
ALTER TABLE sale_batch_assignments ALTER COLUMN unit_cost TYPE NUMERIC(18,6);
