package com.company.product.api.repository;

import com.company.product.api.entity.AppointmentEntity;
import com.company.product.api.entity.AppointmentServiceItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentServiceItemRepository extends JpaRepository<AppointmentServiceItemEntity, AppointmentServiceItemEntity.Pk> {
    List<AppointmentServiceItemEntity> findByAppointment(AppointmentEntity appointment);

    void deleteByAppointment(AppointmentEntity appointment);
}

