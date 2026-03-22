ALTER TABLE appointments
    ADD COLUMN payment_method VARCHAR(30),
    ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    ADD COLUMN paid_at TIMESTAMP;

