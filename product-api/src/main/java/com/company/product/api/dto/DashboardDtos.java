package com.company.product.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DashboardDtos {
    public record DashboardView(long totalAppointments,
                                long newAppointments,
                                long inProgressAppointments,
                                long completedAppointments,
                                BigDecimal revenue) {}

    public record DailyAppointmentsView(LocalDate date,
                                        long newCount,
                                        long confirmedCount,
                                        long inProgressCount,
                                        long completedCount,
                                        long cancelledCount,
                                        BigDecimal revenue) {}
}
