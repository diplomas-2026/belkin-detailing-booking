import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api'
import Field from '../components/ui/Field'

const initial = { name: '', description: '', address: '', city: 'Самара', latitude: 53.2, longitude: 50.17, phone: '', workingHours: '', active: true }

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickMarker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ latitude: Number(e.latlng.lat.toFixed(6)), longitude: Number(e.latlng.lng.toFixed(6)) })
    },
  })
  return <Marker position={[value.latitude, value.longitude]} />
}

export default function AdminWorkshopsPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(initial)
  const [photoUrl, setPhotoUrl] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)

  const normalizeWorkshop = (w) => ({
    ...w,
    active: w?.active === true || w?.active === 'true' || w?.active === 1 || w?.active === '1',
    photos: Array.isArray(w?.photos) ? w.photos : [],
    latitude: w?.latitude == null ? null : Number(w.latitude),
    longitude: w?.longitude == null ? null : Number(w.longitude),
  })

  const load = () =>
    api.get('/admin/workshops').then((r) => {
      const data = Array.isArray(r.data) ? r.data : []
      setItems(data.map(normalizeWorkshop))
    })

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      if (editingId) {
        await api.put(`/admin/workshops/${editingId}`, form)
      } else {
        await api.post('/admin/workshops', form)
      }
      setForm(initial)
      setEditingId(null)
      load()
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (w) => {
    setEditingId(w.id)
    setForm({
      name: w.name || '',
      description: w.description || '',
      address: w.address || '',
      city: w.city || 'Самара',
      latitude: Number(w.latitude) || 53.2,
      longitude: Number(w.longitude) || 50.17,
      phone: w.phone || '',
      workingHours: w.workingHours || '',
      active: !!w.active,
    })
    setPhotoUrl('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(initial)
    setPhotoUrl('')
  }

  const toggleActive = async (w) => {
    if (busy) return
    setBusy(true)
    try {
      await api.put(`/admin/workshops/${w.id}`, {
        name: w.name,
        description: w.description,
        address: w.address,
        city: w.city,
        latitude: Number(w.latitude),
        longitude: Number(w.longitude),
        phone: w.phone,
        workingHours: w.workingHours,
        active: !normalizeWorkshop(w).active,
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const addPhoto = async (e) => {
    e.preventDefault()
    if (!editingId || !photoUrl) return
    if (busy) return
    setBusy(true)
    try {
      await api.post(`/admin/workshops/${editingId}/photos`, { photoUrl, sortOrder: 1, cover: false })
      setPhotoUrl('')
      load()
    } finally {
      setBusy(false)
    }
  }

  const deletePhoto = async (workshopId, photoId) => {
    if (busy) return
    setBusy(true)
    try {
      await api.delete(`/admin/workshops/${workshopId}/photos/${photoId}`)
      load()
    } finally {
      setBusy(false)
    }
  }

  const selected = editingId ? items.find((x) => x.id === editingId) : null

  return (
    <div>
      <h1>Управление салонами</h1>
      <div className="stack">
        <form className="card stack" onSubmit={save}>
          <div className="section-head">
            <h2>{editingId ? 'Редактирование салона' : 'Добавить салон'}</h2>
            {editingId && (
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="secondary" onClick={cancelEdit} disabled={busy}>Отмена</button>
                <button type="submit" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</button>
              </div>
            )}
          </div>

          {!editingId && (
            <div className="flex gap-2 flex-wrap">
              <button type="submit" disabled={busy}>{busy ? 'Добавление…' : 'Добавить салон'}</button>
            </div>
          )}

          <div className="form-grid">
            <Field label="Название салона" value={form.name}>
              <input placeholder="Название салона" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Описание" value={form.description}>
              <input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Адрес" value={form.address}>
              <input placeholder="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Город" value={form.city}>
              <input placeholder="Город" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Телефон" value={form.phone}>
              <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Часы работы" value={form.workingHours}>
              <input placeholder="Часы работы" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
            </Field>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span className="text-white/80">Салон открыт для клиентов</span>
            </label>
          </div>

          <div className="grid">
            <div className="card">
              <h3>Координаты</h3>
              <div className="form-grid">
                <Field label="Широта" value={form.latitude}>
                  <input type="number" step="0.000001" placeholder="Широта" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
                </Field>
                <Field label="Долгота" value={form.longitude}>
                  <input type="number" step="0.000001" placeholder="Долгота" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
                </Field>
              </div>
              <p className="muted">Можно кликнуть по карте, чтобы выбрать точку.</p>
              <MapContainer
                key={`${form.latitude}-${form.longitude}`}
                center={[form.latitude, form.longitude]}
                zoom={13}
                scrollWheelZoom={false}
                className="map map-sm"
              >
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickMarker value={{ latitude: form.latitude, longitude: form.longitude }} onChange={(pos) => setForm({ ...form, ...pos })} />
              </MapContainer>
            </div>

            {editingId && (
              <div className="card">
                <h3>Фото салона</h3>
                <form className="form-grid" onSubmit={addPhoto}>
                  <Field label="URL фото" value={photoUrl}>
                    <input placeholder="URL фото" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
                  </Field>
                  <button type="submit" disabled={busy || !photoUrl}>{busy ? 'Добавление…' : 'Добавить фото'}</button>
                </form>
                <div className="photo-grid photo-grid-sm">
                  {(selected?.photos || []).map((p) => (
                    <div key={p.id} className="thumb">
                      <img src={p.photoUrl} alt="Фото салона" loading="lazy" />
                      <button type="button" className="danger" onClick={() => deletePhoto(editingId, p.id)} disabled={busy}>Удалить</button>
                    </div>
                  ))}
                  {!selected?.photos?.length && <p className="muted">Пока нет фото.</p>}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="grid">
          {items.map((w) => (
            <div key={w.id} className="card">
              <div className="section-head">
                <h4 className="text-white">{w.name}</h4>
                <span className={`badge ${w.active ? 'badge-approved' : 'badge-rejected'}`}>{w.active ? 'Открыт' : 'Закрыт'}</span>
              </div>
              <p>{w.address}</p>
              <p className="muted">Фото: {w.photos.length}</p>
              <div className="flex gap-2 flex-wrap mt-2">
                <button type="button" className="secondary" onClick={() => startEdit(w)} disabled={busy}>Редактировать</button>
                <button type="button" className="danger" onClick={() => toggleActive(w)} disabled={busy}>
                  {w.active ? 'Закрыть салон' : 'Открыть салон'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
