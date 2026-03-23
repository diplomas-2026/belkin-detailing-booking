package com.company.product.api.controller;

import com.company.product.api.dto.AppointmentDtos;
import com.company.product.api.dto.ReviewDtos;
import com.company.product.api.entity.*;
import com.company.product.api.repository.AppointmentRepository;
import com.company.product.api.repository.AppointmentStatusHistoryRepository;
import com.company.product.api.repository.MasterRepository;
import com.company.product.api.repository.ReviewRepository;
import com.company.product.api.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/master")
@PreAuthorize("hasRole('MASTER')")
public class MasterController {

    private final CurrentUserService currentUserService;
    private final MasterRepository masterRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentStatusHistoryRepository appointmentStatusHistoryRepository;
    private final ReviewRepository reviewRepository;
    private final DtoMapperService mapper;
    private final AppointmentWorkflowService workflowService;

    public MasterController(CurrentUserService currentUserService,
                            MasterRepository masterRepository,
                            AppointmentRepository appointmentRepository,
                            AppointmentStatusHistoryRepository appointmentStatusHistoryRepository,
                            ReviewRepository reviewRepository,
                            DtoMapperService mapper,
                            AppointmentWorkflowService workflowService) {
        this.currentUserService = currentUserService;
        this.masterRepository = masterRepository;
        this.appointmentRepository = appointmentRepository;
        this.appointmentStatusHistoryRepository = appointmentStatusHistoryRepository;
        this.reviewRepository = reviewRepository;
        this.mapper = mapper;
        this.workflowService = workflowService;
    }

    @GetMapping("/appointments")
    public List<AppointmentDtos.AppointmentView> myAppointments() {
        MasterEntity master = findCurrentMaster();
        return appointmentRepository.findByMasterOrderByScheduledStartDesc(master).stream().map(mapper::toAppointmentView).toList();
    }

    @GetMapping("/appointments/{id}")
    public AppointmentDtos.AppointmentView appointment(@PathVariable Long id) {
        MasterEntity master = findCurrentMaster();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));
        if (appointment.getMaster() == null || !appointment.getMaster().getId().equals(master.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Запись не назначена текущему мастеру");
        }
        return mapper.toAppointmentView(appointment);
    }

    @PatchMapping("/appointments/{id}/status")
    public AppointmentDtos.AppointmentView changeStatus(@PathVariable Long id,
                                                        @Valid @RequestBody AppointmentDtos.StatusChangeRequest request) {
        UserEntity user = currentUserService.requireUser();
        MasterEntity master = findCurrentMaster();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        if (appointment.getMaster() == null || !appointment.getMaster().getId().equals(master.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Запись не назначена текущему мастеру");
        }

        if (!workflowService.canTransition(Role.MASTER, appointment.getStatus(), request.status())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Недопустимый переход статуса");
        }

        AppointmentStatus previous = appointment.getStatus();
        appointment.setStatus(request.status());
        AppointmentEntity saved = appointmentRepository.save(appointment);

        AppointmentStatusHistoryEntity history = new AppointmentStatusHistoryEntity();
        history.setAppointment(saved);
        history.setFromStatus(previous);
        history.setToStatus(request.status());
        history.setChangedBy(user);
        history.setComment(request.comment());
        appointmentStatusHistoryRepository.save(history);

        return mapper.toAppointmentView(saved);
    }

    @GetMapping("/reviews/me")
    public List<ReviewDtos.ReviewView> myReviews() {
        MasterEntity master = findCurrentMaster();
        return reviewRepository.findByMasterOrderByCreatedAtDesc(master).stream().map(mapper::toReviewView).toList();
    }

    private MasterEntity findCurrentMaster() {
        UserEntity user = currentUserService.requireUser();
        return masterRepository.findByUser(user)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Профиль мастера не найден"));
    }
}
