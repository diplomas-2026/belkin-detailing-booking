CREATE TABLE appointment_services (
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id),
    PRIMARY KEY (appointment_id, service_id)
);

-- Backfill existing single service into the new relation
INSERT INTO appointment_services (appointment_id, service_id)
SELECT id, service_id
FROM appointments
WHERE service_id IS NOT NULL
ON CONFLICT DO NOTHING;

