package com.company.product.api.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(
        boolean enabled,
        int tokenLimitPerDay,
        String timezoneSamara,
        String moderationCronMoscow
) {
}

