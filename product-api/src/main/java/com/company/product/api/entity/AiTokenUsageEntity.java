package com.company.product.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_token_usage")
@Getter
@Setter
public class AiTokenUsageEntity {
    @Id
    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "used_tokens", nullable = false)
    private Integer usedTokens;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

