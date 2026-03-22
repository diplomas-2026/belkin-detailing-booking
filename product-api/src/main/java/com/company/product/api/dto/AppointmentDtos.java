package com.company.product.api.dto;

import com.company.product.api.entity.AppointmentStatus;
import com.company.product.api.entity.PaymentMethod;
import com.company.product.api.entity.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AppointmentDtos {
    public record AppointmentServiceView(Long id, String name, Integer durationMinutes, BigDecimal price) {}

    public record AppointmentSelectedItemView(Long id,
                                              Long serviceId,
                                              String serviceName,
                                              String kind,
                                              String name,
                                              BigDecimal price,
                                              String choiceGroupKey) {}

    public record AppointmentView(Long id,
                                  Long workshopId,
                                  String workshopName,
                                  Long carId,
                                  String carLabel,
                                  Long serviceId,
                                  String serviceName,
                                  List<AppointmentServiceView> services,
                                  List<AppointmentSelectedItemView> selectedItems,
                                  Long masterId,
                                  String masterName,
                                  LocalDateTime scheduledStart,
                                  LocalDateTime scheduledEnd,
                                  AppointmentStatus status,
                                  PaymentStatus paymentStatus,
                                  PaymentMethod paymentMethod,
                                  BigDecimal totalPrice,
                                  String clientComment,
                                  String resultComment) {}

    public record ServiceSelectionRequest(@NotNull Long serviceId, List<Long> selectedItemIds) {}

    public record AppointmentCreateRequest(@NotNull Long workshopId,
                                           @NotNull Long carId,
                                           Long serviceId,
                                           List<Long> serviceIds,
                                           List<ServiceSelectionRequest> selections,
                                           @NotNull LocalDateTime scheduledStart,
                                           String clientComment) {}

    public record AssignMasterRequest(@NotNull Long masterId) {}

    public record StatusChangeRequest(@NotNull AppointmentStatus status, String comment) {}

    public record CancelRequest(@NotBlank String reason) {}

    public record PayNowRequest(@NotBlank String cardNumber,
                                @NotBlank String exp,
                                @NotBlank String cvc,
                                @NotBlank String holder) {}
}
