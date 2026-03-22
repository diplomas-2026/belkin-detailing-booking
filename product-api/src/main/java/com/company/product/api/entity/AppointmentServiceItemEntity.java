package com.company.product.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Entity
@Table(name = "appointment_service_items")
@Getter
@Setter
public class AppointmentServiceItemEntity {

    @EmbeddedId
    private Pk id = new Pk();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("appointmentId")
    @JoinColumn(name = "appointment_id", nullable = false)
    private AppointmentEntity appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("serviceItemId")
    @JoinColumn(name = "service_item_id", nullable = false)
    private ServiceItemEntity serviceItem;

    @Embeddable
    @Getter
    @Setter
    public static class Pk implements Serializable {
        @Column(name = "appointment_id")
        private Long appointmentId;

        @Column(name = "service_item_id")
        private Long serviceItemId;
    }
}

