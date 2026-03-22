package com.company.product.api.repository;

import com.company.product.api.entity.WorkshopEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkshopRepository extends JpaRepository<WorkshopEntity, Long> {
    List<WorkshopEntity> findByActiveTrueOrderByNameAsc();

    Optional<WorkshopEntity> findByName(String name);

    long countByActiveTrue();
}
