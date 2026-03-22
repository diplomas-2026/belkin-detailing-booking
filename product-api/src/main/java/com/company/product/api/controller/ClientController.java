package com.company.product.api.controller;

import com.company.product.api.dto.AppointmentDtos;
import com.company.product.api.dto.CarDtos;
import com.company.product.api.dto.ReviewDtos;
import com.company.product.api.entity.*;
import com.company.product.api.repository.*;
import com.company.product.api.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1")
public class ClientController {

    private final CurrentUserService currentUserService;
    private final CarRepository carRepository;
    private final WorkshopRepository workshopRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final AppointmentServiceItemRepository appointmentServiceItemRepository;
    private final MasterRepository masterRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentStatusHistoryRepository appointmentStatusHistoryRepository;
    private final ReviewRepository reviewRepository;
    private final DtoMapperService mapper;
    private final AppointmentWorkflowService workflowService;

    public ClientController(CurrentUserService currentUserService,
                            CarRepository carRepository,
                            WorkshopRepository workshopRepository,
                            ServiceRepository serviceRepository,
                            ServiceItemRepository serviceItemRepository,
                            AppointmentServiceItemRepository appointmentServiceItemRepository,
                            MasterRepository masterRepository,
                            AppointmentRepository appointmentRepository,
                            AppointmentStatusHistoryRepository appointmentStatusHistoryRepository,
                            ReviewRepository reviewRepository,
                            DtoMapperService mapper,
                            AppointmentWorkflowService workflowService) {
        this.currentUserService = currentUserService;
        this.carRepository = carRepository;
        this.workshopRepository = workshopRepository;
        this.serviceRepository = serviceRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.appointmentServiceItemRepository = appointmentServiceItemRepository;
        this.masterRepository = masterRepository;
        this.appointmentRepository = appointmentRepository;
        this.appointmentStatusHistoryRepository = appointmentStatusHistoryRepository;
        this.reviewRepository = reviewRepository;
        this.mapper = mapper;
        this.workflowService = workflowService;
    }

    @GetMapping("/cars/my")
    @PreAuthorize("hasRole('CLIENT')")
    public List<CarDtos.CarView> myCars() {
        UserEntity user = currentUserService.requireUser();
        return carRepository.findByClientOrderByIdDesc(user).stream().map(mapper::toCarView).toList();
    }

    @PostMapping("/cars")
    @PreAuthorize("hasRole('CLIENT')")
    public CarDtos.CarView createCar(@Valid @RequestBody CarDtos.CarCreateRequest request) {
        UserEntity user = currentUserService.requireUser();
        CarEntity car = new CarEntity();
        car.setClient(user);
        car.setBrand(request.brand());
        car.setModel(request.model());
        car.setYear(request.year());
        car.setPlateNumber(request.plateNumber().toUpperCase());
        car.setColor(request.color());
        car.setNotes(request.notes());
        return mapper.toCarView(carRepository.save(car));
    }

    @GetMapping("/cars/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public CarDtos.CarView car(@PathVariable Long id) {
        UserEntity user = currentUserService.requireUser();
        CarEntity car = carRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Автомобиль не найден"));
        if (!car.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к автомобилю");
        }
        return mapper.toCarView(car);
    }

    @PutMapping("/cars/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public CarDtos.CarView updateCar(@PathVariable Long id, @Valid @RequestBody CarDtos.CarCreateRequest request) {
        UserEntity user = currentUserService.requireUser();
        CarEntity car = carRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Автомобиль не найден"));
        if (!car.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к автомобилю");
        }
        car.setBrand(request.brand());
        car.setModel(request.model());
        car.setYear(request.year());
        car.setPlateNumber(request.plateNumber().toUpperCase());
        car.setColor(request.color());
        car.setNotes(request.notes());
        return mapper.toCarView(carRepository.save(car));
    }

    @DeleteMapping("/cars/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public void deleteCar(@PathVariable Long id) {
        UserEntity user = currentUserService.requireUser();
        CarEntity car = carRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Автомобиль не найден"));
        if (!car.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к автомобилю");
        }
        carRepository.delete(car);
    }

    @GetMapping("/appointments/my")
    @PreAuthorize("hasRole('CLIENT')")
    public List<AppointmentDtos.AppointmentView> myAppointments() {
        UserEntity user = currentUserService.requireUser();
        return appointmentRepository.findByClientOrderByScheduledStartDesc(user).stream().map(mapper::toAppointmentView).toList();
    }

    @GetMapping("/appointments/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public AppointmentDtos.AppointmentView appointment(@PathVariable Long id) {
        UserEntity user = currentUserService.requireUser();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));
        if (!appointment.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к записи");
        }
        return mapper.toAppointmentView(appointment);
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasRole('CLIENT')")
    public AppointmentDtos.AppointmentView createAppointment(@Valid @RequestBody AppointmentDtos.AppointmentCreateRequest request) {
        UserEntity user = currentUserService.requireUser();

        if (appointmentRepository.existsByClientAndScheduledStart(user, request.scheduledStart())) {
            throw new BusinessException(HttpStatus.CONFLICT, "На это время уже есть запись");
        }

        WorkshopEntity workshop = workshopRepository.findById(request.workshopId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));
        CarEntity car = carRepository.findById(request.carId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Автомобиль не найден"));
        List<Long> serviceIds = request.serviceIds() == null ? List.of() : request.serviceIds().stream().filter(x -> x != null && x > 0).distinct().toList();
        if (serviceIds.isEmpty()) {
            if (request.serviceId() == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Нужно выбрать хотя бы одну услугу");
            }
            serviceIds = List.of(request.serviceId());
        }
        if (serviceIds.size() > 5) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Можно выбрать максимум 5 услуг");
        }

        List<ServiceEntity> services = serviceIds.stream()
                .map(id -> serviceRepository.findById(id)
                        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена")))
                .toList();

        if (!car.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Автомобиль не принадлежит пользователю");
        }
        for (ServiceEntity s : services) {
            if (!s.getWorkshop().getId().equals(workshop.getId())) {
                throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Услуга не принадлежит выбранной точке");
            }
            if (!s.isActive()) {
                throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Нельзя записаться на неактивную услугу");
            }
        }

        ServiceEntity primaryService = services.getFirst();
        int totalMinutes = services.stream().mapToInt(ServiceEntity::getDurationMinutes).sum();

        Map<Long, Set<Long>> requestedSelectedItemIds = new HashMap<>();
        if (request.selections() != null) {
            for (AppointmentDtos.ServiceSelectionRequest s : request.selections()) {
                if (s == null || s.serviceId() == null) continue;
                Set<Long> ids = new HashSet<>();
                if (s.selectedItemIds() != null) {
                    for (Long x : s.selectedItemIds()) {
                        if (x != null && x > 0) ids.add(x);
                    }
                }
                requestedSelectedItemIds.put(s.serviceId(), ids);
            }
        }

        List<ServiceItemEntity> chosenItems = new ArrayList<>();
        BigDecimal totalPrice = BigDecimal.ZERO;
        for (ServiceEntity service : services) {
            List<ServiceItemEntity> catalogItems = serviceItemRepository.findByServiceOrderBySortOrderAscIdAsc(service);
            if (catalogItems.isEmpty()) {
                totalPrice = totalPrice.add(service.getPrice());
                continue;
            }

            Set<Long> requested = requestedSelectedItemIds.getOrDefault(service.getId(), Set.of());
            Map<String, List<ServiceItemEntity>> choiceGroups = new HashMap<>();

            for (ServiceItemEntity item : catalogItems) {
                if (item.getKind() == ServiceItemKind.MANDATORY) {
                    chosenItems.add(item);
                } else if (item.getKind() == ServiceItemKind.OPTIONAL) {
                    if (item.isDefaultSelected() || requested.contains(item.getId())) {
                        chosenItems.add(item);
                    }
                } else if (item.getKind() == ServiceItemKind.CHOICE_OPTION) {
                    String key = item.getChoiceGroupKey();
                    if (key == null || key.isBlank()) continue;
                    choiceGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(item);
                }
            }

            // validate requested ids belong to service
            for (Long id : requested) {
                boolean ok = catalogItems.stream().anyMatch(i -> i.getId().equals(id));
                if (!ok) {
                    throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Выбран некорректный пункт услуги");
                }
            }

            // resolve choice groups: exactly 1 option per group (use requested if provided, else default)
            for (Map.Entry<String, List<ServiceItemEntity>> e : choiceGroups.entrySet()) {
                List<ServiceItemEntity> options = e.getValue();
                List<ServiceItemEntity> requestedOptions = options.stream().filter(o -> requested.contains(o.getId())).toList();
                if (requestedOptions.size() > 1) {
                    throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "В группе выбора можно указать только один вариант");
                }
                ServiceItemEntity selected = requestedOptions.isEmpty()
                        ? options.stream().filter(ServiceItemEntity::isDefaultSelected).findFirst().orElse(options.getFirst())
                        : requestedOptions.getFirst();
                chosenItems.add(selected);
            }

            for (ServiceItemEntity x : chosenItems) {
                if (x.getService().getId().equals(service.getId())) {
                    totalPrice = totalPrice.add(x.getPrice());
                }
            }
        }

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setClient(user);
        appointment.setWorkshop(workshop);
        appointment.setCar(car);
        appointment.setService(primaryService);
        appointment.setServices(services);
        appointment.setScheduledStart(request.scheduledStart());
        appointment.setScheduledEnd(request.scheduledStart().plusMinutes(totalMinutes));
        appointment.setStatus(AppointmentStatus.NEW);
        appointment.setTotalPrice(totalPrice);
        appointment.setClientComment(request.clientComment());

        AppointmentEntity saved = appointmentRepository.save(appointment);
        // Persist selected items (if any)
        if (!chosenItems.isEmpty()) {
            for (ServiceItemEntity item : chosenItems) {
                AppointmentServiceItemEntity link = new AppointmentServiceItemEntity();
                link.setAppointment(saved);
                link.setServiceItem(item);
                AppointmentServiceItemEntity.Pk pk = new AppointmentServiceItemEntity.Pk();
                pk.setAppointmentId(saved.getId());
                pk.setServiceItemId(item.getId());
                link.setId(pk);
                appointmentServiceItemRepository.save(link);
            }
        }
        addStatusHistory(saved, null, AppointmentStatus.NEW, user, "Создана клиентом");
        return mapper.toAppointmentView(saved);
    }

    @PostMapping("/appointments/{id}/cancel")
    public AppointmentDtos.AppointmentView cancelAppointment(@PathVariable Long id,
                                                             @Valid @RequestBody AppointmentDtos.CancelRequest request) {
        UserEntity user = currentUserService.requireUser();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = appointment.getClient().getId().equals(user.getId());
        if (!isAdmin && !isOwner) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к записи");
        }

        if (!workflowService.canTransition(Role.CLIENT, appointment.getStatus(), AppointmentStatus.CANCELLED) && !isAdmin) {
            throw new BusinessException(HttpStatus.CONFLICT, "Нельзя отменить запись в текущем статусе");
        }

        if (!isAdmin && appointment.getScheduledStart().isBefore(LocalDateTime.now().plusHours(2))) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Отмена возможна минимум за 2 часа");
        }

        AppointmentStatus previous = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledAt(LocalDateTime.now());
        appointment.setCancelReason(request.reason());
        AppointmentEntity saved = appointmentRepository.save(appointment);
        addStatusHistory(saved, previous, AppointmentStatus.CANCELLED, user, request.reason());
        return mapper.toAppointmentView(saved);
    }

    @PostMapping("/appointments/{id}/payment/pay-now")
    @PreAuthorize("hasRole('CLIENT')")
    public AppointmentDtos.AppointmentView payNow(@PathVariable Long id, @Valid @RequestBody AppointmentDtos.PayNowRequest request) {
        UserEntity user = currentUserService.requireUser();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));
        if (!appointment.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к записи");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Нельзя оплатить отменённую запись");
        }
        if (appointment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessException(HttpStatus.CONFLICT, "Запись уже оплачена");
        }

        // Данные карты не сохраняем и никуда не отправляем (демо-оплата)
        appointment.setPaymentMethod(PaymentMethod.NOW);
        appointment.setPaymentStatus(PaymentStatus.PAID);
        appointment.setPaidAt(LocalDateTime.now());
        return mapper.toAppointmentView(appointmentRepository.save(appointment));
    }

    @PostMapping("/appointments/{id}/payment/in-workshop")
    @PreAuthorize("hasRole('CLIENT')")
    public AppointmentDtos.AppointmentView payInWorkshop(@PathVariable Long id) {
        UserEntity user = currentUserService.requireUser();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));
        if (!appointment.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к записи");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Нельзя оплатить отменённую запись");
        }
        if (appointment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessException(HttpStatus.CONFLICT, "Запись уже оплачена");
        }
        appointment.setPaymentMethod(PaymentMethod.IN_WORKSHOP);
        appointment.setPaymentStatus(PaymentStatus.UNPAID);
        appointment.setPaidAt(null);
        return mapper.toAppointmentView(appointmentRepository.save(appointment));
    }

    @PostMapping("/reviews")
    @PreAuthorize("hasRole('CLIENT')")
    public ReviewDtos.ReviewView createReview(@Valid @RequestBody ReviewDtos.ReviewCreateRequest request) {
        UserEntity user = currentUserService.requireUser();
        AppointmentEntity appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        if (!appointment.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Можно оставлять отзыв только на свои записи");
        }
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Отзыв можно оставить только после выполнения услуги");
        }

        if (request.targetType() == ReviewTargetType.SERVICE) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Отзывы об услугах отключены");
        }

        ServiceEntity service = request.serviceId() == null ? null : serviceRepository.findById(request.serviceId()).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));
        MasterEntity master = request.masterId() == null ? null : masterRepository.findById(request.masterId()).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        WorkshopEntity workshop = request.workshopId() == null ? null : workshopRepository.findById(request.workshopId()).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));

        if (request.targetType() == ReviewTargetType.MASTER && master == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Для отзыва о мастере нужно указать мастера");
        }
        if (request.targetType() == ReviewTargetType.WORKSHOP && workshop == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Для отзыва о салоне нужно указать салон");
        }

        if (reviewRepository.existsByAppointmentAndTargetTypeAndServiceAndMasterAndWorkshop(appointment, request.targetType(), service, master, workshop)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Отзыв уже оставлен");
        }

        ReviewEntity review = new ReviewEntity();
        review.setClient(user);
        review.setAppointment(appointment);
        review.setTargetType(request.targetType());
        review.setService(service);
        review.setMaster(master);
        review.setWorkshop(workshop);
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setModerationStatus(ReviewModerationStatus.PENDING);
        review.setVisible(false);
        review.setRejectionReason(null);
        review.setAiModeratedAt(null);

        return mapper.toReviewView(reviewRepository.save(review));
    }

    @GetMapping("/reviews/my")
    @PreAuthorize("hasRole('CLIENT')")
    public List<ReviewDtos.ReviewView> myReviews() {
        UserEntity user = currentUserService.requireUser();
        return reviewRepository.findByClientOrderByCreatedAtDesc(user).stream().map(mapper::toReviewView).toList();
    }

    @GetMapping("/appointments/{id}/reviews")
    @PreAuthorize("hasRole('CLIENT')")
    public List<ReviewDtos.ReviewView> appointmentReviews(@PathVariable Long id) {
        UserEntity user = currentUserService.requireUser();
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Запись не найдена"));
        if (!appointment.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Нет доступа к записи");
        }
        return reviewRepository.findByAppointmentAndClientOrderByCreatedAtDesc(appointment, user).stream().map(mapper::toReviewView).toList();
    }

    private void addStatusHistory(AppointmentEntity appointment,
                                  AppointmentStatus from,
                                  AppointmentStatus to,
                                  UserEntity user,
                                  String comment) {
        AppointmentStatusHistoryEntity history = new AppointmentStatusHistoryEntity();
        history.setAppointment(appointment);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedBy(user);
        history.setComment(comment);
        appointmentStatusHistoryRepository.save(history);
    }
}
