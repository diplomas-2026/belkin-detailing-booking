package com.company.product.api.service;

import com.company.product.api.dto.*;
import com.company.product.api.entity.*;
import com.company.product.api.repository.WorkshopPhotoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DtoMapperService {

    private final WorkshopPhotoRepository workshopPhotoRepository;

    public DtoMapperService(WorkshopPhotoRepository workshopPhotoRepository) {
        this.workshopPhotoRepository = workshopPhotoRepository;
    }

    public WorkshopDtos.WorkshopView toWorkshopView(WorkshopEntity workshop) {
        List<WorkshopDtos.WorkshopPhotoView> photos = workshopPhotoRepository.findByWorkshopOrderBySortOrderAsc(workshop)
                .stream()
                .map(p -> new WorkshopDtos.WorkshopPhotoView(p.getId(), p.getPhotoUrl(), p.getSortOrder(), p.isCover()))
                .toList();

        return new WorkshopDtos.WorkshopView(
                workshop.getId(), workshop.getName(), workshop.getDescription(), workshop.getAddress(), workshop.getCity(),
                workshop.getLatitude(), workshop.getLongitude(), workshop.getPhone(), workshop.getWorkingHours(), photos
        );
    }

    public ServiceDtos.ServiceView toServiceView(ServiceEntity service) {
        return new ServiceDtos.ServiceView(
                service.getId(),
                service.getWorkshop().getId(),
                service.getWorkshop().getName(),
                service.getName(),
                service.getDescription(),
                service.getDurationMinutes(),
                service.getPrice(),
                service.isActive()
        );
    }

    public CarDtos.CarView toCarView(CarEntity car) {
        return new CarDtos.CarView(car.getId(), car.getBrand(), car.getModel(), car.getYear(), car.getPlateNumber(), car.getColor(), car.getNotes());
    }

    public AppointmentDtos.AppointmentView toAppointmentView(AppointmentEntity appointment) {
        String carLabel = appointment.getCar().getBrand() + " " + appointment.getCar().getModel() + " (" + appointment.getCar().getPlateNumber() + ")";
        String masterName = appointment.getMaster() == null ? null : appointment.getMaster().getUser().getFullName();
        Long masterId = appointment.getMaster() == null ? null : appointment.getMaster().getId();

        return new AppointmentDtos.AppointmentView(
                appointment.getId(),
                appointment.getWorkshop().getId(),
                appointment.getWorkshop().getName(),
                appointment.getCar().getId(),
                carLabel,
                appointment.getService().getId(),
                appointment.getService().getName(),
                masterId,
                masterName,
                appointment.getScheduledStart(),
                appointment.getScheduledEnd(),
                appointment.getStatus(),
                appointment.getTotalPrice(),
                appointment.getClientComment(),
                appointment.getResultComment()
        );
    }

    public ReviewDtos.ReviewView toReviewView(ReviewEntity review) {
        return new ReviewDtos.ReviewView(
                review.getId(),
                review.getClient().getFullName(),
                review.getTargetType(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getModerationStatus(),
                review.getRejectionReason()
        );
    }

    public MasterDtos.MasterView toMasterView(MasterEntity master) {
        return new MasterDtos.MasterView(
                master.getId(),
                master.getUser().getId(),
                master.getUser().getFullName(),
                master.getWorkshop().getId(),
                master.getWorkshop().getName(),
                master.getSpecialization(),
                master.getPhotoUrl(),
                master.getExperienceYears(),
                master.isActive()
        );
    }
}
