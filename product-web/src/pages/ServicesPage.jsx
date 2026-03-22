import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'
import { cn } from '../lib/utils'

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [workshopId, setWorkshopId] = useState('')
  const [highlightServiceId, setHighlightServiceId] = useState('')

  useEffect(() => {
    api.get('/services').then((r) => setServices(r.data)).catch(() => {})
    api.get('/workshops').then((r) => setWorkshops(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const wid = searchParams.get('workshopId') || ''
    const sid = searchParams.get('serviceId') || ''
    if (wid) setWorkshopId(String(wid))
    if (sid) setHighlightServiceId(String(sid))
  }, [searchParams])

  const filtered = useMemo(() => {
    if (!workshopId) return services
    return services.filter((s) => String(s.workshopId) === String(workshopId))
  }, [services, workshopId])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const s of filtered) {
      const key = s.workshopName || 'Услуги'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return Array.from(map.entries()).map(([name, list]) => ({
      name,
      list: list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru')),
    }))
  }, [filtered])

  const selectedService = useMemo(() => {
    if (!highlightServiceId) return null
    return services.find((s) => String(s.id) === String(highlightServiceId)) || null
  }, [highlightServiceId, services])

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Услуги и прайс</h1>
          <p className="muted">Цены и длительность — ориентир. Итог подтверждаем по состоянию авто.</p>
        </div>
        <div className="page-controls">
          <select
            value={workshopId}
            onChange={(e) => {
              setWorkshopId(e.target.value)
              setHighlightServiceId('')
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (e.target.value) next.set('workshopId', e.target.value)
                else next.delete('workshopId')
                next.delete('serviceId')
                return next
              })
            }}
          >
            <option value="">Все салоны</option>
            {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {selectedService && (
        <div className="card">
          <p className="muted">
            Вы выбрали: <span className="text-white">{selectedService.name}</span> ({selectedService.workshopName})
          </p>
        </div>
      )}

      {grouped.map((g) => (
        <section key={g.name} className="card">
          <h2>{g.name}</h2>
          <div className="grid">
            {g.list.map((s) => (
              <article
                key={s.id}
                className={cn('card', String(s.id) === String(highlightServiceId) && 'ring-4 ring-violet-500/20 border-white/20')}
              >
                <h4>{s.name}</h4>
                {s.description && <p>{s.description}</p>}
                <p>{s.durationMinutes} мин • {s.price} ₽</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      {!services.length && (
        <div className="card">
          <p className="muted">Загрузка…</p>
        </div>
      )}
    </div>
  )
}
