package com.company.product.api.service;

import com.company.product.api.entity.AppointmentStatus;
import com.company.product.api.entity.Role;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
public class AppointmentWorkflowService {

    private static final Map<AppointmentStatus, Set<AppointmentStatus>> MASTER_TRANSITIONS = Map.of(
            AppointmentStatus.CONFIRMED, Set.of(AppointmentStatus.IN_PROGRESS),
            AppointmentStatus.IN_PROGRESS, Set.of(AppointmentStatus.COMPLETED)
    );

    private static final Map<AppointmentStatus, Set<AppointmentStatus>> ADMIN_TRANSITIONS = Map.of(
            AppointmentStatus.NEW, Set.of(AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED),
            AppointmentStatus.CONFIRMED, Set.of(AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED),
            AppointmentStatus.IN_PROGRESS, Set.of(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED)
    );

    public boolean canTransition(Role role, AppointmentStatus from, AppointmentStatus to) {
        return switch (role) {
            case MASTER -> MASTER_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
            case ADMIN -> ADMIN_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
            case CLIENT -> to == AppointmentStatus.CANCELLED &&
                    (from == AppointmentStatus.NEW || from == AppointmentStatus.CONFIRMED);
        };
    }
}
