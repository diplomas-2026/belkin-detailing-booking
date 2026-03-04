package com.company.product.api.repository;

import com.company.product.api.entity.MasterEntity;
import com.company.product.api.entity.MasterShiftEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MasterShiftRepository extends JpaRepository<MasterShiftEntity, Long> {
    List<MasterShiftEntity> findByMasterAndShiftDate(MasterEntity master, LocalDate shiftDate);
}
