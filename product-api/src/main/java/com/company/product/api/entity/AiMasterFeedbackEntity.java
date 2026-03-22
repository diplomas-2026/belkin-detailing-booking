package com.company.product.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_master_feedback")
@Getter
@Setter
public class AiMasterFeedbackEntity {
    @Id
    @Column(name = "master_id", nullable = false)
    private Long masterId;

    @Column(name = "summary", nullable = false, length = 2000)
    private String summary;

    @Column(name = "based_on_review_created_at")
    private LocalDateTime basedOnReviewCreatedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

