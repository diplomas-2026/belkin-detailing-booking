package com.company.product.api.seed;

import com.company.product.api.entity.*;
import com.company.product.api.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@Profile("!prod")
public class SeedDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final WorkshopRepository workshopRepository;
    private final WorkshopPhotoRepository workshopPhotoRepository;
    private final ServiceRepository serviceRepository;
    private final MasterRepository masterRepository;
    private final MasterShiftRepository masterShiftRepository;
    private final CarRepository carRepository;
    private final AppointmentRepository appointmentRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public SeedDataInitializer(UserRepository userRepository,
                               WorkshopRepository workshopRepository,
                               WorkshopPhotoRepository workshopPhotoRepository,
                               ServiceRepository serviceRepository,
                               MasterRepository masterRepository,
                               MasterShiftRepository masterShiftRepository,
                               CarRepository carRepository,
                               AppointmentRepository appointmentRepository,
                               ReviewRepository reviewRepository,
                               PasswordEncoder passwordEncoder,
                               ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.workshopRepository = workshopRepository;
        this.workshopPhotoRepository = workshopPhotoRepository;
        this.serviceRepository = serviceRepository;
        this.masterRepository = masterRepository;
        this.masterShiftRepository = masterShiftRepository;
        this.carRepository = carRepository;
        this.appointmentRepository = appointmentRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        seedUsers();
        seedWorkshops();
        seedWorkshopPhotos();
        seedServices();
        seedMasters();
        seedShifts();
        seedCars();
        seedAppointments();
        seedReviews();
        writeUsersFile();
    }

    private void seedUsers() {
        upsertUser("admin@detailing.local", "Admin Детейлинг", "+7 (900) 000-00-01", Role.ADMIN, "Admin123!");
        upsertUser("master1@detailing.local", "Иван Петров", "+7 (900) 000-00-02", Role.MASTER, "Master123!");
        upsertUser("master2@detailing.local", "Сергей Волков", "+7 (900) 000-00-03", Role.MASTER, "Master123!");
        upsertUser("master3@detailing.local", "Артем Козлов", "+7 (900) 000-00-04", Role.MASTER, "Master123!");
        upsertUser("client1@detailing.local", "Роман Нестеров", "+7 (900) 000-00-11", Role.CLIENT, "Client123!");
        upsertUser("client2@detailing.local", "Екатерина Миронова", "+7 (900) 000-00-12", Role.CLIENT, "Client123!");
        upsertUser("client3@detailing.local", "Михаил Соколов", "+7 (900) 000-00-13", Role.CLIENT, "Client123!");
        upsertUser("client4@detailing.local", "Анна Васильева", "+7 (900) 000-00-14", Role.CLIENT, "Client123!");
    }

    private void upsertUser(String email, String fullName, String phone, Role role, String rawPassword) {
        UserEntity user = userRepository.findByEmail(email).orElseGet(UserEntity::new);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setRole(role);
        user.setActive(true);
        if (user.getPasswordHash() == null || !user.getPasswordHash().startsWith("$2a$") && !user.getPasswordHash().startsWith("$2b$")) {
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
        }
        userRepository.save(user);
    }

    private void seedWorkshops() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/workshops.json")) {
            String name = (String) row.get("name");
            WorkshopEntity workshop = workshopRepository.findByName(name).orElseGet(WorkshopEntity::new);
            workshop.setName(name);
            workshop.setDescription((String) row.get("description"));
            workshop.setAddress((String) row.get("address"));
            workshop.setCity((String) row.get("city"));
            workshop.setLatitude(((Number) row.get("latitude")).doubleValue());
            workshop.setLongitude(((Number) row.get("longitude")).doubleValue());
            workshop.setPhone((String) row.get("phone"));
            workshop.setWorkingHours((String) row.get("workingHours"));
            workshop.setActive(Boolean.TRUE.equals(row.get("active")));
            workshopRepository.save(workshop);
        }
    }

    private void seedWorkshopPhotos() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/workshop_photos.json")) {
            WorkshopEntity workshop = workshopRepository.findByName((String) row.get("workshopName")).orElseThrow();
            List<WorkshopPhotoEntity> existing = workshopPhotoRepository.findByWorkshopOrderBySortOrderAsc(workshop);
            String url = (String) row.get("photoUrl");
            boolean exists = existing.stream().anyMatch(p -> p.getPhotoUrl().equals(url));
            if (!exists) {
                WorkshopPhotoEntity photo = new WorkshopPhotoEntity();
                photo.setWorkshop(workshop);
                photo.setPhotoUrl(url);
                photo.setSortOrder(((Number) row.get("sortOrder")).intValue());
                photo.setCover(Boolean.TRUE.equals(row.get("cover")));
                workshopPhotoRepository.save(photo);
            }
        }
    }

    private void seedServices() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/services.json")) {
            WorkshopEntity workshop = workshopRepository.findByName((String) row.get("workshopName")).orElseThrow();
            String name = (String) row.get("name");
            ServiceEntity service = serviceRepository.findByWorkshopAndName(workshop, name).orElseGet(ServiceEntity::new);
            service.setWorkshop(workshop);
            service.setName(name);
            service.setDescription((String) row.get("description"));
            service.setDurationMinutes(((Number) row.get("durationMinutes")).intValue());
            service.setPrice(BigDecimal.valueOf(((Number) row.get("price")).doubleValue()));
            service.setActive(Boolean.TRUE.equals(row.get("active")));
            serviceRepository.save(service);
        }
    }

    private void seedMasters() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/masters.json")) {
            UserEntity user = userRepository.findByEmail((String) row.get("email")).orElseThrow();
            WorkshopEntity workshop = workshopRepository.findByName((String) row.get("workshopName")).orElseThrow();
            MasterEntity master = masterRepository.findByUser(user).orElseGet(MasterEntity::new);
            master.setUser(user);
            master.setWorkshop(workshop);
            master.setSpecialization((String) row.get("specialization"));
            master.setExperienceYears(((Number) row.get("experienceYears")).intValue());
            master.setActive(Boolean.TRUE.equals(row.get("active")));
            masterRepository.save(master);
        }
    }

    private void seedShifts() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/master_shifts.json")) {
            UserEntity user = userRepository.findByEmail((String) row.get("masterEmail")).orElseThrow();
            MasterEntity master = masterRepository.findByUser(user).orElseThrow();
            LocalDate date = LocalDate.parse((String) row.get("shiftDate"));
            LocalTime start = LocalTime.parse((String) row.get("startTime"));
            boolean exists = masterShiftRepository.findByMasterAndShiftDate(master, date).stream()
                    .anyMatch(s -> s.getStartTime().equals(start));
            if (!exists) {
                MasterShiftEntity shift = new MasterShiftEntity();
                shift.setMaster(master);
                shift.setShiftDate(date);
                shift.setStartTime(start);
                shift.setEndTime(LocalTime.parse((String) row.get("endTime")));
                masterShiftRepository.save(shift);
            }
        }
    }

    private void seedCars() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/cars.json")) {
            UserEntity client = userRepository.findByEmail((String) row.get("clientEmail")).orElseThrow();
            String plate = ((String) row.get("plateNumber")).toUpperCase();
            boolean exists = carRepository.findByClientOrderByIdDesc(client).stream().anyMatch(c -> c.getPlateNumber().equals(plate));
            if (!exists) {
                CarEntity car = new CarEntity();
                car.setClient(client);
                car.setBrand((String) row.get("brand"));
                car.setModel((String) row.get("model"));
                car.setYear(((Number) row.get("year")).intValue());
                car.setPlateNumber(plate);
                car.setColor((String) row.get("color"));
                car.setNotes((String) row.get("notes"));
                carRepository.save(car);
            }
        }
    }

    private void seedAppointments() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/appointments.json")) {
            UserEntity client = userRepository.findByEmail((String) row.get("clientEmail")).orElseThrow();
            LocalDateTime start = LocalDateTime.parse((String) row.get("scheduledStart"));
            if (appointmentRepository.existsByClientAndScheduledStart(client, start)) {
                continue;
            }

            WorkshopEntity workshop = workshopRepository.findByName((String) row.get("workshopName")).orElseThrow();
            ServiceEntity service = serviceRepository.findByWorkshopAndName(workshop, (String) row.get("serviceName")).orElseThrow();
            CarEntity car = carRepository.findByClientOrderByIdDesc(client).stream()
                    .filter(c -> c.getPlateNumber().equalsIgnoreCase((String) row.get("carPlate")))
                    .findFirst()
                    .orElseThrow();

            AppointmentEntity appointment = new AppointmentEntity();
            appointment.setClient(client);
            appointment.setWorkshop(workshop);
            appointment.setService(service);
            appointment.setCar(car);
            appointment.setScheduledStart(start);
            appointment.setScheduledEnd(start.plusMinutes(service.getDurationMinutes()));
            appointment.setStatus(AppointmentStatus.valueOf((String) row.get("status")));
            appointment.setClientComment((String) row.get("clientComment"));
            appointment.setTotalPrice(service.getPrice());

            String masterEmail = (String) row.get("masterEmail");
            if (masterEmail != null) {
                UserEntity masterUser = userRepository.findByEmail(masterEmail).orElseThrow();
                appointment.setMaster(masterRepository.findByUser(masterUser).orElseThrow());
            }

            appointmentRepository.save(appointment);
        }
    }

    private void seedReviews() throws IOException {
        for (Map<String, Object> row : readJsonArray("seed-data/reviews.json")) {
            UserEntity client = userRepository.findByEmail((String) row.get("clientEmail")).orElseThrow();
            UserEntity appointmentClient = userRepository.findByEmail((String) row.get("appointmentClientEmail")).orElseThrow();
            AppointmentEntity appointment = appointmentRepository.findByClientOrderByScheduledStartDesc(appointmentClient)
                    .stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                    .findFirst()
                    .orElse(null);
            if (appointment == null) {
                continue;
            }

            ReviewTargetType targetType = ReviewTargetType.valueOf((String) row.get("targetType"));
            ServiceEntity service = null;
            MasterEntity master = null;
            WorkshopEntity workshop = null;

            if (row.get("serviceName") != null) {
                workshop = workshopRepository.findByName((String) row.get("workshopName")).orElseThrow();
                service = serviceRepository.findByWorkshopAndName(workshop, (String) row.get("serviceName")).orElse(null);
            }
            if (row.get("masterEmail") != null) {
                UserEntity masterUser = userRepository.findByEmail((String) row.get("masterEmail")).orElseThrow();
                master = masterRepository.findByUser(masterUser).orElse(null);
            }
            if (row.get("workshopName") != null) {
                workshop = workshopRepository.findByName((String) row.get("workshopName")).orElseThrow();
            }

            if (reviewRepository.existsByAppointmentAndTargetTypeAndServiceAndMasterAndWorkshop(appointment, targetType, service, master, workshop)) {
                continue;
            }

            ReviewEntity review = new ReviewEntity();
            review.setClient(client);
            review.setAppointment(appointment);
            review.setTargetType(targetType);
            review.setService(service);
            review.setMaster(master);
            review.setWorkshop(workshop);
            review.setRating(((Number) row.get("rating")).intValue());
            review.setComment((String) row.get("comment"));
            boolean visible = Boolean.TRUE.equals(row.get("visible"));
            review.setVisible(visible);
            review.setModerationStatus(visible ? ReviewModerationStatus.APPROVED : ReviewModerationStatus.REJECTED);
            reviewRepository.save(review);
        }
    }

    private void writeUsersFile() throws IOException {
        List<String> lines = new ArrayList<>();
        lines.add("email=admin@detailing.local; password=Admin123!; role=ADMIN");
        lines.add("email=master1@detailing.local; password=Master123!; role=MASTER");
        lines.add("email=master2@detailing.local; password=Master123!; role=MASTER");
        lines.add("email=master3@detailing.local; password=Master123!; role=MASTER");
        lines.add("email=client1@detailing.local; password=Client123!; role=CLIENT");
        lines.add("email=client2@detailing.local; password=Client123!; role=CLIENT");
        lines.add("email=client3@detailing.local; password=Client123!; role=CLIENT");
        lines.add("email=client4@detailing.local; password=Client123!; role=CLIENT");

        Files.write(Path.of("users.txt"), lines);
    }

    private List<Map<String, Object>> readJsonArray(String filePath) throws IOException {
        Path path = Path.of(filePath);
        if (!Files.exists(path)) {
            return List.of();
        }
        return objectMapper.readValue(Files.readString(path), new TypeReference<>() {});
    }
}
