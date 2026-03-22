package com.company.product.api.service;

import com.company.product.api.dto.*;
import com.company.product.api.entity.*;
import com.company.product.api.repository.AppointmentServiceItemRepository;
import com.company.product.api.repository.WorkshopPhotoRepository;
import com.company.product.api.repository.ServiceItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DtoMapperService {

    private final WorkshopPhotoRepository workshopPhotoRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final AppointmentServiceItemRepository appointmentServiceItemRepository;

    public DtoMapperService(WorkshopPhotoRepository workshopPhotoRepository,
                            ServiceItemRepository serviceItemRepository,
                            AppointmentServiceItemRepository appointmentServiceItemRepository) {
        this.workshopPhotoRepository = workshopPhotoRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.appointmentServiceItemRepository = appointmentServiceItemRepository;
    }

    public WorkshopDtos.WorkshopView toWorkshopView(WorkshopEntity workshop) {
        List<WorkshopDtos.WorkshopPhotoView> photos = workshopPhotoRepository.findByWorkshopOrderBySortOrderAsc(workshop)
                .stream()
                .map(p -> new WorkshopDtos.WorkshopPhotoView(p.getId(), p.getPhotoUrl(), p.getSortOrder(), p.isCover()))
                .toList();

        return new WorkshopDtos.WorkshopView(
                workshop.getId(), workshop.getName(), workshop.getDescription(), workshop.getAddress(), workshop.getCity(),
                workshop.getLatitude(), workshop.getLongitude(), workshop.getPhone(), workshop.getWorkingHours(), workshop.isActive(), photos
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

    public ServiceDtos.ServiceItemView toServiceItemView(ServiceItemEntity item) {
        return new ServiceDtos.ServiceItemView(
                item.getId(),
                item.getKind().name(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getChoiceGroupKey(),
                item.isDefaultSelected(),
                item.getSortOrder()
        );
    }

    public ServiceDtos.ServiceDetailView toServiceDetailView(ServiceEntity service) {
        List<ServiceDtos.ServiceItemView> items = serviceItemRepository.findByServiceOrderBySortOrderAscIdAsc(service).stream()
                .map(this::toServiceItemView)
                .toList();
        return new ServiceDtos.ServiceDetailView(toServiceView(service), items);
    }

    public CarDtos.CarView toCarView(CarEntity car) {
        return new CarDtos.CarView(car.getId(), car.getBrand(), car.getModel(), car.getYear(), car.getPlateNumber(), car.getColor(), car.getNotes());
    }

    public AppointmentDtos.AppointmentView toAppointmentView(AppointmentEntity appointment) {
        String carLabel = appointment.getCar().getBrand() + " " + appointment.getCar().getModel() + " (" + appointment.getCar().getPlateNumber() + ")";
        String masterName = appointment.getMaster() == null ? null : appointment.getMaster().getUser().getFullName();
        Long masterId = appointment.getMaster() == null ? null : appointment.getMaster().getId();
        var services = appointment.getServices() == null ? List.<AppointmentDtos.AppointmentServiceView>of() : appointment.getServices().stream()
                .map(s -> new AppointmentDtos.AppointmentServiceView(s.getId(), s.getName(), s.getDurationMinutes(), s.getPrice()))
                .toList();

        var selectedItems = appointmentServiceItemRepository.findByAppointment(appointment).stream()
                .map(x -> {
                    ServiceItemEntity i = x.getServiceItem();
                    ServiceEntity s = i.getService();
                    return new AppointmentDtos.AppointmentSelectedItemView(
                            i.getId(),
                            s.getId(),
                            s.getName(),
                            i.getKind().name(),
                            i.getName(),
                            i.getPrice(),
                            i.getChoiceGroupKey()
                    );
                })
                .toList();

        return new AppointmentDtos.AppointmentView(
                appointment.getId(),
                appointment.getWorkshop().getId(),
                appointment.getWorkshop().getName(),
                appointment.getCar().getId(),
                carLabel,
                appointment.getService().getId(),
                appointment.getService().getName(),
                services,
                selectedItems,
                masterId,
                masterName,
                appointment.getScheduledStart(),
                appointment.getScheduledEnd(),
                appointment.getStatus(),
                appointment.getPaymentStatus(),
                appointment.getPaymentMethod(),
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
