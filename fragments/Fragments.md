### Рисунок 2.41 - Фрагмент реализации авторизации и регистрации пользователя

### [Скрин кода](./img_1.png)

```java
public AuthDtos.LoginResponse register(AuthDtos.RegisterRequest request) {
    String email = request.email().trim().toLowerCase();
    if (userRepository.findByEmail(email).isPresent()) {
        throw new BusinessException(HttpStatus.CONFLICT, "Пользователь с таким email уже существует");
    }

    UserEntity user = new UserEntity();
    user.setFullName(request.fullName().trim());
    user.setEmail(email);
    user.setRole(Role.CLIENT);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    userRepository.save(user);

    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
    String token = jwtService.generateToken(userDetails);
    return new AuthDtos.LoginResponse(token, toUserView(user));
}
```

### Рисунок 2.42 - Фрагмент реализации управления автомобилями клиента

### [Скрин кода](./img_2.png)

```java
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
```

### Рисунок 2.43 - Фрагмент реализации создания онлайн-записи

### [Скрин кода](./img_3.png)

```java
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

    AppointmentEntity appointment = new AppointmentEntity();
    appointment.setClient(user);
    appointment.setWorkshop(workshop);
    appointment.setCar(car);
    appointment.setService(primaryService);
    appointment.setServices(services);
    appointment.setScheduledStart(request.scheduledStart());
    appointment.setScheduledEnd(request.scheduledStart().plusMinutes(totalMinutes));
    appointment.setStatus(AppointmentStatus.NEW);
    appointment.setClientComment(request.clientComment());

    AppointmentEntity saved = appointmentRepository.save(appointment);
    addStatusHistory(saved, null, AppointmentStatus.NEW, user, "Создана клиентом");
    return mapper.toAppointmentView(saved);
}
```

### Рисунок 2.44 - Фрагмент реализации назначения мастера и изменения статуса администратором

### [Скрин кода](./img_4.png)

```java
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
```

### Рисунок 2.45 - Фрагмент реализации работы мастера с назначенными задачами

### [Скрин кода](./img_5.png)

```java
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
```

### Рисунок 2.46 - Фрагмент реализации жизненного цикла записи

### [Скрин кода](./img_6.png)

```java
public boolean canTransition(Role role, AppointmentStatus from, AppointmentStatus to) {
    return switch (role) {
        case MASTER -> MASTER_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
        case ADMIN -> ADMIN_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
        case CLIENT -> to == AppointmentStatus.CANCELLED &&
                (from == AppointmentStatus.NEW || from == AppointmentStatus.CONFIRMED);
    };
}
```

### Рисунок 2.47 - Фрагмент реализации AI-модерации отзывов

### [Скрин кода](./img_7.png)

```java
@Transactional
public ModerationRunResult runOnce() {
    if (!properties.enabled()) {
        return new ModerationRunResult(0, 0, "AI отключен (app.ai.enabled=false)");
    }
    if (chatClient == null) {
        return new ModerationRunResult(0, 0, "ChatClient не сконфигурирован");
    }

    List<ReviewEntity> pending = reviewRepository.findByModerationStatus(ReviewModerationStatus.PENDING);
    if (pending.isEmpty()) {
        return new ModerationRunResult(0, 0, "Нет новых отзывов для модерации");
    }

    int processed = 0;
    int llmCalls = 0;
    List<Long> skippedByBudget = new ArrayList<>();

    for (ReviewEntity review : pending) {
        TokenBudgetService.TokenBudgetView budget = tokenBudgetService.getBudget();
        if (budget.remaining() < 200) {
            skippedByBudget.add(review.getId());
            continue;
        }

        boolean changed = moderateSingle(review);
        if (changed) {
            processed++;
        }
        if (review.getAiModeratedAt() != null) {
            llmCalls++;
        }
    }

    String note = skippedByBudget.isEmpty()
            ? "OK"
            : "Часть отзывов пропущена из-за лимита токенов: " + skippedByBudget.size();
    return new ModerationRunResult(processed, llmCalls, note);
}
```

### Листинг кода программного продукта страниц на 3-4.

```java
public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
    authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
    );
    UserDetails userDetails = userDetailsService.loadUserByUsername(request.email());
    String token = jwtService.generateToken(userDetails);
    UserEntity user = userRepository.findByEmail(request.email()).orElseThrow();
    return new AuthDtos.LoginResponse(token, toUserView(user));
}

public AuthDtos.LoginResponse register(AuthDtos.RegisterRequest request) {
    String email = request.email().trim().toLowerCase();
    if (userRepository.findByEmail(email).isPresent()) {
        throw new BusinessException(HttpStatus.CONFLICT, "Пользователь с таким email уже существует");
    }

    UserEntity user = new UserEntity();
    user.setFullName(request.fullName().trim());
    user.setEmail(email);
    user.setRole(Role.CLIENT);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    userRepository.save(user);

    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
    String token = jwtService.generateToken(userDetails);
    return new AuthDtos.LoginResponse(token, toUserView(user));
}

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

public boolean canTransition(Role role, AppointmentStatus from, AppointmentStatus to) {
    return switch (role) {
        case MASTER -> MASTER_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
        case ADMIN -> ADMIN_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
        case CLIENT -> to == AppointmentStatus.CANCELLED &&
                (from == AppointmentStatus.NEW || from == AppointmentStatus.CONFIRMED);
    };
}

@Transactional
public ModerationRunResult runOnce() {
    if (!properties.enabled()) {
        return new ModerationRunResult(0, 0, "AI отключен (app.ai.enabled=false)");
    }
    if (chatClient == null) {
        return new ModerationRunResult(0, 0, "ChatClient не сконфигурирован");
    }

    List<ReviewEntity> pending = reviewRepository.findByModerationStatus(ReviewModerationStatus.PENDING);
    if (pending.isEmpty()) {
        return new ModerationRunResult(0, 0, "Нет новых отзывов для модерации");
    }

    int processed = 0;
    int llmCalls = 0;
    List<Long> skippedByBudget = new ArrayList<>();

    for (ReviewEntity review : pending) {
        TokenBudgetService.TokenBudgetView budget = tokenBudgetService.getBudget();
        if (budget.remaining() < 200) {
            skippedByBudget.add(review.getId());
            continue;
        }

        boolean changed = moderateSingle(review);
        if (changed) {
            processed++;
        }
        if (review.getAiModeratedAt() != null) {
            llmCalls++;
        }
    }

    String note = skippedByBudget.isEmpty()
            ? "OK"
            : "Часть отзывов пропущена из-за лимита токенов: " + skippedByBudget.size();
    return new ModerationRunResult(processed, llmCalls, note);
}
```
