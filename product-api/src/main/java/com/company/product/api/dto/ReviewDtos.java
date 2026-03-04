package com.company.product.api.dto;

import com.company.product.api.entity.ReviewTargetType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ReviewDtos {
    public record ReviewView(Long id,
                             String clientName,
                             Integer rating,
                             String comment,
                             LocalDateTime createdAt,
                             boolean visible) {}

    public record ReviewCreateRequest(@NotNull Long appointmentId,
                                      @NotNull ReviewTargetType targetType,
                                      Long serviceId,
                                      Long masterId,
                                      Long workshopId,
                                      @NotNull @Min(1) @Max(5) Integer rating,
                                      @Size(max = 700) String comment) {}

    public record ReviewVisibilityRequest(boolean visible) {}
}
