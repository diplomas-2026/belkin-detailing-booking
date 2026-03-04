CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE workshops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone VARCHAR(30),
    working_hours VARCHAR(120),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE workshop_photos (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cars (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id),
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(80) NOT NULL,
    car_year INT NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    color VARCHAR(50),
    notes TEXT,
    UNIQUE (client_id, plate_number)
);

CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    name VARCHAR(120) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (workshop_id, name)
);

CREATE TABLE masters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    specialization VARCHAR(200),
    experience_years INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE master_shifts (
    id BIGSERIAL PRIMARY KEY,
    master_id BIGINT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE (master_id, shift_date, start_time)
);

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id),
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    car_id BIGINT NOT NULL REFERENCES cars(id),
    service_id BIGINT NOT NULL REFERENCES services(id),
    master_id BIGINT REFERENCES masters(id),
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    client_comment TEXT,
    result_comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMP,
    cancel_reason VARCHAR(300),
    UNIQUE (client_id, scheduled_start)
);

CREATE TABLE appointment_status_history (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT now(),
    comment VARCHAR(300)
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id),
    appointment_id BIGINT NOT NULL REFERENCES appointments(id),
    target_type VARCHAR(30) NOT NULL,
    service_id BIGINT REFERENCES services(id),
    master_id BIGINT REFERENCES masters(id),
    workshop_id BIGINT REFERENCES workshops(id),
    rating INT NOT NULL,
    comment VARCHAR(700),
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT rating_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_appointments_workshop ON appointments(workshop_id);
CREATE INDEX idx_appointments_master ON appointments(master_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_reviews_target_type ON reviews(target_type);
