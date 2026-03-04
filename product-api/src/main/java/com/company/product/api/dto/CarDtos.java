package com.company.product.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CarDtos {
    public record CarView(Long id, String brand, String model, Integer year, String plateNumber, String color, String notes) {}

    public record CarCreateRequest(@NotBlank String brand,
                                   @NotBlank String model,
                                   @NotNull @Min(1990) @Max(2100) Integer year,
                                   @NotBlank String plateNumber,
                                   String color,
                                   String notes) {}
}
