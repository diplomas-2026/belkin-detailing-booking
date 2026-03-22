package com.company.product.api.repository;

import com.company.product.api.entity.AiTokenUsageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface AiTokenUsageRepository extends JpaRepository<AiTokenUsageEntity, LocalDate> {
}

