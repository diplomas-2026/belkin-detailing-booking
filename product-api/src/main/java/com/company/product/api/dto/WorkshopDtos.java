package com.company.product.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class WorkshopDtos {
    public record WorkshopPhotoView(Long id, String photoUrl, Integer sortOrder, boolean cover) {}

    public record WorkshopView(Long id,
                               String name,
                               String description,
                               String address,
                               String city,
                               Double latitude,
                               Double longitude,
                               String phone,
                               String workingHours,
                               boolean active,
                               List<WorkshopPhotoView> photos) {}

    public record WorkshopCreateRequest(@NotBlank String name,
                                        String description,
                                        @NotBlank String address,
                                        @NotBlank String city,
                                        @NotNull Double latitude,
                                        @NotNull Double longitude,
                                        String phone,
                                        String workingHours,
                                        boolean active) {}

    public record WorkshopPhotoCreateRequest(@NotBlank @Size(max = 500) String photoUrl,
                                             Integer sortOrder,
                                             boolean cover) {}
}
