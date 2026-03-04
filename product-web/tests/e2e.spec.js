import { test, expect } from '@playwright/test'
import { loadUsers, login } from './utils'

const users = loadUsers()

test('Логин и карта точек', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Онлайн-запись на детейлинг')).toBeVisible()
  await page.screenshot({ path: 'artifacts/screenshots/login.png', fullPage: true })

  await login(page, users.CLIENT[0])
  await page.goto('/workshops')
  await expect(page.getByText('Точки обслуживания')).toBeVisible()
  await page.screenshot({ path: 'artifacts/screenshots/workshops-map.png', fullPage: true })

  const workshops = await (await page.request.get('http://localhost:8080/api/v1/workshops')).json()
  await page.goto(`/workshops/${workshops[0].id}`)
  await expect(page.locator('h1')).toBeVisible()
  await page.screenshot({ path: 'artifacts/screenshots/workshop-detail.png', fullPage: true })
  await page.goto('/dashboard')
  await page.screenshot({ path: 'artifacts/screenshots/dashboard-client.png', fullPage: true })
})

test('Клиент создает авто и запись', async ({ page }) => {
  await login(page, users.CLIENT[1])

  await page.goto('/my-cars')
  const plate = `T${Date.now().toString().slice(-5)}TT163`
  await page.getByPlaceholder('Марка').fill('Skoda')
  await page.getByPlaceholder('Модель').fill('Octavia')
  await page.getByPlaceholder('Госномер').fill(plate)
  await page.getByRole('button', { name: 'Добавить авто' }).click()

  const token = await page.evaluate(() => localStorage.getItem('token'))
  const workshops = await (await page.request.get('http://localhost:8080/api/v1/workshops', { headers: { Authorization: `Bearer ${token}` } })).json()
  let workshopId = workshops[0].id
  let serviceId = null
  for (const workshop of workshops) {
    const services = await (await page.request.get(`http://localhost:8080/api/v1/workshops/${workshop.id}/services`, { headers: { Authorization: `Bearer ${token}` } })).json()
    if (services.length > 0) {
      workshopId = workshop.id
      serviceId = services[0].id
      break
    }
  }
  const cars = await (await page.request.get('http://localhost:8080/api/v1/cars/my', { headers: { Authorization: `Bearer ${token}` } })).json()
  const carId = cars.find((c) => c.plateNumber === plate)?.id || cars[0].id
  if (!serviceId) {
    throw new Error('Не найдены услуги для записи')
  }
  const future = new Date(Date.now() + 1000 * 60 * 60 * 48)
  const value = future.toISOString().slice(0, 16)
  await page.request.post('http://localhost:8080/api/v1/appointments', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      workshopId,
      carId,
      serviceId,
      scheduledStart: `${value}:00`,
      clientComment: 'Тестовая запись из E2E',
    },
  })

  await page.goto('/my-appointments')
  await expect(page.getByText('Статус: NEW').first()).toBeVisible()
  await page.screenshot({ path: 'artifacts/screenshots/client-my-appointments.png', fullPage: true })
})

test('Админ и мастер: управление и ограничения', async ({ browser }) => {
  const admin = await browser.newPage()
  await login(admin, users.ADMIN[0])
  await admin.goto('/dashboard')
  await admin.screenshot({ path: 'artifacts/screenshots/dashboard-admin.png', fullPage: true })

  await admin.goto('/admin/workshops')
  await admin.getByPlaceholder('Название точки').fill(`Новая точка ${Date.now().toString().slice(-4)}`)
  await admin.getByPlaceholder('Адрес').fill('ул. Тестовая, 1')
  await admin.getByRole('button', { name: 'Добавить точку' }).first().click()
  await admin.screenshot({ path: 'artifacts/screenshots/admin-workshops.png', fullPage: true })

  await admin.goto('/admin/services')
  await admin.screenshot({ path: 'artifacts/screenshots/admin-services.png', fullPage: true })

  await admin.goto('/admin/appointments')
  await admin.screenshot({ path: 'artifacts/screenshots/admin-appointments.png', fullPage: true })

  await admin.goto('/admin/reviews')
  await admin.screenshot({ path: 'artifacts/screenshots/admin-reviews.png', fullPage: true })

  const master = await browser.newPage()
  await login(master, users.MASTER[0])
  await master.goto('/dashboard')
  await master.screenshot({ path: 'artifacts/screenshots/dashboard-master.png', fullPage: true })

  await master.goto('/master/tasks')
  await master.screenshot({ path: 'artifacts/screenshots/master-tasks.png', fullPage: true })

  await master.goto('/admin/workshops')
  await expect(master).toHaveURL(/dashboard/)

  await admin.close()
  await master.close()
})
