package com.company.product.api.dto;

import com.company.product.api.entity.AppointmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AppointmentDtos {
    public record AppointmentView(Long id,
                                  Long workshopId,
                                  String workshopName,
                                  Long carId,
                                  String carLabel,
                                  Long serviceId,
                                  String serviceName,
                                  Long masterId,
                                  String masterName,
                                  LocalDateTime scheduledStart,
                                  LocalDateTime scheduledEnd,
                                  AppointmentStatus status,
                                  BigDecimal totalPrice,
                                  String clientComment,
                                  String resultComment) {}

    public record AppointmentCreateRequest(@NotNull Long workshopId,
                                           @NotNull Long carId,
                                           @NotNull Long serviceId,
                                           @NotNull LocalDateTime scheduledStart,
                                           String clientComment) {}

    public record AssignMasterRequest(@NotNull Long masterId) {}

    public record StatusChangeRequest(@NotNull AppointmentStatus status, String comment) {}

    public record CancelRequest(@NotBlank String reason) {}
}
