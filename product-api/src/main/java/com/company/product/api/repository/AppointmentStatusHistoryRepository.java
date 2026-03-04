package com.company.product.api.repository;

import com.company.product.api.entity.AppointmentStatusHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentStatusHistoryRepository extends JpaRepository<AppointmentStatusHistoryEntity, Long> {
}
