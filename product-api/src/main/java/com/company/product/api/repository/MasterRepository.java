package com.company.product.api.repository;

import com.company.product.api.entity.MasterEntity;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.entity.WorkshopEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterRepository extends JpaRepository<MasterEntity, Long> {
    Optional<MasterEntity> findByUser(UserEntity user);

    List<MasterEntity> findByWorkshopAndActiveTrueOrderByIdAsc(WorkshopEntity workshop);
}
