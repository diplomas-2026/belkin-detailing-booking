import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function WorkshopsPage() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await api.get('/workshops')
        if (active) setItems(res.data)
      } catch {
        if (active) setTimeout(load, 1000)
      }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <div>
      <h1>Салоны</h1>
      <div className="map-layout">
        <MapContainer center={[53.2, 50.17]} zoom={11} scrollWheelZoom={false} className="map">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          {items.map((w) => (
            <Marker key={w.id} position={[w.latitude, w.longitude]}>
              <Popup>
                <strong>{w.name}</strong>
                <br />
                {w.address}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="list">
          {items.map((w) => (
            <Link key={w.id} to={`/workshops/${w.id}`} className="card card-link">
              <h3>{w.name}</h3>
              <p>{w.address}</p>
              <p>{w.workingHours}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
