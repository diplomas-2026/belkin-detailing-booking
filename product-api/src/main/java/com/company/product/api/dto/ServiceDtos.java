package com.company.product.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ServiceDtos {
    public record ServiceView(Long id,
                              Long workshopId,
                              String workshopName,
                              String name,
                              String description,
                              Integer durationMinutes,
                              BigDecimal price,
                              boolean active) {}

    public record ServiceCreateRequest(@NotNull Long workshopId,
                                       @NotBlank String name,
                                       String description,
                                       @NotNull @Min(15) Integer durationMinutes,
                                       @NotNull @DecimalMin("1.00") BigDecimal price,
                                       boolean active) {}
}
