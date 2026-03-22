-- AI moderation for reviews + feedback summaries + daily token usage

ALTER TABLE reviews
    ADD COLUMN moderation_status VARCHAR(20);

UPDATE reviews
SET moderation_status = CASE
    WHEN is_visible THEN 'APPROVED'
    ELSE 'REJECTED'
END
WHERE moderation_status IS NULL;

ALTER TABLE reviews
    ALTER COLUMN moderation_status SET NOT NULL;

ALTER TABLE reviews
    ALTER COLUMN moderation_status SET DEFAULT 'PENDING';

ALTER TABLE reviews
    ADD COLUMN rejection_reason VARCHAR(500),
    ADD COLUMN ai_moderated_at TIMESTAMP;

CREATE TABLE ai_feedback_summaries (
    target_type VARCHAR(30) PRIMARY KEY,
    summary VARCHAR(2000) NOT NULL,
    based_on_review_created_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE ai_token_usage (
    usage_date DATE PRIMARY KEY,
    used_tokens INT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

