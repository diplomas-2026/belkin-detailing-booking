package com.company.product.api.ai;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AiScheduler {
    private final ReviewAiModerationService moderationService;
    private final FeedbackSummaryService feedbackSummaryService;

    public AiScheduler(ReviewAiModerationService moderationService, FeedbackSummaryService feedbackSummaryService) {
        this.moderationService = moderationService;
        this.feedbackSummaryService = feedbackSummaryService;
    }

    @Scheduled(cron = "${app.ai.moderation-cron-moscow}", zone = "Europe/Moscow")
    public void nightlyJobMoscow() {
        moderationService.runOnce();
        feedbackSummaryService.updateIfNeeded();
    }
}

