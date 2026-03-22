package com.company.product.api.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(
        boolean enabled,
        int tokenLimitPerDay,
        String timezoneSamara,
        String moderationCronMoscow,
        Duration llmTimeout
) {
}
