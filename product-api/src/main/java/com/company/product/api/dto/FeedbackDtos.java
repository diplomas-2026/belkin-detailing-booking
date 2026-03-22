package com.company.product.api.dto;

import com.company.product.api.entity.ReviewTargetType;

import java.time.LocalDateTime;

public class FeedbackDtos {
    public record FeedbackSummaryView(ReviewTargetType targetType,
                                     String summary,
                                     LocalDateTime updatedAt,
                                     LocalDateTime basedOnReviewCreatedAt) {
    }

    public record TargetFeedbackView(String summary) {}
}
