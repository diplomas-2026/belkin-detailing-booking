CREATE TABLE service_items (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    kind VARCHAR(30) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    choice_group_key TEXT,
    default_selected BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_service_items_unique
    ON service_items(service_id, kind, name, COALESCE(choice_group_key, ''));

CREATE INDEX ix_service_items_service
    ON service_items(service_id);

CREATE TABLE appointment_service_items (
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_item_id BIGINT NOT NULL REFERENCES service_items(id),
    PRIMARY KEY (appointment_id, service_item_id)
);

CREATE INDEX ix_appointment_service_items_appointment
    ON appointment_service_items(appointment_id);

