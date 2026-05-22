-- Reset all domain data and repopulate deterministic test dataset
TRUNCATE TABLE
    appointment_service_items,
    appointment_services,
    appointment_status_history,
    reviews,
    appointments,
    master_shifts,
    masters,
    service_items,
    services,
    workshop_photos,
    cars,
    ai_master_feedback,
    ai_workshop_feedback,
    ai_feedback_summaries,
    ai_token_usage,
    workshops,
    users
RESTART IDENTITY CASCADE;

INSERT INTO users (full_name, email, password_hash, role, phone, is_active) VALUES
('Admin Детейлинг', 'admin@detailing.local', '$2y$10$J4SJDy1xQ.TR8aa4g.AzaOvDZCPd0eA7I12tW87/sAH2ta7sUJiRO', 'ADMIN', '+7 (900) 000-00-01', TRUE),
('Иван Петров', 'master1@detailing.local', '$2y$10$oKh.xoEOEadprXlBoY2.1uQvYR3iYBHbGyW7ZOKit8j.l6/vZEg62', 'MASTER', '+7 (900) 000-00-02', TRUE),
('Сергей Волков', 'master2@detailing.local', '$2y$10$oKh.xoEOEadprXlBoY2.1uQvYR3iYBHbGyW7ZOKit8j.l6/vZEg62', 'MASTER', '+7 (900) 000-00-03', TRUE),
('Артем Козлов', 'master3@detailing.local', '$2y$10$oKh.xoEOEadprXlBoY2.1uQvYR3iYBHbGyW7ZOKit8j.l6/vZEg62', 'MASTER', '+7 (900) 000-00-04', TRUE),
('Роман Нестеров', 'client1@detailing.local', '$2y$10$SAfktV8TjRuJiLS0enewn.Tl6XWbY1pr29O.5kq0kReuy/Zg8jfwm', 'CLIENT', '+7 (900) 000-00-11', TRUE),
('Екатерина Миронова', 'client2@detailing.local', '$2y$10$SAfktV8TjRuJiLS0enewn.Tl6XWbY1pr29O.5kq0kReuy/Zg8jfwm', 'CLIENT', '+7 (900) 000-00-12', TRUE),
('Михаил Соколов', 'client3@detailing.local', '$2y$10$SAfktV8TjRuJiLS0enewn.Tl6XWbY1pr29O.5kq0kReuy/Zg8jfwm', 'CLIENT', '+7 (900) 000-00-13', TRUE),
('Анна Васильева', 'client4@detailing.local', '$2y$10$SAfktV8TjRuJiLS0enewn.Tl6XWbY1pr29O.5kq0kReuy/Zg8jfwm', 'CLIENT', '+7 (900) 000-00-14', TRUE);

INSERT INTO workshops (name, description, address, city, latitude, longitude, phone, working_hours, is_active) VALUES
('Detailing Center Самара', 'Флагманский детейлинг-центр с полным циклом услуг', 'ул. Ново-Садовая, 20', 'Самара', 53.2112, 50.1778, '+7 (846) 200-11-22', 'Ежедневно 09:00-21:00', TRUE),
('Detailing Studio Волга', 'Студия локального и премиального ухода за авто', 'Московское шоссе, 34', 'Самара', 53.2364, 50.1905, '+7 (846) 211-44-55', 'Пн-Сб 10:00-20:00', TRUE);

INSERT INTO workshop_photos (workshop_id, photo_url, sort_order, is_cover) VALUES
(1, 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9', 1, TRUE),
(1, 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc', 2, FALSE),
(1, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c', 3, FALSE),
(2, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70', 1, TRUE),
(2, 'https://images.unsplash.com/photo-1542362567-b07e54358753', 2, FALSE);

INSERT INTO services (workshop_id, name, description, duration_minutes, price, is_active) VALUES
(1, 'Комплексная мойка', 'Бережная двухфазная мойка кузова и проемов', 90, 2500.00, TRUE),
(1, 'Химчистка салона', 'Глубокая химчистка сидений, пола и пластика', 240, 12000.00, TRUE),
(1, 'Полировка кузова', 'Восстановительная полировка с удалением паутинки', 360, 18000.00, TRUE),
(2, 'Нанесение керамики', 'Защитное покрытие кузова на 12 месяцев', 420, 35000.00, TRUE),
(2, 'Антидождь стекол', 'Гидрофобное покрытие лобового и боковых стекол', 60, 3500.00, TRUE),
(2, 'Предпродажная подготовка', 'Чистка, мойка и легкая полировка для продажи', 300, 15000.00, TRUE);

INSERT INTO service_items (service_id, kind, name, description, price, choice_group_key, default_selected, sort_order) VALUES
(1, 'BASE', 'Двухфазная мойка', 'Пена, ручная мойка и сушка', 0.00, NULL, TRUE, 1),
(1, 'OPTION', 'Очистка дисков', 'Удаление металлических вкраплений', 700.00, NULL, FALSE, 2),
(1, 'OPTION', 'Консервант шин', 'Чернение и защита резины', 400.00, NULL, FALSE, 3),
(2, 'BASE', 'Глубокая химчистка', 'Сиденья, ковры, потолок, багажник', 0.00, NULL, TRUE, 1),
(2, 'OPTION', 'Озонация салона', 'Нейтрализация запахов', 1200.00, NULL, FALSE, 2),
(3, 'BASE', 'Одношаговая полировка', 'Базовое восстановление блеска', 0.00, 'polish_level', TRUE, 1),
(3, 'ALTERNATIVE', 'Двухшаговая полировка', 'Глубокое восстановление ЛКП', 6000.00, 'polish_level', FALSE, 2),
(4, 'BASE', 'Подготовка кузова', 'Обезжиривание и очистка перед нанесением', 0.00, NULL, TRUE, 1),
(4, 'OPTION', 'Керамика на диски', 'Дополнительная защита колес', 4500.00, NULL, FALSE, 2),
(5, 'BASE', 'Нанесение антидождя', 'Покрытие передней полусферы', 0.00, NULL, TRUE, 1),
(6, 'BASE', 'Базовая предпродажная подготовка', 'Комплекс работ перед публикацией объявления', 0.00, NULL, TRUE, 1),
(6, 'OPTION', 'Фото для объявления', 'Съемка 15 кадров для площадок', 2500.00, NULL, FALSE, 2);

INSERT INTO masters (user_id, workshop_id, specialization, experience_years, is_active, photo_url) VALUES
((SELECT id FROM users WHERE email = 'master1@detailing.local'), 1, 'Полировка и защитные покрытия', 6, TRUE, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df'),
((SELECT id FROM users WHERE email = 'master2@detailing.local'), 1, 'Химчистка и комплексная мойка', 4, TRUE, 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c'),
((SELECT id FROM users WHERE email = 'master3@detailing.local'), 2, 'Керамика и предпродажная подготовка', 8, TRUE, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e');

INSERT INTO master_shifts (master_id, shift_date, start_time, end_time) VALUES
(1, CURRENT_DATE + 1, TIME '09:00', TIME '18:00'),
(1, CURRENT_DATE + 2, TIME '10:00', TIME '19:00'),
(2, CURRENT_DATE + 1, TIME '09:00', TIME '17:00'),
(2, CURRENT_DATE + 3, TIME '11:00', TIME '20:00'),
(3, CURRENT_DATE + 1, TIME '10:00', TIME '19:00'),
(3, CURRENT_DATE + 2, TIME '10:00', TIME '19:00');

INSERT INTO cars (client_id, brand, model, car_year, plate_number, color, notes) VALUES
((SELECT id FROM users WHERE email='client1@detailing.local'), 'BMW', 'X5', 2021, 'A111AA763', 'Черный', 'Нужна деликатная мойка матовых элементов'),
((SELECT id FROM users WHERE email='client2@detailing.local'), 'Toyota', 'Camry', 2019, 'B222BB763', 'Белый', 'Следы от реагентов на дисках'),
((SELECT id FROM users WHERE email='client3@detailing.local'), 'Kia', 'Sportage', 2020, 'C333CC763', 'Серый', 'Подготовка к семейной поездке'),
((SELECT id FROM users WHERE email='client4@detailing.local'), 'Mercedes-Benz', 'E200', 2022, 'E444EE763', 'Синий', 'Предпродажная подготовка в приоритете');

INSERT INTO appointments (
    client_id, workshop_id, car_id, service_id, master_id,
    scheduled_start, scheduled_end, status, total_price, client_comment, result_comment,
    payment_method, payment_status, paid_at, cancelled_at, cancel_reason
) VALUES
(
    (SELECT id FROM users WHERE email='client1@detailing.local'),
    1,
    (SELECT id FROM cars WHERE plate_number='A111AA763'),
    1,
    2,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days' + INTERVAL '90 minutes',
    'COMPLETED',
    3600.00,
    'Нужна чистка дисков и чернение шин',
    'Работа выполнена, клиент доволен',
    'CARD',
    'PAID',
    NOW() - INTERVAL '8 days' + INTERVAL '95 minutes',
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='client2@detailing.local'),
    1,
    (SELECT id FROM cars WHERE plate_number='B222BB763'),
    2,
    2,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '240 minutes',
    'IN_PROGRESS',
    13200.00,
    'Добавить озонацию салона',
    NULL,
    NULL,
    'UNPAID',
    NULL,
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='client3@detailing.local'),
    2,
    (SELECT id FROM cars WHERE plate_number='C333CC763'),
    4,
    3,
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '420 minutes',
    'CONFIRMED',
    39500.00,
    'Добавить керамику на диски',
    NULL,
    NULL,
    'UNPAID',
    NULL,
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='client4@detailing.local'),
    2,
    (SELECT id FROM cars WHERE plate_number='E444EE763'),
    6,
    3,
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '300 minutes',
    'NEW',
    17500.00,
    'Нужно успеть до выходных',
    NULL,
    NULL,
    'UNPAID',
    NULL,
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='client2@detailing.local'),
    1,
    (SELECT id FROM cars WHERE plate_number='B222BB763'),
    3,
    1,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days' + INTERVAL '360 minutes',
    'CANCELLED',
    18000.00,
    'Переносил из-за командировки',
    NULL,
    NULL,
    'UNPAID',
    NULL,
    NOW() - INTERVAL '11 days' + INTERVAL '2 hours',
    'Клиент отменил по личным обстоятельствам'
);

INSERT INTO appointment_services (appointment_id, service_id)
SELECT a.id, s.id
FROM appointments a
JOIN services s ON s.id = a.service_id;

INSERT INTO appointment_service_items (appointment_id, service_item_id) VALUES
((SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1), (SELECT id FROM service_items WHERE service_id=1 AND name='Очистка дисков')),
((SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1), (SELECT id FROM service_items WHERE service_id=1 AND name='Консервант шин')),
((SELECT id FROM appointments WHERE status='IN_PROGRESS' ORDER BY id LIMIT 1), (SELECT id FROM service_items WHERE service_id=2 AND name='Озонация салона')),
((SELECT id FROM appointments WHERE status='CONFIRMED' ORDER BY id LIMIT 1), (SELECT id FROM service_items WHERE service_id=4 AND name='Керамика на диски')),
((SELECT id FROM appointments WHERE status='NEW' ORDER BY id LIMIT 1), (SELECT id FROM service_items WHERE service_id=6 AND name='Фото для объявления'));

INSERT INTO appointment_status_history (appointment_id, from_status, to_status, changed_by, changed_at, comment) VALUES
((SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1), NULL, 'NEW', (SELECT id FROM users WHERE email='client1@detailing.local'), NOW() - INTERVAL '9 days', 'Создана заявка'),
((SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1), 'NEW', 'CONFIRMED', (SELECT id FROM users WHERE email='admin@detailing.local'), NOW() - INTERVAL '8 days 20 hours', 'Подтверждено администратором'),
((SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1), 'CONFIRMED', 'IN_PROGRESS', (SELECT id FROM users WHERE email='master2@detailing.local'), NOW() - INTERVAL '8 days 2 hours', 'Авто принято в работу'),
((SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1), 'IN_PROGRESS', 'COMPLETED', (SELECT id FROM users WHERE email='master2@detailing.local'), NOW() - INTERVAL '8 days', 'Работы завершены'),
((SELECT id FROM appointments WHERE status='CANCELLED' ORDER BY id LIMIT 1), NULL, 'NEW', (SELECT id FROM users WHERE email='client2@detailing.local'), NOW() - INTERVAL '13 days', 'Первичное бронирование'),
((SELECT id FROM appointments WHERE status='CANCELLED' ORDER BY id LIMIT 1), 'NEW', 'CANCELLED', (SELECT id FROM users WHERE email='client2@detailing.local'), NOW() - INTERVAL '11 days', 'Отменено клиентом');

INSERT INTO reviews (client_id, appointment_id, target_type, service_id, master_id, workshop_id, rating, comment, is_visible, moderation_status, rejection_reason, ai_moderated_at) VALUES
(
    (SELECT id FROM users WHERE email='client1@detailing.local'),
    (SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1),
    'MASTER',
    (SELECT id FROM services WHERE name='Комплексная мойка' AND workshop_id=1),
    2,
    1,
    5,
    'Очень аккуратно и быстро, отличный результат',
    TRUE,
    'APPROVED',
    NULL,
    NOW() - INTERVAL '7 days'
),
(
    (SELECT id FROM users WHERE email='client1@detailing.local'),
    (SELECT id FROM appointments WHERE status='COMPLETED' ORDER BY id LIMIT 1),
    'WORKSHOP',
    NULL,
    NULL,
    1,
    4,
    'Удобная зона ожидания и вежливые сотрудники',
    TRUE,
    'APPROVED',
    NULL,
    NOW() - INTERVAL '7 days'
),
(
    (SELECT id FROM users WHERE email='client2@detailing.local'),
    (SELECT id FROM appointments WHERE status='IN_PROGRESS' ORDER BY id LIMIT 1),
    'SERVICE',
    (SELECT id FROM services WHERE name='Химчистка салона' AND workshop_id=1),
    NULL,
    1,
    3,
    'Пока ожидание дольше, чем планировалось',
    FALSE,
    'REJECTED',
    'Содержит неподтвержденные факты о сотрудниках',
    NOW() - INTERVAL '2 days'
);

INSERT INTO ai_feedback_summaries (target_type, summary, based_on_review_created_at, updated_at) VALUES
('WORKSHOP', 'Клиенты отмечают комфортную зону ожидания и вежливое обслуживание.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
('MASTER', 'По мастерам преобладает позитив: аккуратность и соблюдение сроков.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
('SERVICE', 'По отдельным услугам есть запрос на более предсказуемые сроки выполнения.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

INSERT INTO ai_workshop_feedback (workshop_id, summary, based_on_review_created_at, updated_at) VALUES
(1, 'Площадка получает стабильно высокую оценку за сервис и коммуникацию.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
(2, 'Для второй площадки отзывов меньше, но оценки по качеству работ высокие.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

INSERT INTO ai_master_feedback (master_id, summary, based_on_review_created_at, updated_at) VALUES
(1, 'Хороший уровень экспертности по полировке, но мало свежих отзывов.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
(2, 'Клиенты отдельно отмечают аккуратность и вежливость.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
(3, 'Сильная экспертиза в керамике и предпродажной подготовке.', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day');

INSERT INTO ai_token_usage (usage_date, used_tokens, updated_at) VALUES
(CURRENT_DATE - 2, 2480, NOW() - INTERVAL '2 days'),
(CURRENT_DATE - 1, 3120, NOW() - INTERVAL '1 day'),
(CURRENT_DATE, 940, NOW());
