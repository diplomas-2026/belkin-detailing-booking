package com.company.product.api.dto;

public class PublicDtos {
    public record PublicStatsView(long workshops,
                                  long services,
                                  long appointments,
                                  long reviews) {
    }

    public record WorkshopStatsView(long completedAppointments) {
    }
}
