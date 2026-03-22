package com.company.product.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class ServiceDtos {
    public record ServiceItemView(Long id,
                                  String kind,
                                  String name,
                                  String description,
                                  BigDecimal price,
                                  String choiceGroupKey,
                                  boolean defaultSelected,
                                  int sortOrder) {}

    public record ServiceView(Long id,
                              Long workshopId,
                              String workshopName,
                              String name,
                              String description,
                              Integer durationMinutes,
                              BigDecimal price,
                              boolean active) {}

    public record ServiceDetailView(ServiceView service, List<ServiceItemView> items) {}

    public record ServiceCreateRequest(@NotNull Long workshopId,
                                       @NotBlank String name,
                                       String description,
                                       @NotNull @Min(15) Integer durationMinutes,
                                       @NotNull @DecimalMin("1.00") BigDecimal price,
                                       boolean active) {}

    public record ServiceItemCreateRequest(@NotBlank String kind,
                                          @NotBlank String name,
                                          String description,
                                          @NotNull BigDecimal price,
                                          String choiceGroupKey,
                                          boolean defaultSelected,
                                          Integer sortOrder) {}
}
