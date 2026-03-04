package com.company.product.api.repository;

import com.company.product.api.entity.WorkshopEntity;
import com.company.product.api.entity.WorkshopPhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkshopPhotoRepository extends JpaRepository<WorkshopPhotoEntity, Long> {
    List<WorkshopPhotoEntity> findByWorkshopOrderBySortOrderAsc(WorkshopEntity workshop);
}
