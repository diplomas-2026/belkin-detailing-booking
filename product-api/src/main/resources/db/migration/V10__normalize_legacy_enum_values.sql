-- Normalize legacy enum-like values persisted before enum refactoring.

-- Payment method legacy alias
UPDATE appointments
SET payment_method = 'NOW'
WHERE payment_method = 'CARD';

-- Service item kind legacy aliases
UPDATE service_items
SET kind = CASE kind
    WHEN 'BASE' THEN 'MANDATORY'
    WHEN 'OPTION' THEN 'OPTIONAL'
    WHEN 'ALTERNATIVE' THEN 'CHOICE_OPTION'
    ELSE kind
END
WHERE kind IN ('BASE', 'OPTION', 'ALTERNATIVE');
