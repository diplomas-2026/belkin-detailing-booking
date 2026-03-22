package com.company.product.api.repository;

import com.company.product.api.entity.ServiceEntity;
import com.company.product.api.entity.ServiceItemEntity;
import com.company.product.api.entity.ServiceItemKind;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceItemRepository extends JpaRepository<ServiceItemEntity, Long> {
    List<ServiceItemEntity> findByServiceOrderBySortOrderAscIdAsc(ServiceEntity service);

    Optional<ServiceItemEntity> findByServiceAndKindAndNameAndChoiceGroupKey(ServiceEntity service,
                                                                            ServiceItemKind kind,
                                                                            String name,
                                                                            String choiceGroupKey);
}

