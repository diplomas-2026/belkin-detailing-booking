package com.company.product.api.repository;

import com.company.product.api.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    List<AppointmentEntity> findByClientOrderByScheduledStartDesc(UserEntity client);

    List<AppointmentEntity> findByMasterOrderByScheduledStartDesc(MasterEntity master);

    List<AppointmentEntity> findByWorkshopOrderByScheduledStartDesc(WorkshopEntity workshop);

    List<AppointmentEntity> findByStatusInAndMasterAndScheduledEndAfter(List<AppointmentStatus> statuses, MasterEntity master, LocalDateTime start);

    boolean existsByClientAndScheduledStart(UserEntity client, LocalDateTime scheduledStart);

    long countByWorkshopAndStatus(WorkshopEntity workshop, AppointmentStatus status);
}
