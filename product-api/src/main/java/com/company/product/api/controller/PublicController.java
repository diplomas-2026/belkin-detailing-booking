package com.company.product.api.controller;

import com.company.product.api.ai.ReviewModerationRules;
import com.company.product.api.ai.TargetFeedbackService;
import com.company.product.api.dto.FeedbackDtos;
import com.company.product.api.dto.MasterDtos;
import com.company.product.api.dto.PublicDtos;
import com.company.product.api.dto.ReviewDtos;
import com.company.product.api.dto.ServiceDtos;
import com.company.product.api.dto.WorkshopDtos;
import com.company.product.api.entity.AiFeedbackSummaryEntity;
import com.company.product.api.entity.AppointmentStatus;
import com.company.product.api.entity.MasterEntity;
import com.company.product.api.entity.ReviewModerationStatus;
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
    private final AiFeedbackSummaryRepository aiFeedbackSummaryRepository;
    private final TargetFeedbackService targetFeedbackService;
    private final DtoMapperService mapper;

    public PublicController(WorkshopRepository workshopRepository,
                            ServiceRepository serviceRepository,
                            MasterRepository masterRepository,
                            ReviewRepository reviewRepository,
                            AppointmentRepository appointmentRepository,
                            AiFeedbackSummaryRepository aiFeedbackSummaryRepository,
                            TargetFeedbackService targetFeedbackService,
                            DtoMapperService mapper) {
        this.workshopRepository = workshopRepository;
        this.serviceRepository = serviceRepository;
        this.masterRepository = masterRepository;
        this.reviewRepository = reviewRepository;
        this.appointmentRepository = appointmentRepository;
        this.aiFeedbackSummaryRepository = aiFeedbackSummaryRepository;
        this.targetFeedbackService = targetFeedbackService;
        this.mapper = mapper;
    }

    @GetMapping("/public/stats")
    public PublicDtos.PublicStatsView stats() {
        long workshops = workshopRepository.countByActiveTrue();
        long services = serviceRepository.countByActiveTrue();
        long appointments = appointmentRepository.count();
        long reviews = reviewRepository.countByModerationStatus(ReviewModerationStatus.APPROVED);
        return new PublicDtos.PublicStatsView(workshops, services, appointments, reviews);
    }

    @GetMapping("/public/reviews/recent")
    public List<ReviewDtos.ReviewView> recentReviews(@RequestParam(defaultValue = "12") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));
        return reviewRepository.findByModerationStatusOrderByCreatedAtDesc(ReviewModerationStatus.APPROVED, PageRequest.of(0, safeLimit))
                .stream()
                .map(mapper::toReviewView)
                .toList();
    }

    @GetMapping("/public/feedback")
    public List<FeedbackDtos.FeedbackSummaryView> feedback() {
        return aiFeedbackSummaryRepository.findAll().stream()
                .map(this::toView)
                .toList();
    }

    @GetMapping("/public/reviews/moderation-rules")
    public List<String> moderationRules() {
        return ReviewModerationRules.USER_RULES;
    }

    private FeedbackDtos.FeedbackSummaryView toView(AiFeedbackSummaryEntity e) {
        return new FeedbackDtos.FeedbackSummaryView(
                e.getTargetType(),
                e.getSummary(),
                e.getUpdatedAt(),
                e.getBasedOnReviewCreatedAt()
        );
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
        throw new BusinessException(HttpStatus.GONE, "Отзывы об услугах отключены");
    }

    @GetMapping("/masters/{id}/reviews")
    public List<ReviewDtos.ReviewView> masterReviews(@PathVariable Long id) {
        MasterEntity master = masterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        return reviewRepository.findByMasterAndModerationStatusOrderByCreatedAtDesc(master, ReviewModerationStatus.APPROVED).stream().map(mapper::toReviewView).toList();
    }

    @GetMapping("/masters/{id}")
    public MasterDtos.MasterView master(@PathVariable Long id) {
        MasterEntity master = masterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        return mapper.toMasterView(master);
    }

    @GetMapping("/workshops/{id}/reviews")
    public List<ReviewDtos.ReviewView> workshopReviews(@PathVariable Long id) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        return reviewRepository.findByWorkshopAndModerationStatusOrderByCreatedAtDesc(workshop, ReviewModerationStatus.APPROVED).stream().map(mapper::toReviewView).toList();
    }

    @GetMapping("/workshops/{id}/masters")
    public List<MasterDtos.MasterView> workshopMasters(@PathVariable Long id) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        return masterRepository.findByWorkshopAndActiveTrueOrderByIdAsc(workshop).stream().map(mapper::toMasterView).toList();
    }

    @GetMapping("/workshops/{id}/feedback")
    public FeedbackDtos.TargetFeedbackView workshopFeedback(@PathVariable Long id) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        String summary = targetFeedbackService.getWorkshopSummary(workshop.getId());
        return new FeedbackDtos.TargetFeedbackView(summary);
    }

    @GetMapping("/masters/{id}/feedback")
    public FeedbackDtos.TargetFeedbackView masterFeedback(@PathVariable Long id) {
        MasterEntity master = masterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        String summary = targetFeedbackService.getMasterSummary(master.getId());
        return new FeedbackDtos.TargetFeedbackView(summary);
    }
}
