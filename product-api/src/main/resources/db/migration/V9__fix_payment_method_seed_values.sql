-- Fix invalid enum values from V8 seed for existing databases
UPDATE appointments
SET payment_method = 'NOW'
WHERE payment_method = 'CARD';
