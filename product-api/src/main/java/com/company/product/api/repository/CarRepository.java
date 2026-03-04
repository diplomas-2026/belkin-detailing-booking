package com.company.product.api.repository;

import com.company.product.api.entity.CarEntity;
import com.company.product.api.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CarRepository extends JpaRepository<CarEntity, Long> {
    List<CarEntity> findByClientOrderByIdDesc(UserEntity client);
}
