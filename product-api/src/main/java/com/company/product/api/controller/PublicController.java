package com.company.product.api.controller;

import com.company.product.api.dto.PublicDtos;
import com.company.product.api.dto.ReviewDtos;
import com.company.product.api.dto.ServiceDtos;
import com.company.product.api.dto.WorkshopDtos;
import com.company.product.api.entity.AppointmentStatus;
import com.company.product.api.entity.MasterEntity;
import com.company.product.api.entity.ServiceEntity;
import com.company.product.api.entity.WorkshopEntity;
import com.company.product.api.repository.*;
import com.company.product.api.service.BusinessException;
import com.company.product.api.service.DtoMapperService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PublicController {

    private final WorkshopRepository workshopRepository;
    private final ServiceRepository serviceRepository;
    private final MasterRepository masterRepository;
    private final ReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final DtoMapperService mapper;

    public PublicController(WorkshopRepository workshopRepository,
                            ServiceRepository serviceRepository,
                            MasterRepository masterRepository,
                            ReviewRepository reviewRepository,
                            AppointmentRepository appointmentRepository,
                            DtoMapperService mapper) {
        this.workshopRepository = workshopRepository;
        this.serviceRepository = serviceRepository;
        this.masterRepository = masterRepository;
        this.reviewRepository = reviewRepository;
        this.appointmentRepository = appointmentRepository;
        this.mapper = mapper;
    }

    @GetMapping("/public/stats")
    public PublicDtos.PublicStatsView stats() {
        long workshops = workshopRepository.countByActiveTrue();
        long services = serviceRepository.countByActiveTrue();
        long appointments = appointmentRepository.count();
        long reviews = reviewRepository.countByVisibleTrue();
        return new PublicDtos.PublicStatsView(workshops, services, appointments, reviews);
    }

    @GetMapping("/public/reviews/recent")
    public List<ReviewDtos.ReviewView> recentReviews(@RequestParam(defaultValue = "12") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));
        return reviewRepository.findByVisibleTrueOrderByCreatedAtDesc(PageRequest.of(0, safeLimit))
                .stream()
                .map(mapper::toReviewView)
                .toList();
    }

    @GetMapping("/workshops")
    public List<WorkshopDtos.WorkshopView> workshops() {
        return workshopRepository.findByActiveTrueOrderByNameAsc().stream().map(mapper::toWorkshopView).toList();
    }

    @GetMapping("/workshops/{id}")
    public WorkshopDtos.WorkshopView workshop(@PathVariable Long id) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        return mapper.toWorkshopView(workshop);
    }

    @GetMapping("/workshops/{id}/stats")
    public PublicDtos.WorkshopStatsView workshopStats(@PathVariable Long id) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        long completed = appointmentRepository.countByWorkshopAndStatus(workshop, AppointmentStatus.COMPLETED);
        return new PublicDtos.WorkshopStatsView(completed);
    }

    @GetMapping("/workshops/{id}/services")
    public List<ServiceDtos.ServiceView> workshopServices(@PathVariable Long id) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        return serviceRepository.findByWorkshopAndActiveTrueOrderByNameAsc(workshop).stream().map(mapper::toServiceView).toList();
    }

    @GetMapping("/services")
    public List<ServiceDtos.ServiceView> services() {
        return serviceRepository.findAll().stream()
                .filter(ServiceEntity::isActive)
                .map(mapper::toServiceView)
                .toList();
    }

    @GetMapping("/services/{id}/reviews")
    public List<ReviewDtos.ReviewView> serviceReviews(@PathVariable Long id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));
        return reviewRepository.findByServiceAndVisibleTrueOrderByCreatedAtDesc(service).stream().map(mapper::toReviewView).toList();
    }

    @GetMapping("/masters/{id}/reviews")
    public List<ReviewDtos.ReviewView> masterReviews(@PathVariable Long id) {
        MasterEntity master = masterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        return reviewRepository.findByMasterAndVisibleTrueOrderByCreatedAtDesc(master).stream().map(mapper::toReviewView).toList();
    }

    @GetMapping("/workshops/{id}/reviews")
    public List<ReviewDtos.ReviewView> workshopReviews(@PathVariable Long id) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        return reviewRepository.findByWorkshopAndVisibleTrueOrderByCreatedAtDesc(workshop).stream().map(mapper::toReviewView).toList();
    }
}
