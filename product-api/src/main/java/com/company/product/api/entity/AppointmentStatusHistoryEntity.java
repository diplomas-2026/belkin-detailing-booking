package com.company.product.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_status_history")
@Getter
@Setter
public class AppointmentStatusHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private AppointmentEntity appointment;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    private AppointmentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false)
    private AppointmentStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private UserEntity changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    private String comment;

    @PrePersist
    public void onCreate() {
        this.changedAt = LocalDateTime.now();
    }
}
