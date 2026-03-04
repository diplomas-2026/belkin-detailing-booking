package com.company.product.api.dto;

import java.math.BigDecimal;

public class DashboardDtos {
    public record DashboardView(long totalAppointments,
                                long newAppointments,
                                long inProgressAppointments,
                                long completedAppointments,
                                BigDecimal revenue) {}
}
