import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'
import { loadUsers, login } from './utils'
import { createMockApi } from './mockApi'

const users = loadUsers()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const screenshotDir = path.resolve(__dirname, '../artifacts/screenshots')

fs.mkdirSync(screenshotDir, { recursive: true })

function shot(name) {
  return path.join(screenshotDir, name)
}

async function capture(page, fileName) {
  await page.screenshot({ path: shot(fileName), fullPage: true })
}

test.describe.configure({ mode: 'serial' })

test('Публичные экраны и авторизация', async ({ page }) => {
  const mock = createMockApi()
  await mock.install(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Премиальный детейлинг в Самаре' })).toBeVisible()
  await capture(page, '01-landing-page.png')

  await page.goto('/login')
  await expect(page.getByText('Онлайн-запись на детейлинг')).toBeVisible()
  await capture(page, '02-login-page.png')

  await page.goto('/register')
  await expect(page.getByRole('heading', { name: 'Регистрация' })).toBeVisible()
  await capture(page, '03-register-page.png')

  await page.goto('/workshops')
  await expect(page.getByRole('heading', { name: 'Салоны' })).toBeVisible()
  await capture(page, '04-workshops-page.png')

  const workshop = mock.state.workshops[0]
  await page.goto(`/workshops/${workshop.id}`)
  await expect(page.locator('h1')).toBeVisible()
  await capture(page, '05-workshop-detail-page.png')

  const master = mock.state.masters.find((item) => item.workshopId === workshop.id)
  await page.goto(`/workshops/${workshop.id}/masters/${master.id}`)
  await expect(page.locator('h1')).toBeVisible()
  await capture(page, '06-master-detail-page.png')

  await page.goto('/services')
  await expect(page.getByRole('heading', { name: 'Услуги и прайс' })).toBeVisible()
  await capture(page, '07-services-page.png')

  await page.goto('/reviews')
  await expect(page.getByRole('heading', { name: 'Отзывы', exact: true })).toBeVisible()
  await capture(page, '08-public-reviews-page.png')
})

test('Клиентские экраны, детали записи и оплата', async ({ page }) => {
  const mock = createMockApi()
  await mock.install(page)

  await login(page, users.CLIENT[1])

  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Панель управления' })).toBeVisible()
  await capture(page, '09-dashboard-client.png')

  await page.goto('/my-cars')
  await expect(page.getByRole('heading', { name: 'Мои автомобили' })).toBeVisible()
  await capture(page, '10-client-my-cars-page.png')

  const plate = `T${Date.now().toString().slice(-5)}TT163`
  await page.getByPlaceholder('Марка').fill('Skoda')
  await page.getByPlaceholder('Модель').fill('Octavia')
  await page.getByPlaceholder('Год').fill('2024')
  await page.getByPlaceholder('Госномер').fill(plate)
  await page.getByPlaceholder('Цвет').fill('Серый')
  await page.getByPlaceholder('Примечание').fill('Тестовый автомобиль для скриншотов')
  await page.getByRole('button', { name: 'Добавить авто' }).click()

  const workshopId = mock.state.workshops[0].id
  const serviceId = mock.state.services.find((item) => item.workshopId === workshopId).id
  const carId = mock.state.cars.find((item) => item.plateNumber === plate)?.id

  await page.goto(`/my-cars/${carId}`)
  await expect(page.getByRole('heading', { name: 'Автомобиль' })).toBeVisible()
  await capture(page, '11-client-car-detail-page.png')

  const future = new Date(Date.now() + 1000 * 60 * 60 * 48)
  const value = future.toISOString().slice(0, 16)
  await page.goto(`/my-appointments?workshopId=${workshopId}&serviceId=${serviceId}&carId=${carId}`)
  await page.locator('input[type="datetime-local"]').fill(value)
  await page.getByPlaceholder('Комментарий').fill('Тестовая запись из E2E')
  await page.getByRole('button', { name: 'Записаться' }).click()
  const createdAppointment = mock.state.appointments.find((item) => item.clientEmail === users.CLIENT[1].email && item.clientComment === 'Тестовая запись из E2E')

  await page.goto('/my-appointments')
  await expect(page.getByRole('heading', { name: 'Мои записи' })).toBeVisible()
  await capture(page, '12-client-my-appointments-page.png')

  await page.goto(`/my-appointments/${createdAppointment.id}`)
  await expect(page.getByRole('heading', { name: 'Запись' })).toBeVisible()
  await capture(page, '13-client-appointment-detail-page.png')

  await page.goto(`/my-appointments/${createdAppointment.id}/pay`)
  await expect(page.getByRole('heading', { name: 'Оплата' })).toBeVisible()
  await capture(page, '14-client-payment-page.png')
})

test('Мастер и администратор: кабинеты и ограничения доступа', async ({ browser }) => {
  const mock = createMockApi()

  const master = await browser.newPage()
  await mock.install(master)
  await login(master, users.MASTER[0])
  await master.goto('/dashboard')
  await expect(master.getByRole('heading', { name: 'Панель управления' })).toBeVisible()
  await capture(master, '15-dashboard-master.png')

  await master.goto('/master/tasks')
  await expect(master.getByRole('heading', { name: 'Мои задачи' })).toBeVisible()
  await capture(master, '16-master-tasks-page.png')

  await master.goto('/master/reviews')
  await expect(master.getByRole('heading', { name: 'Отзывы о мастере' })).toBeVisible()
  await capture(master, '17-master-reviews-page.png')

  await master.goto('/admin/workshops')
  await expect(master).toHaveURL(/\/dashboard$/)

  const admin = await browser.newPage()
  await mock.install(admin)
  await login(admin, users.ADMIN[0])
  await admin.goto('/dashboard')
  await expect(admin.getByRole('heading', { name: 'Панель управления' })).toBeVisible()
  await capture(admin, '18-dashboard-admin.png')

  await admin.goto('/admin/workshops')
  await expect(admin.getByRole('heading', { name: 'Управление салонами' })).toBeVisible()
  await capture(admin, '19-admin-workshops-page.png')

  await admin.goto('/admin/services')
  await expect(admin.getByRole('heading', { name: 'Управление услугами' })).toBeVisible()
  await capture(admin, '20-admin-services-page.png')

  await admin.goto('/admin/appointments')
  await expect(admin.getByRole('heading', { name: 'Записи клиентов' })).toBeVisible()
  await capture(admin, '21-admin-appointments-page.png')

  await admin.goto('/admin/reviews')
  await expect(admin.getByRole('heading', { name: 'AI‑модерация отзывов' })).toBeVisible()
  await capture(admin, '22-admin-reviews-page.png')

  await admin.close()
  await master.close()
})
