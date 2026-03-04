# Техническое задание

## 1. Общая информация
- Название проекта: `detailing-booking-system`
- Предметная область: онлайн-запись на услуги детейлинга автомобилей для ИП Михайлов Р.Ю.
- Цель: автоматизировать прием заявок, управление расписанием по нескольким мастерским, назначение мастеров, учет статусов заказов и сбор отзывов.
- Язык продукта: русский (UI, ошибки валидации, seed-контент).
- Целевая аудитория:
  - Клиенты автосервиса (владельцы авто)
  - Операторы/администраторы детейлинг-студии
  - Мастера (исполнители услуг)

## 2. Функциональный охват

### 2.1 Клиент
- Регистрация и вход (по email + пароль).
- Просмотр списка мастерских (точек) с адресом, графиком, фотографиями и расположением на карте.
- Выбор мастерской и просмотр доступных в ней услуг.
- Создание записи на услугу:
  - выбор мастерской
  - выбор автомобиля
  - выбор услуги мастерской
  - выбор даты/времени из доступных слотов
  - комментарий к заказу
- Просмотр своих записей.
- Отмена своей записи до начала выполнения (не позднее чем за 2 часа).
- Оставление отзывов:
  - о мастерской
  - о мастере
  - об услуге

### 2.2 Администратор
- Управление справочниками:
  - мастерские (точки)
  - услуги мастерских
  - мастера и привязка мастеров к мастерским
  - рабочие смены мастеров
- Загрузка фотографий мастерской.
- Просмотр всех записей с фильтрами по статусу/дате/мастерской/мастеру.
- Подтверждение, перевод по статусам, отмена.
- Назначение мастера на запись.
- Модерация отзывов (скрыть/показать).
- Просмотр дашборда: количество записей, выручка, загрузка мастеров и точек за период.

### 2.3 Мастер
- Просмотр назначенных ему записей.
- Перевод статусов в рамках разрешенного workflow:
  - `CONFIRMED -> IN_PROGRESS -> COMPLETED`
- Добавление результата/комментария по выполненной услуге.
- Просмотр отзывов о себе.

## 3. Модель доступа
Роль-ориентированная модель (RBAC).

- `CLIENT`
  - свои автомобили: CRUD
  - свои записи: create/read/cancel
  - создание отзывов на завершенные услуги
  - нет доступа к админ-разделам и управлению справочниками

- `MASTER`
  - просмотр только назначенных ему записей
  - изменение статуса только в допустимых переходах
  - просмотр отзывов о себе
  - нет доступа к редактированию мастерских/услуг/пользователей

- `ADMIN`
  - полный доступ к мастерским, услугам, мастерам, сменам
  - управление назначениями мастеров
  - модерация отзывов
  - просмотр агрегированной аналитики

## 4. Сущности и данные

### 4.1 Основные таблицы
- `users`
  - id, full_name, email (unique), password_hash, role, phone, is_active, created_at, updated_at
- `workshops`
  - id, name, description, address, city, latitude, longitude, phone, working_hours, is_active, created_at, updated_at
- `workshop_photos`
  - id, workshop_id(FK workshops), photo_url, sort_order, is_cover
- `cars`
  - id, client_id(FK users), brand, model, year, plate_number, color, notes
- `services`
  - id, workshop_id(FK workshops), name, description, duration_minutes, price, is_active
- `masters`
  - id, user_id(FK users), workshop_id(FK workshops), specialization, experience_years, is_active
- `master_shifts`
  - id, master_id(FK masters), shift_date, start_time, end_time
- `appointments`
  - id, client_id(FK users), workshop_id(FK workshops), car_id(FK cars), service_id(FK services), master_id(FK masters, nullable),
  - scheduled_start, scheduled_end, status, total_price, client_comment, result_comment,
  - created_at, updated_at, cancelled_at, cancel_reason
- `appointment_status_history`
  - id, appointment_id(FK appointments), from_status, to_status, changed_by(FK users), changed_at, comment
- `reviews`
  - id, client_id(FK users), appointment_id(FK appointments), target_type(`SERVICE|MASTER|WORKSHOP`),
  - service_id(nullable), master_id(nullable), workshop_id(nullable),
  - rating(1..5), comment, is_visible, created_at

### 4.2 Статусы записи
- `NEW`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### 4.3 Ключевые ограничения
- У клиента не может быть 2 записи на одно и то же время (`client_id + scheduled_start`).
- У мастера не может быть пересечений слотов в подтвержденных/активных записях.
- Услуга и мастер должны принадлежать выбранной мастерской.
- `scheduled_end` = `scheduled_start + duration_minutes`.
- Отмена клиентом запрещена менее чем за 2 часа до `scheduled_start`.
- Отзыв можно оставить только по завершенной записи и только один отзыв на конкретный target в рамках записи.
- Переходы статусов валидируются на backend.

## 5. API контракты (v1)
Префикс: `/api/v1`

### 5.1 Auth
- `POST /auth/login`
  - request: `{ email, password }`
  - response: `{ token, user: { id, fullName, email, role } }`
- `GET /auth/me` (JWT)
  - response: `{ id, fullName, email, role }`

### 5.2 Публичные/клиентские ресурсы
- `GET /workshops` - список активных точек с координатами и фото
- `GET /workshops/{id}` - детальная карточка точки
- `GET /workshops/{id}/services` - услуги выбранной точки
- `GET /services/{id}/reviews` / `GET /masters/{id}/reviews` / `GET /workshops/{id}/reviews`
- `GET /cars/my` / `POST /cars` / `PUT /cars/{id}` / `DELETE /cars/{id}` (`CLIENT`)
- `GET /appointments/my` (`CLIENT`)
- `POST /appointments` (`CLIENT`)
- `POST /appointments/{id}/cancel` (`CLIENT` для своих, `ADMIN` для любых)
- `POST /reviews` (`CLIENT`)

### 5.3 Административные ресурсы
- `GET /admin/workshops` / `POST /admin/workshops` / `PUT /admin/workshops/{id}` (`ADMIN`)
- `POST /admin/workshops/{id}/photos` / `DELETE /admin/workshops/{id}/photos/{photoId}` (`ADMIN`)
- `GET /admin/appointments` (`ADMIN`)
- `PATCH /admin/appointments/{id}/assign-master` (`ADMIN`)
- `PATCH /admin/appointments/{id}/status` (`ADMIN`)
- `POST /admin/services` / `PUT /admin/services/{id}` / `PATCH /admin/services/{id}/active` (`ADMIN`)
- `POST /admin/masters` / `PUT /admin/masters/{id}` (`ADMIN`)
- `POST /admin/masters/shifts` (`ADMIN`)
- `PATCH /admin/reviews/{id}/visibility` (`ADMIN`)
- `GET /admin/dashboard` (`ADMIN`)

### 5.4 Ресурсы мастера
- `GET /master/appointments` (`MASTER`)
- `PATCH /master/appointments/{id}/status` (`MASTER`)
- `GET /master/reviews/me` (`MASTER`)

### 5.5 Ошибки и коды
- `400` - ошибки валидации
- `401` - неавторизован
- `403` - нет прав
- `404` - не найдено
- `409` - конфликт расписания/статуса
- `422` - бизнес-правило нарушено

## 6. UI страницы
- `/login` - вход
- `/dashboard` - главная (виджеты и быстрые действия по роли)
- `/workshops` - точки на карте + список карточек
- `/workshops/:id` - страница точки (фото, услуги, отзывы)
- `/services` - каталог услуг по выбранной точке
- `/my-cars` - мои автомобили (`CLIENT`)
- `/my-appointments` - мои записи (`CLIENT`)
- `/reviews/new` - создание отзыва (`CLIENT`)
- `/master/tasks` - задачи мастера (`MASTER`)
- `/master/reviews` - отзывы о мастере (`MASTER`)
- `/admin/workshops` - управление точками и фото (`ADMIN`)
- `/admin/appointments` - управление записями (`ADMIN`)
- `/admin/services` - управление услугами (`ADMIN`)
- `/admin/shifts` - смены мастеров (`ADMIN`)
- `/admin/reviews` - модерация отзывов (`ADMIN`)

## 7. UX и дизайн
- Современный светлый интерфейс, строгая корпоративная стилистика (графит + синий акцент).
- Адаптивность: mobile-first + desktop.
- На странице точек: карта с маркерами мастерских и синхронизированный список справа/снизу.
- Страница точки: галерея фотографий, контакты, отзывы, кнопка «Записаться».
- Понятные состояния: загрузка, пустой список, ошибка, успех.
- Все тексты, лейблы, плейсхолдеры и сообщения на русском.

## 8. Seed и тестовые пользователи

### 8.1 Seed-файлы
Директория: `product-api/seed-data/`
- `workshops.json`
- `workshop_photos.json`
- `services.json`
- `masters.json`
- `master_shifts.json`
- `cars.json`
- `appointments.json`
- `reviews.json`

Требования:
- идемпотентная загрузка (upsert)
- реалистичные связные данные
- минимум 3 мастерские с разным набором услуг и мастеров
- достаточно записей для фильтров и E2E

### 8.2 Тестовые пользователи
Генерация на старте API в local/dev/test + запись в `product-api/users.txt`.

Плановые пользователи:
- `ADMIN`: 1 пользователь
- `MASTER`: 3 пользователя
- `CLIENT`: 4 пользователя

Формат строки:
`email=<email>; password=<password>; role=<ROLE>`

## 9. E2E scope (Playwright)

### 9.1 Обязательные сценарии
- Логин каждым типом пользователя из `users.txt`.
- `CLIENT`:
  - просмотр точек на карте
  - просмотр страницы точки с фото
  - создание авто
  - создание записи в выбранную точку
  - создание отзыва после завершения записи
  - проверка недоступности админ-маршрутов
- `MASTER`:
  - доступ только к назначенным задачам
  - смена статуса `CONFIRMED -> IN_PROGRESS -> COMPLETED`
  - просмотр отзывов о себе
  - запрет на админ-операции
- `ADMIN`:
  - добавление новой точки
  - загрузка/удаление фото точки
  - управление услугами и назначением мастеров
  - модерация отзывов
  - проверка dashboard

### 9.2 Скриншоты
Full-page скриншоты в `product-web/artifacts/screenshots/`:
- `login.png`
- `workshops-map.png`
- `workshop-detail.png`
- `dashboard-admin.png`
- `dashboard-client.png`
- `dashboard-master.png`
- `client-my-appointments.png`
- `admin-workshops.png`
- `admin-appointments.png`
- `admin-reviews.png`
- `master-tasks.png`

## 10. Критерии приемки
- API поднимается через `docker compose up -d --build`.
- Web запускается через `npm run dev`.
- JWT-аутентификация и RBAC работают согласованно в API и UI.
- Услуги и мастера жестко привязаны к мастерской в БД и в UI flow записи.
- Все ключевые таблицы заполнены seed-данными.
- `users.txt` формируется и пригоден для парсинга тестами.
- `npx playwright test` проходит успешно.
- Скриншоты присутствуют в целевой директории и отражают финальное состояние.
- Есть unit-тесты core-логики и интеграционные тесты security/ключевых контроллеров.

## 11. Нефункциональные требования
- Чистая архитектура слоев (controller/service/repository).
- DTO для входа/выхода API.
- Валидация входных данных (`jakarta.validation`).
- Пароли только BCrypt.
- Swagger UI доступен по `/swagger-ui`.
- Логи ошибок без утечки чувствительных данных.
- Карта на вебе должна работать без ключа стороннего провайдера (например, Leaflet + OpenStreetMap).
