CREATE TABLE ai_workshop_feedback (
    workshop_id BIGINT PRIMARY KEY REFERENCES workshops(id) ON DELETE CASCADE,
    summary VARCHAR(2000) NOT NULL,
    based_on_review_created_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE ai_master_feedback (
    master_id BIGINT PRIMARY KEY REFERENCES masters(id) ON DELETE CASCADE,
    summary VARCHAR(2000) NOT NULL,
    based_on_review_created_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

