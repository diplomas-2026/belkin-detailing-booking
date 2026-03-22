package com.company.product.api.repository;

import com.company.product.api.entity.ServiceEntity;
import com.company.product.api.entity.WorkshopEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
    List<ServiceEntity> findByWorkshopAndActiveTrueOrderByNameAsc(WorkshopEntity workshop);

    Optional<ServiceEntity> findByWorkshopAndName(WorkshopEntity workshop, String name);

    long countByActiveTrue();
}
