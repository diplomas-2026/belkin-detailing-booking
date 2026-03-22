package com.company.product.api.repository;

import com.company.product.api.entity.AiFeedbackSummaryEntity;
import com.company.product.api.entity.ReviewTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiFeedbackSummaryRepository extends JpaRepository<AiFeedbackSummaryEntity, ReviewTargetType> {
}

