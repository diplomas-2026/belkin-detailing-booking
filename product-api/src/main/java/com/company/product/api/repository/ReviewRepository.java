package com.company.product.api.repository;

import com.company.product.api.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    List<ReviewEntity> findByServiceAndModerationStatusOrderByCreatedAtDesc(ServiceEntity service, ReviewModerationStatus status);

    List<ReviewEntity> findByMasterAndModerationStatusOrderByCreatedAtDesc(MasterEntity master, ReviewModerationStatus status);

    List<ReviewEntity> findByWorkshopAndModerationStatusOrderByCreatedAtDesc(WorkshopEntity workshop, ReviewModerationStatus status);

    List<ReviewEntity> findByMasterOrderByCreatedAtDesc(MasterEntity master);

    boolean existsByAppointmentAndTargetTypeAndServiceAndMasterAndWorkshop(AppointmentEntity appointment,
                                                                           ReviewTargetType targetType,
                                                                           ServiceEntity service,
                                                                           MasterEntity master,
                                                                           WorkshopEntity workshop);

    long countByModerationStatus(ReviewModerationStatus status);

    List<ReviewEntity> findByModerationStatusOrderByCreatedAtDesc(ReviewModerationStatus status, Pageable pageable);

    List<ReviewEntity> findByClientOrderByCreatedAtDesc(UserEntity client);

    List<ReviewEntity> findByModerationStatus(ReviewModerationStatus status);

    List<ReviewEntity> findByTargetTypeAndModerationStatusOrderByCreatedAtDesc(ReviewTargetType targetType, ReviewModerationStatus status, Pageable pageable);

    ReviewEntity findTopByTargetTypeAndModerationStatusOrderByCreatedAtDesc(ReviewTargetType targetType, ReviewModerationStatus status);

    List<ReviewEntity> findByAppointmentAndClientOrderByCreatedAtDesc(AppointmentEntity appointment, UserEntity client);
}
