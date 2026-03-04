package com.company.product.api.service;

import com.company.product.api.entity.AppointmentStatus;
import com.company.product.api.entity.Role;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AppointmentWorkflowServiceTest {

    private final AppointmentWorkflowService service = new AppointmentWorkflowService();

    @Test
    void masterCanMoveConfirmedToInProgress() {
        assertThat(service.canTransition(Role.MASTER, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS)).isTrue();
    }

    @Test
    void masterCannotCancel() {
        assertThat(service.canTransition(Role.MASTER, AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED)).isFalse();
    }

    @Test
    void clientCanCancelNew() {
        assertThat(service.canTransition(Role.CLIENT, AppointmentStatus.NEW, AppointmentStatus.CANCELLED)).isTrue();
    }
}
