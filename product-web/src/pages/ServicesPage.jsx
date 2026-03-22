import { useEffect, useMemo, useState } from 'react'
import api from '../api'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [workshopId, setWorkshopId] = useState('')

  useEffect(() => {
    api.get('/services').then((r) => setServices(r.data)).catch(() => {})
    api.get('/workshops').then((r) => setWorkshops(r.data)).catch(() => {})
  }, [])

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

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Услуги и прайс</h1>
          <p className="muted">Цены и длительность — ориентир. Итог подтверждаем по состоянию авто.</p>
        </div>
        <div className="page-controls">
          <select value={workshopId} onChange={(e) => setWorkshopId(e.target.value)}>
            <option value="">Все точки</option>
            {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {grouped.map((g) => (
        <section key={g.name} className="card">
          <h2>{g.name}</h2>
          <div className="grid">
            {g.list.map((s) => (
              <article key={s.id} className="card">
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

