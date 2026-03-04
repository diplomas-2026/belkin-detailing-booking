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

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ClientController {

    private final CurrentUserService currentUserService;
    private final CarRepository carRepository;
    private final WorkshopRepository workshopRepository;
    private final ServiceRepository serviceRepository;
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
        ServiceEntity service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));

        if (!car.getClient().getId().equals(user.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Автомобиль не принадлежит пользователю");
        }
        if (!service.getWorkshop().getId().equals(workshop.getId())) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "Услуга не принадлежит выбранной точке");
        }

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setClient(user);
        appointment.setWorkshop(workshop);
        appointment.setCar(car);
        appointment.setService(service);
        appointment.setScheduledStart(request.scheduledStart());
        appointment.setScheduledEnd(request.scheduledStart().plusMinutes(service.getDurationMinutes()));
        appointment.setStatus(AppointmentStatus.NEW);
        appointment.setTotalPrice(service.getPrice());
        appointment.setClientComment(request.clientComment());

        AppointmentEntity saved = appointmentRepository.save(appointment);
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

        ServiceEntity service = request.serviceId() == null ? null : serviceRepository.findById(request.serviceId()).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Услуга не найдена"));
        MasterEntity master = request.masterId() == null ? null : masterRepository.findById(request.masterId()).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Мастер не найден"));
        WorkshopEntity workshop = request.workshopId() == null ? null : workshopRepository.findById(request.workshopId()).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Точка не найдена"));

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

        return mapper.toReviewView(reviewRepository.save(review));
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
