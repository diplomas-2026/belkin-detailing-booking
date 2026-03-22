export const APPOINTMENT_STATUS_LABELS = {
  NEW: 'Новая',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнена',
  CANCELLED: 'Отменена',
}

export const appointmentStatusLabel = (status) => APPOINTMENT_STATUS_LABELS[status] || status || '—'

