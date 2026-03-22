package com.company.product.api.dto;

import com.company.product.api.entity.ReviewTargetType;
import com.company.product.api.entity.ReviewModerationStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ReviewDtos {
    public record ReviewView(Long id,
                             String clientName,
                             ReviewTargetType targetType,
                             Integer rating,
                             String comment,
                             LocalDateTime createdAt,
                             ReviewModerationStatus status,
                             String rejectionReason) {}

    public record ReviewCreateRequest(@NotNull Long appointmentId,
                                      @NotNull ReviewTargetType targetType,
                                      Long serviceId,
                                      Long masterId,
                                      Long workshopId,
                                      @NotNull @Min(1) @Max(5) Integer rating,
                                      @Size(max = 700) String comment) {}
}
