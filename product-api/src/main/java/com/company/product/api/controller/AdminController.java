package com.company.product.api.controller;

import com.company.product.api.dto.*;
import com.company.product.api.entity.*;
import com.company.product.api.repository.*;
import com.company.product.api.ai.FeedbackSummaryService;
import com.company.product.api.ai.ReviewAiModerationService;
import com.company.product.api.ai.TargetFeedbackService;
import com.company.product.api.ai.TokenBudgetService;
import com.company.product.api.service.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final CurrentUserService currentUserService;
    private final WorkshopRepository workshopRepository;
    private final WorkshopPhotoRepository workshopPhotoRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final MasterRepository masterRepository;
    private final UserRepository userRepository;
    private final MasterShiftRepository masterShiftRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentStatusHistoryRepository appointmentStatusHistoryRepository;
    private final ReviewRepository reviewRepository;
    private final DtoMapperService mapper;
    private final AppointmentWorkflowService workflowService;
    private final ReviewAiModerationService moderationService;
    private final FeedbackSummaryService feedbackSummaryService;
    private final TargetFeedbackService targetFeedbackService;
    private final TokenBudgetService tokenBudgetService;

    public AdminController(CurrentUserService currentUserService,
                           WorkshopRepository workshopRepository,
                           WorkshopPhotoRepository workshopPhotoRepository,
                           ServiceRepository serviceRepository,
                           ServiceItemRepository serviceItemRepository,
                           MasterRepository masterRepository,
                           UserRepository userRepository,
                           MasterShiftRepository masterShiftRepository,
                           AppointmentRepository appointmentRepository,
                           AppointmentStatusHistoryRepository appointmentStatusHistoryRepository,
                           ReviewRepository reviewRepository,
                           DtoMapperService mapper,
                           AppointmentWorkflowService workflowService,
                           ReviewAiModerationService moderationService,
                           FeedbackSummaryService feedbackSummaryService,
                           TargetFeedbackService targetFeedbackService,
                           TokenBudgetService tokenBudgetService) {
        this.currentUserService = currentUserService;
        this.workshopRepository = workshopRepository;
        this.workshopPhotoRepository = workshopPhotoRepository;
        this.serviceRepository = serviceRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.masterRepository = masterRepository;
        this.userRepository = userRepository;
        this.masterShiftRepository = masterShiftRepository;
        this.appointmentRepository = appointmentRepository;
        this.appointmentStatusHistoryRepository = appointmentStatusHistoryRepository;
        this.reviewRepository = reviewRepository;
        this.mapper = mapper;
        this.workflowService = workflowService;
        this.moderationService = moderationService;
        this.feedbackSummaryService = feedbackSummaryService;
        this.targetFeedbackService = targetFeedbackService;
        this.tokenBudgetService = tokenBudgetService;
    }

    @GetMapping("/workshops")
    public List<WorkshopDtos.WorkshopView> workshops() {
        return workshopRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream().map(mapper::toWorkshopView).toList();
    }

    @PostMapping("/workshops")
    public WorkshopDtos.WorkshopView createWorkshop(@Valid @RequestBody WorkshopDtos.WorkshopCreateRequest request) {
        WorkshopEntity workshop = new WorkshopEntity();
        applyWorkshop(workshop, request);
        return mapper.toWorkshopView(workshopRepository.save(workshop));
    }

    @PutMapping("/workshops/{id}")
    public WorkshopDtos.WorkshopView updateWorkshop(@PathVariable Long id, @Valid @RequestBody WorkshopDtos.WorkshopCreateRequest request) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        applyWorkshop(workshop, request);
        return mapper.toWorkshopView(workshopRepository.save(workshop));
    }

    @PostMapping("/workshops/{id}/photos")
    public WorkshopDtos.WorkshopPhotoView addPhoto(@PathVariable Long id,
                                                    @Valid @RequestBody WorkshopDtos.WorkshopPhotoCreateRequest request) {
        WorkshopEntity workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        WorkshopPhotoEntity photo = new WorkshopPhotoEntity();
        photo.setWorkshop(workshop);
        photo.setPhotoUrl(request.photoUrl());
        photo.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        photo.setCover(request.cover());
        WorkshopPhotoEntity saved = workshopPhotoRepository.save(photo);
        return new WorkshopDtos.WorkshopPhotoView(saved.getId(), saved.getPhotoUrl(), saved.getSortOrder(), saved.isCover());
    }

    @DeleteMapping("/workshops/{id}/photos/{photoId}")
    public void deletePhoto(@PathVariable Long id, @PathVariable Long photoId) {
        WorkshopPhotoEntity photo = workshopPhotoRepository.findById(photoId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Фото не найдено"));
        if (!photo.getWorkshop().getId().equals(id)) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Фото не принадлежит указанной точке");
        }
        workshopPhotoRepository.delete(photo);
    }

    @PostMapping("/services")
    public ServiceDtos.ServiceView createService(@Valid @RequestBody ServiceDtos.ServiceCreateRequest request) {
        ServiceEntity service = new ServiceEntity();
        applyService(service, request);
        return mapper.toServiceView(serviceRepository.save(service));
    }

    @PutMapping("/services/{id}")
    public ServiceDtos.ServiceView updateService(@PathVariable Long id, @Valid @RequestBody ServiceDtos.ServiceCreateRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));
        applyService(service, request);
        return mapper.toServiceView(serviceRepository.save(service));
    }

    @GetMapping("/services")
    public List<ServiceDtos.ServiceView> services() {
        return serviceRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream().map(mapper::toServiceView).toList();
    }

    @GetMapping("/services/{id}/items")
    public List<ServiceDtos.ServiceItemView> serviceItems(@PathVariable Long id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));
        return serviceItemRepository.findByServiceOrderBySortOrderAscIdAsc(service).stream().map(mapper::toServiceItemView).toList();
    }

    @PostMapping("/services/{id}/items")
    public ServiceDtos.ServiceItemView createItem(@PathVariable Long id, @Valid @RequestBody ServiceDtos.ServiceItemCreateRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));

        ServiceItemKind kind;
        try {
            kind = ServiceItemKind.fromExternal(request.kind());
        } catch (Exception e) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Некорректный тип пункта услуги");
        }

        ServiceItemEntity item = new ServiceItemEntity();
        item.setService(service);
        item.setKind(kind);
        item.setName(request.name());
        item.setDescription(request.description());
        item.setPrice(request.price());
        item.setChoiceGroupKey(request.choiceGroupKey());
        item.setDefaultSelected(request.defaultSelected());
        item.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());

        ServiceItemEntity saved = serviceItemRepository.save(item);
        return mapper.toServiceItemView(saved);
    }

    @DeleteMapping("/services/{serviceId}/items/{itemId}")
    public void deleteItem(@PathVariable Long serviceId, @PathVariable Long itemId) {
        ServiceItemEntity item = serviceItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Пункт услуги не найден"));
        if (!item.getService().getId().equals(serviceId)) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Пункт не принадлежит услуге");
        }
        serviceItemRepository.delete(item);
    }

    @PatchMapping("/services/{id}/active")
    public ServiceDtos.ServiceView setServiceActive(@PathVariable Long id, @RequestBody ServiceDtos.ServiceCreateRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));
        service.setActive(request.active());
        return mapper.toServiceView(serviceRepository.save(service));
    }

    @GetMapping("/appointments")
    public List<AppointmentDtos.AppointmentView> appointments() {
        return appointmentRepository.findAll(Sort.by(Sort.Direction.DESC, "scheduledStart")).stream().map(mapper::toAppointmentView).toList();
    }

    @GetMapping("/appointments/{id}")
    public AppointmentDtos.AppointmentView appointment(@PathVariable Long id) {
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));
        return mapper.toAppointmentView(appointment);
    }

    @PatchMapping("/appointments/{id}/assign-master")
    public AppointmentDtos.AppointmentView assignMaster(@PathVariable Long id,
                                                        @Valid @RequestBody AppointmentDtos.AssignMasterRequest request) {
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));
        MasterEntity master = masterRepository.findById(request.masterId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));

        if (!master.getWorkshop().getId().equals(appointment.getWorkshop().getId())) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Мастер и запись из разных точек");
        }

        appointment.setMaster(master);
        return mapper.toAppointmentView(appointmentRepository.save(appointment));
    }

    @PatchMapping("/appointments/{id}/status")
    public AppointmentDtos.AppointmentView adminStatus(@PathVariable Long id,
                                                       @Valid @RequestBody AppointmentDtos.StatusChangeRequest request) {
        UserEntity admin = currentUserService.requireUser();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        if (!workflowService.canTransition(Role.ADMIN, appointment.getStatus(), request.status())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Недопустимый переход статуса");
        }

        AppointmentStatus previous = appointment.getStatus();
        appointment.setStatus(request.status());
        AppointmentEntity saved = appointmentRepository.save(appointment);

        AppointmentStatusHistoryEntity history = new AppointmentStatusHistoryEntity();
        history.setAppointment(saved);
        history.setFromStatus(previous);
        history.setToStatus(request.status());
        history.setChangedBy(admin);
        history.setComment(request.comment());
        appointmentStatusHistoryRepository.save(history);
        return mapper.toAppointmentView(saved);
    }

    @PostMapping("/masters")
    public MasterDtos.MasterView createMaster(@Valid @RequestBody MasterDtos.MasterCreateRequest request) {
        MasterEntity master = new MasterEntity();
        applyMaster(master, request);
        return mapper.toMasterView(masterRepository.save(master));
    }

    @GetMapping("/masters")
    public List<MasterDtos.MasterView> masters() {
        return masterRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream().map(mapper::toMasterView).toList();
    }

    @PutMapping("/masters/{id}")
    public MasterDtos.MasterView updateMaster(@PathVariable Long id, @Valid @RequestBody MasterDtos.MasterCreateRequest request) {
        MasterEntity master = masterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        applyMaster(master, request);
        return mapper.toMasterView(masterRepository.save(master));
    }

    @PostMapping("/masters/shifts")
    public MasterShiftEntity createShift(@Valid @RequestBody MasterShiftEntity request) {
        MasterEntity master = masterRepository.findById(request.getMaster().getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        request.setMaster(master);
        return masterShiftRepository.save(request);
    }

    @GetMapping("/reviews")
    public List<ReviewDtos.ReviewView> reviews() {
        return reviewRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().map(mapper::toReviewView).toList();
    }

    @GetMapping("/ai/budget")
    public AiDtos.TokenBudgetView budget() {
        TokenBudgetService.TokenBudgetView b = tokenBudgetService.getBudget();
        return new AiDtos.TokenBudgetView(b.date(), b.limit(), b.used(), b.remaining());
    }

    @PostMapping("/ai/moderation/run")
    public AiDtos.RunResult runModeration() {
        ReviewAiModerationService.ModerationRunResult result = moderationService.runOnce();
        TokenBudgetService.TokenBudgetView b = tokenBudgetService.getBudget();
        return new AiDtos.RunResult("moderation", result.processed(), result.llmCalls(), result.note(),
                new AiDtos.TokenBudgetView(b.date(), b.limit(), b.used(), b.remaining()));
    }

    @PostMapping("/ai/feedback/run")
    public AiDtos.RunResult runFeedback() {
        FeedbackSummaryService.FeedbackRunResult result = feedbackSummaryService.updateIfNeeded();
        TokenBudgetService.TokenBudgetView b = tokenBudgetService.getBudget();
        return new AiDtos.RunResult("feedback", result.updated(), result.llmCalls(), result.note(),
                new AiDtos.TokenBudgetView(b.date(), b.limit(), b.used(), b.remaining()));
    }

    @PostMapping("/ai/run")
    public List<AiDtos.RunResult> runAll() {
        return List.of(runModeration(), runFeedback());
    }

    @PostMapping("/ai/feedback/workshops/{id}/run")
    public AiDtos.RunResult runWorkshopFeedback(@PathVariable Long id) {
        TargetFeedbackService.RunResult result = targetFeedbackService.updateWorkshop(id, true);
        TokenBudgetService.TokenBudgetView b = tokenBudgetService.getBudget();
        return new AiDtos.RunResult("feedback:workshop", result.updated(), result.llmCalls(), result.note(),
                new AiDtos.TokenBudgetView(b.date(), b.limit(), b.used(), b.remaining()));
    }

    @PostMapping("/ai/feedback/masters/{id}/run")
    public AiDtos.RunResult runMasterFeedback(@PathVariable Long id) {
        TargetFeedbackService.RunResult result = targetFeedbackService.updateMaster(id, true);
        TokenBudgetService.TokenBudgetView b = tokenBudgetService.getBudget();
        return new AiDtos.RunResult("feedback:master", result.updated(), result.llmCalls(), result.note(),
                new AiDtos.TokenBudgetView(b.date(), b.limit(), b.used(), b.remaining()));
    }

    @GetMapping("/dashboard")
    public DashboardDtos.DashboardView dashboard() {
        List<AppointmentEntity> appointments = appointmentRepository.findAll();
        long total = appointments.size();
        long inProgress = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS).count();
        long completed = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long created = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.NEW).count();
        BigDecimal revenue = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .map(AppointmentEntity::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardDtos.DashboardView(total, created, inProgress, completed, revenue);
    }

    @GetMapping("/analytics/appointments/daily")
    public List<DashboardDtos.DailyAppointmentsView> daily(@RequestParam(defaultValue = "30") int days) {
        int safeDays = Math.max(7, Math.min(days, 120));
        ZoneId zone = ZoneId.of("Europe/Samara");
        LocalDate to = LocalDate.now(zone);
        LocalDate from = to.minusDays(safeDays - 1L);

        Map<LocalDate, Acc> acc = new HashMap<>();
        for (AppointmentEntity a : appointmentRepository.findAll()) {
            LocalDate d = a.getScheduledStart().toLocalDate();
            if (d.isBefore(from) || d.isAfter(to)) continue;
            Acc x = acc.computeIfAbsent(d, k -> new Acc());
            switch (a.getStatus()) {
                case NEW -> x.newCount++;
                case CONFIRMED -> x.confirmedCount++;
                case IN_PROGRESS -> x.inProgressCount++;
                case COMPLETED -> {
                    x.completedCount++;
                    x.revenue = x.revenue.add(a.getTotalPrice());
                }
                case CANCELLED -> x.cancelledCount++;
            }
        }

        List<DashboardDtos.DailyAppointmentsView> out = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            Acc x = acc.getOrDefault(d, new Acc());
            out.add(new DashboardDtos.DailyAppointmentsView(d, x.newCount, x.confirmedCount, x.inProgressCount, x.completedCount, x.cancelledCount, x.revenue));
        }
        out.sort(Comparator.comparing(DashboardDtos.DailyAppointmentsView::date));
        return out;
    }

    private static class Acc {
        long newCount;
        long confirmedCount;
        long inProgressCount;
        long completedCount;
        long cancelledCount;
        BigDecimal revenue = BigDecimal.ZERO;
    }

    private void applyWorkshop(WorkshopEntity workshop, WorkshopDtos.WorkshopCreateRequest request) {
        workshop.setName(request.name());
        workshop.setDescription(request.description());
        workshop.setAddress(request.address());
        workshop.setCity(request.city());
        workshop.setLatitude(request.latitude());
        workshop.setLongitude(request.longitude());
        workshop.setPhone(request.phone());
        workshop.setWorkingHours(request.workingHours());
        workshop.setActive(request.active());
    }

    private void applyService(ServiceEntity service, ServiceDtos.ServiceCreateRequest request) {
        WorkshopEntity workshop = workshopRepository.findById(request.workshopId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        service.setWorkshop(workshop);
        service.setName(request.name());
        service.setDescription(request.description());
        service.setDurationMinutes(request.durationMinutes());
        service.setPrice(request.price());
        service.setActive(request.active());
    }

    private void applyMaster(MasterEntity master, MasterDtos.MasterCreateRequest request) {
        UserEntity user = userRepository.findById(request.userId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        WorkshopEntity workshop = workshopRepository.findById(request.workshopId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));

        if (user.getRole() != Role.MASTER) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Пользователь не имеет роль MASTER");
        }

        master.setUser(user);
        master.setWorkshop(workshop);
        master.setSpecialization(request.specialization());
        master.setPhotoUrl(request.photoUrl());
        master.setExperienceYears(request.experienceYears());
        master.setActive(request.active());
    }
}
