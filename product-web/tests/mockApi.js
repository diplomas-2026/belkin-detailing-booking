import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const seedDir = path.resolve(repoRoot, 'product-api/seed-data')
const usersFile = path.resolve(repoRoot, 'product-api/users.txt')

const userNames = {
  'admin@detailing.local': 'Администратор системы',
  'master1@detailing.local': 'Артем Михайлов',
  'master2@detailing.local': 'Илья Громов',
  'master3@detailing.local': 'Никита Корнев',
  'client1@detailing.local': 'Иван Петров',
  'client2@detailing.local': 'Мария Смирнова',
  'client3@detailing.local': 'Анна Кузнецова',
  'client4@detailing.local': 'Дмитрий Волков',
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(seedDir, name), 'utf-8'))
}

function parseUsers() {
  return fs
    .readFileSync(usersFile, 'utf-8')
    .trim()
    .split('\n')
    .map((row, index) => {
      const parts = Object.fromEntries(
        row.split(';').map((segment) => {
          const [key, value] = segment.trim().split('=')
          return [key, value]
        }),
      )

      return {
        id: index + 1,
        email: parts.email,
        password: parts.password,
        role: parts.role,
        fullName: userNames[parts.email] || parts.email,
        token: `token-${parts.role}-${index + 1}`,
      }
    })
}

function isoWithOffset(value, fallbackHour = 10) {
  if (!value) {
    return new Date(Date.UTC(2026, 2, 10, fallbackHour, 0, 0)).toISOString()
  }

  if (value.includes('T')) {
    return `${value}+04:00`
  }

  return `${value}T${String(fallbackHour).padStart(2, '0')}:00:00+04:00`
}

function createIdGenerator(start) {
  let current = start
  return () => current++
}

function normalizeServiceName(value = '') {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '')
    .trim()
}

function parseBody(route) {
  const raw = route.request().postData()
  return raw ? JSON.parse(raw) : {}
}

function json(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    headers: {
      'cache-control': 'no-store',
    },
    body: JSON.stringify(payload),
  })
}

function notFound(route, message = 'Не найдено') {
  return json(route, { message }, 404)
}

function forbidden(route, message = 'Нет доступа') {
  return json(route, { message }, 403)
}

function unauthorized(route, message = 'Требуется авторизация') {
  return json(route, { message }, 401)
}

export function createMockApi() {
  const users = parseUsers()
  const usersByEmail = new Map(users.map((user) => [user.email, user]))
  const usersByToken = new Map(users.map((user) => [user.token, user]))

  const workshops = readJson('workshops.json').map((item, index) => ({
    id: index + 1,
    ...item,
    photos: [],
  }))
  const workshopByName = new Map(workshops.map((item) => [item.name, item]))

  readJson('workshop_photos.json').forEach((photo, index) => {
    const workshop = workshopByName.get(photo.workshopName)
    if (workshop) {
      workshop.photos.push({ id: index + 1, ...photo })
    }
  })

  const services = readJson('services.json').map((item, index) => {
    const workshop = workshopByName.get(item.workshopName)
    return {
      id: index + 1,
      workshopId: workshop.id,
      ...item,
    }
  })
  const serviceById = new Map(services.map((service) => [service.id, service]))
  const servicesByWorkshopId = new Map()
  services.forEach((service) => {
    const list = servicesByWorkshopId.get(service.workshopId) || []
    list.push(service)
    servicesByWorkshopId.set(service.workshopId, list)
  })

  const serviceItems = readJson('service_items.json').map((item, index) => {
    const workshop = workshopByName.get(item.workshopName)
    const normalizedWanted = normalizeServiceName(item.serviceName)
    const service =
      services.find((candidate) => candidate.workshopId === workshop.id && normalizeServiceName(candidate.name) === normalizedWanted) ||
      services.find((candidate) => candidate.workshopId === workshop.id && normalizeServiceName(candidate.name).includes(normalizedWanted)) ||
      services.find((candidate) => candidate.workshopId === workshop.id && normalizedWanted.includes(normalizeServiceName(candidate.name)))

    return {
      id: index + 1,
      serviceId: service?.id,
      ...item,
    }
  }).filter((item) => item.serviceId)

  const serviceItemsByServiceId = new Map()
  serviceItems.forEach((item) => {
    const list = serviceItemsByServiceId.get(item.serviceId) || []
    list.push(item)
    serviceItemsByServiceId.set(item.serviceId, list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id))
  })

  const masters = readJson('masters.json').map((item, index) => {
    const workshop = workshopByName.get(item.workshopName)
    const user = usersByEmail.get(item.email)
    return {
      id: index + 1,
      workshopId: workshop.id,
      workshopName: workshop.name,
      email: item.email,
      fullName: user.fullName,
      specialization: item.specialization,
      experienceYears: item.experienceYears,
      active: item.active,
      photoUrl: '',
    }
  })
  const mastersByEmail = new Map(masters.map((master) => [master.email, master]))

  const cars = readJson('cars.json').map((item, index) => ({
    id: index + 1,
    clientEmail: item.clientEmail,
    brand: item.brand,
    model: item.model,
    year: item.year,
    plateNumber: item.plateNumber,
    color: item.color,
    notes: item.notes,
  }))
  const nextCarId = createIdGenerator(cars.length + 1)

  function resolveServicesForWorkshop(workshopId, serviceNames) {
    const wanted = serviceNames.map((name) => normalizeServiceName(name))
    return wanted
      .map((name) => {
        const inWorkshop = servicesByWorkshopId.get(workshopId) || []
        return (
          inWorkshop.find((candidate) => normalizeServiceName(candidate.name) === name) ||
          inWorkshop.find((candidate) => normalizeServiceName(candidate.name).includes(name)) ||
          inWorkshop.find((candidate) => name.includes(normalizeServiceName(candidate.name)))
        )
      })
      .filter(Boolean)
  }

  function defaultSelectedItems(serviceId) {
    const items = serviceItemsByServiceId.get(serviceId) || []
    const selected = []
    const choiceGroups = new Map()

    items.forEach((item) => {
      if (item.kind === 'MANDATORY') {
        selected.push(item)
        return
      }

      if (item.kind === 'OPTIONAL' && item.defaultSelected) {
        selected.push(item)
        return
      }

      if (item.kind === 'CHOICE_OPTION' && item.choiceGroupKey) {
        const list = choiceGroups.get(item.choiceGroupKey) || []
        list.push(item)
        choiceGroups.set(item.choiceGroupKey, list)
      }
    })

    choiceGroups.forEach((itemsInGroup) => {
      selected.push(itemsInGroup.find((item) => item.defaultSelected) || itemsInGroup[0])
    })

    return selected
  }

  function computeSelection(serviceIds, selections = []) {
    const selectedItems = []
    const total = serviceIds.reduce((sum, serviceId) => {
      const requested = selections.find((item) => Number(item.serviceId) === Number(serviceId))
      const requestedIds = new Set((requested?.selectedItemIds || []).map(Number))
      const items = serviceItemsByServiceId.get(serviceId) || []

      if (!items.length) {
        return sum + Number(serviceById.get(serviceId)?.price || 0)
      }

      const choiceGroups = new Map()
      items.forEach((item) => {
        if (item.kind === 'CHOICE_OPTION' && item.choiceGroupKey) {
          const list = choiceGroups.get(item.choiceGroupKey) || []
          list.push(item)
          choiceGroups.set(item.choiceGroupKey, list)
          return
        }

        if (item.kind === 'MANDATORY' || (item.kind === 'OPTIONAL' && (item.defaultSelected || requestedIds.has(item.id)))) {
          selectedItems.push(item)
        }
      })

      choiceGroups.forEach((options) => {
        const requestedOption = options.find((item) => requestedIds.has(item.id))
        selectedItems.push(requestedOption || options.find((item) => item.defaultSelected) || options[0])
      })

      return sum + selectedItems
        .filter((item) => Number(item.serviceId) === Number(serviceId))
        .reduce((serviceSum, item) => serviceSum + Number(item.price || 0), 0)
    }, 0)

    return { selectedItems, total }
  }

  const appointments = readJson('appointments.json').map((item, index) => {
    const workshop = workshopByName.get(item.workshopName)
    const car = cars.find((candidate) => candidate.plateNumber === item.carPlate)
    const matchedServices = resolveServicesForWorkshop(workshop.id, [item.serviceName])
    const serviceIds = matchedServices.map((service) => service.id)
    const { selectedItems, total } = computeSelection(serviceIds)
    const primaryService = matchedServices[0]
    const master = mastersByEmail.get(item.masterEmail)
    const scheduledStart = isoWithOffset(item.scheduledStart, 10)
    const scheduledEnd = new Date(new Date(scheduledStart).getTime() + Number(primaryService?.durationMinutes || 60) * 60_000).toISOString()

    return {
      id: index + 1,
      clientEmail: item.clientEmail,
      carId: car.id,
      workshopId: workshop.id,
      serviceIds,
      primaryServiceId: primaryService.id,
      masterId: master?.id || null,
      status: item.status,
      paymentStatus: item.status === 'COMPLETED' ? 'PAID' : 'UNPAID',
      paymentMethod: item.status === 'COMPLETED' ? 'IN_WORKSHOP' : null,
      totalPrice: total,
      clientComment: item.clientComment || '',
      selectedItems: selectedItems.map((selected) => selected.id),
      scheduledStart,
      scheduledEnd,
    }
  })
  const nextAppointmentId = createIdGenerator(appointments.length + 1)

  const reviews = []
  const nextReviewId = createIdGenerator(1)

  readJson('reviews.json').forEach((item, index) => {
    const client = usersByEmail.get(item.clientEmail)
    const workshop = workshopByName.get(item.workshopName)
    const appointment = appointments.find((candidate) => candidate.clientEmail === item.appointmentClientEmail)
    reviews.push({
      id: nextReviewId(),
      appointmentId: appointment?.id || 1,
      targetType: item.targetType,
      workshopId: workshop?.id || null,
      masterId: null,
      clientName: client.fullName,
      rating: item.rating,
      comment: item.comment,
      status: item.visible ? 'APPROVED' : 'PENDING',
      rejectionReason: null,
      createdAt: isoWithOffset(`2026-03-${String(8 + index).padStart(2, '0')}T12:00:00`, 12),
    })
  })

  reviews.push({
    id: nextReviewId(),
    appointmentId: 1,
    targetType: 'MASTER',
    workshopId: 1,
    masterId: 1,
    clientName: usersByEmail.get('client1@detailing.local').fullName,
    rating: 5,
    comment: 'Мастер аккуратно объяснил этапы полировки и уложился в срок.',
    status: 'APPROVED',
    rejectionReason: null,
    createdAt: isoWithOffset('2026-03-09T13:30:00', 13),
  })

  reviews.push({
    id: nextReviewId(),
    appointmentId: 2,
    targetType: 'WORKSHOP',
    workshopId: 2,
    masterId: null,
    clientName: usersByEmail.get('client2@detailing.local').fullName,
    rating: 4,
    comment: 'Хороший сервис, но хотелось чуть быстрее принять автомобиль.',
    status: 'PENDING',
    rejectionReason: null,
    createdAt: isoWithOffset('2026-03-10T11:00:00', 11),
  })

  const aiFeedback = [
    {
      targetType: 'WORKSHOP',
      summary: 'Клиенты чаще всего отмечают чистоту боксов, понятную коммуникацию и заметный визуальный результат после услуг.',
    },
    {
      targetType: 'MASTER',
      summary: 'Отзывы о мастерах чаще всего подчеркивают аккуратность, внимательность к деталям и соблюдение сроков.',
    },
  ]

  const budget = { used: 4200, limit: 20000, remaining: 15800 }

  function currentUser(route) {
    const auth = route.request().headers().authorization || ''
    if (!auth.startsWith('Bearer ')) return null
    return usersByToken.get(auth.slice('Bearer '.length)) || null
  }

  function workshopResponse(workshop) {
    return {
      ...workshop,
      photos: [...workshop.photos],
    }
  }

  function serviceResponse(service) {
    return {
      id: service.id,
      workshopId: service.workshopId,
      workshopName: service.workshopName,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price,
      active: service.active,
    }
  }

  function masterResponse(master) {
    return {
      id: master.id,
      workshopId: master.workshopId,
      workshopName: master.workshopName,
      fullName: master.fullName,
      specialization: master.specialization,
      experienceYears: master.experienceYears,
      active: master.active,
      photoUrl: master.photoUrl,
      email: master.email,
    }
  }

  function selectedItemsForAppointment(appointment) {
    return appointment.selectedItems
      .map((itemId) => serviceItems.find((item) => item.id === itemId))
      .filter(Boolean)
      .map((item) => ({
        id: item.id,
        serviceId: item.serviceId,
        serviceName: serviceById.get(item.serviceId)?.name || item.serviceName,
        kind: item.kind,
        name: item.name,
        price: item.price,
        choiceGroupKey: item.choiceGroupKey,
      }))
  }

  function appointmentResponse(appointment) {
    const workshop = workshops.find((item) => item.id === appointment.workshopId)
    const car = cars.find((item) => item.id === appointment.carId)
    const primaryService = serviceById.get(appointment.primaryServiceId)
    const appointmentServices = appointment.serviceIds.map((serviceId) => serviceById.get(serviceId)).filter(Boolean)
    const master = masters.find((item) => item.id === appointment.masterId)

    return {
      id: appointment.id,
      workshopId: workshop.id,
      workshopName: workshop.name,
      carId: car.id,
      carLabel: `${car.brand} ${car.model} (${car.plateNumber})`,
      serviceId: primaryService.id,
      serviceName: primaryService.name,
      services: appointmentServices.map((service) => ({
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
      })),
      selectedItems: selectedItemsForAppointment(appointment),
      masterId: master?.id || null,
      masterName: master?.fullName || null,
      scheduledStart: appointment.scheduledStart,
      scheduledEnd: appointment.scheduledEnd,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      paymentMethod: appointment.paymentMethod,
      totalPrice: appointment.totalPrice,
      clientComment: appointment.clientComment,
      resultComment: appointment.status === 'COMPLETED' ? 'Услуга выполнена по регламенту.' : '',
    }
  }

  function buildDailyAnalytics() {
    const dates = [
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]

    return dates.map((date, index) => ({
      date,
      newCount: index === 2 ? 1 : index === 6 ? 1 : 0,
      confirmedCount: index === 2 ? 1 : 0,
      inProgressCount: index === 4 ? 1 : 0,
      completedCount: index === 0 ? 1 : index === 5 ? 1 : 0,
      revenue: index === 0 ? 15000 : index === 5 ? 12500 : 0,
    }))
  }

  const state = { users, workshops, services, serviceItems, masters, cars, appointments, reviews }

  async function handle(route) {
    const request = route.request()
    const url = new URL(request.url())
    const apiIndex = url.pathname.indexOf('/api/v1/')
    const pathname = apiIndex >= 0 ? url.pathname.slice(apiIndex + '/api/v1'.length) : url.pathname
    const method = request.method()
    const viewer = currentUser(route)
    const segments = pathname.split('/').filter(Boolean)

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }

    if (pathname === '/auth/login' && method === 'POST') {
      const body = parseBody(route)
      const user = users.find((candidate) => candidate.email === body.email && candidate.password === body.password)
      if (!user) return unauthorized(route, 'Неверный логин или пароль')
      return json(route, {
        token: user.token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      })
    }

    if (pathname === '/workshops' && method === 'GET') {
      return json(route, workshops.map(workshopResponse))
    }

    if (segments[0] === 'workshops' && segments.length === 2 && method === 'GET') {
      const workshop = workshops.find((item) => Number(item.id) === Number(segments[1]))
      return workshop ? json(route, workshopResponse(workshop)) : notFound(route)
    }

    if (segments[0] === 'workshops' && segments[2] === 'stats' && method === 'GET') {
      const workshopId = Number(segments[1])
      const completedAppointments = appointments.filter((item) => item.workshopId === workshopId && item.status === 'COMPLETED').length
      return json(route, { completedAppointments })
    }

    if (segments[0] === 'workshops' && segments[2] === 'services' && method === 'GET') {
      const workshopId = Number(segments[1])
      return json(route, (servicesByWorkshopId.get(workshopId) || []).map(serviceResponse))
    }

    if (segments[0] === 'workshops' && segments[2] === 'masters' && method === 'GET') {
      const workshopId = Number(segments[1])
      return json(route, masters.filter((item) => item.workshopId === workshopId).map(masterResponse))
    }

    if (segments[0] === 'workshops' && segments[2] === 'reviews' && method === 'GET') {
      const workshopId = Number(segments[1])
      return json(route, reviews.filter((item) => item.targetType === 'WORKSHOP' && item.workshopId === workshopId && item.status === 'APPROVED'))
    }

    if (segments[0] === 'workshops' && segments[2] === 'feedback' && method === 'GET') {
      return json(route, { summary: aiFeedback.find((item) => item.targetType === 'WORKSHOP')?.summary || '' })
    }

    if (pathname === '/services' && method === 'GET') {
      return json(route, services.map(serviceResponse))
    }

    if (segments[0] === 'services' && segments[2] === 'items' && method === 'GET') {
      return json(route, serviceItemsByServiceId.get(Number(segments[1])) || [])
    }

    if (segments[0] === 'masters' && segments.length === 2 && method === 'GET') {
      const master = masters.find((item) => Number(item.id) === Number(segments[1]))
      return master ? json(route, masterResponse(master)) : notFound(route)
    }

    if (segments[0] === 'masters' && segments[2] === 'reviews' && method === 'GET') {
      const masterId = Number(segments[1])
      return json(route, reviews.filter((item) => item.targetType === 'MASTER' && item.masterId === masterId && item.status === 'APPROVED'))
    }

    if (segments[0] === 'masters' && segments[2] === 'feedback' && method === 'GET') {
      return json(route, { summary: aiFeedback.find((item) => item.targetType === 'MASTER')?.summary || '' })
    }

    if (pathname === '/public/reviews/recent' && method === 'GET') {
      const limit = Number(url.searchParams.get('limit') || 12)
      const payload = reviews.filter((item) => item.status === 'APPROVED').slice().sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, limit)
      return json(route, payload)
    }

    if (pathname === '/public/feedback' && method === 'GET') {
      return json(route, aiFeedback)
    }

    if (pathname === '/cars/my' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, cars.filter((item) => item.clientEmail === viewer.email))
    }

    if (pathname === '/cars' && method === 'POST') {
      if (!viewer) return unauthorized(route)
      const body = parseBody(route)
      const created = {
        id: nextCarId(),
        clientEmail: viewer.email,
        brand: body.brand,
        model: body.model,
        year: Number(body.year),
        plateNumber: body.plateNumber,
        color: body.color,
        notes: body.notes || '',
      }
      cars.push(created)
      return json(route, created, 201)
    }

    if (segments[0] === 'cars' && segments.length === 2 && method === 'GET') {
      if (!viewer) return unauthorized(route)
      const car = cars.find((item) => Number(item.id) === Number(segments[1]))
      if (!car) return notFound(route)
      if (car.clientEmail !== viewer.email) return forbidden(route)
      return json(route, car)
    }

    if (pathname === '/appointments/my' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, appointments.filter((item) => item.clientEmail === viewer.email).map(appointmentResponse))
    }

    if (pathname === '/appointments' && method === 'POST') {
      if (!viewer) return unauthorized(route)
      const body = parseBody(route)
      const serviceIds = (body.serviceIds || []).map(Number).filter(Boolean)
      const requestedServices = serviceIds.length ? serviceIds : [Number(body.serviceId)].filter(Boolean)
      const matchedServices = requestedServices.map((serviceId) => serviceById.get(serviceId)).filter(Boolean)
      const selections = body.selections || []
      const { selectedItems, total } = computeSelection(requestedServices, selections)
      const primaryService = matchedServices[0]
      const durationMinutes = matchedServices.reduce((sum, service) => sum + Number(service.durationMinutes || 0), 0)
      const scheduledStart = isoWithOffset(body.scheduledStart, 12)
      const scheduledEnd = new Date(new Date(scheduledStart).getTime() + durationMinutes * 60_000).toISOString()
      const created = {
        id: nextAppointmentId(),
        clientEmail: viewer.email,
        carId: Number(body.carId),
        workshopId: Number(body.workshopId),
        serviceIds: requestedServices,
        primaryServiceId: primaryService.id,
        masterId: null,
        status: 'NEW',
        paymentStatus: 'UNPAID',
        paymentMethod: null,
        totalPrice: total,
        clientComment: body.clientComment || '',
        selectedItems: selectedItems.map((item) => item.id),
        scheduledStart,
        scheduledEnd,
      }
      appointments.unshift(created)
      return json(route, appointmentResponse(created), 201)
    }

    if (segments[0] === 'appointments' && segments.length === 2 && method === 'GET') {
      if (!viewer) return unauthorized(route)
      const appointment = appointments.find((item) => Number(item.id) === Number(segments[1]))
      if (!appointment) return notFound(route)
      if (appointment.clientEmail !== viewer.email && viewer.role !== 'ADMIN' && viewer.role !== 'MASTER') return forbidden(route)
      return json(route, appointmentResponse(appointment))
    }

    if (segments[0] === 'appointments' && segments[2] === 'reviews' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      const appointmentId = Number(segments[1])
      return json(route, reviews.filter((item) => item.appointmentId === appointmentId))
    }

    if (segments[0] === 'appointments' && segments[2] === 'payment' && segments[3] === 'pay-now' && method === 'POST') {
      if (!viewer) return unauthorized(route)
      const appointment = appointments.find((item) => Number(item.id) === Number(segments[1]))
      if (!appointment) return notFound(route)
      appointment.paymentMethod = 'NOW'
      appointment.paymentStatus = 'PAID'
      return json(route, appointmentResponse(appointment))
    }

    if (pathname === '/master/appointments' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      const master = mastersByEmail.get(viewer.email)
      return json(route, appointments.filter((item) => item.masterId === master?.id).map(appointmentResponse))
    }

    if (pathname === '/master/reviews/me' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      const master = mastersByEmail.get(viewer.email)
      return json(route, reviews.filter((item) => item.targetType === 'MASTER' && item.masterId === master?.id))
    }

    if (pathname === '/admin/workshops' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, workshops.map(workshopResponse))
    }

    if (pathname === '/admin/services' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, services.map(serviceResponse))
    }

    if (segments[0] === 'admin' && segments[1] === 'services' && segments[3] === 'items' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, serviceItemsByServiceId.get(Number(segments[2])) || [])
    }

    if (pathname === '/admin/masters' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, masters.map(masterResponse))
    }

    if (pathname === '/admin/appointments' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, appointments.map(appointmentResponse))
    }

    if (pathname === '/admin/reviews' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, reviews)
    }

    if (pathname === '/admin/ai/budget' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, budget)
    }

    if (pathname === '/admin/dashboard' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      const totalAppointments = appointments.length
      const newAppointments = appointments.filter((item) => item.status === 'NEW').length
      const inProgressAppointments = appointments.filter((item) => item.status === 'IN_PROGRESS').length
      const completedAppointments = appointments.filter((item) => item.status === 'COMPLETED').length
      const revenue = appointments
        .filter((item) => item.status === 'COMPLETED')
        .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
      return json(route, { totalAppointments, newAppointments, inProgressAppointments, completedAppointments, revenue })
    }

    if (pathname === '/admin/analytics/appointments/daily' && method === 'GET') {
      if (!viewer) return unauthorized(route)
      return json(route, buildDailyAnalytics())
    }

    return notFound(route)
  }

  return {
    state,
    async install(page) {
      await page.route('**/api/v1/**', handle)
    },
  }
}
