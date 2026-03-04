package com.company.product.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MasterDtos {
    public record MasterView(Long id, Long userId, String fullName, Long workshopId, String workshopName, String specialization, Integer experienceYears, boolean active) {}

    public record MasterCreateRequest(@NotNull Long userId,
                                      @NotNull Long workshopId,
                                      @NotBlank String specialization,
                                      @NotNull @Min(0) Integer experienceYears,
                                      boolean active) {}
}
