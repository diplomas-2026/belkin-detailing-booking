package com.company.product.api.repository;

import com.company.product.api.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    List<ReviewEntity> findByServiceAndVisibleTrueOrderByCreatedAtDesc(ServiceEntity service);

    List<ReviewEntity> findByMasterAndVisibleTrueOrderByCreatedAtDesc(MasterEntity master);

    List<ReviewEntity> findByWorkshopAndVisibleTrueOrderByCreatedAtDesc(WorkshopEntity workshop);

    List<ReviewEntity> findByMasterOrderByCreatedAtDesc(MasterEntity master);

    boolean existsByAppointmentAndTargetTypeAndServiceAndMasterAndWorkshop(AppointmentEntity appointment,
                                                                           ReviewTargetType targetType,
                                                                           ServiceEntity service,
                                                                           MasterEntity master,
                                                                           WorkshopEntity workshop);
}
