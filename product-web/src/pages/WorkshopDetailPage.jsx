import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

export default function WorkshopDetailPage() {
  const { id } = useParams()
  const [workshop, setWorkshop] = useState(null)
  const [services, setServices] = useState([])
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    api.get(`/workshops/${id}`).then((r) => setWorkshop(r.data))
    api.get(`/workshops/${id}/services`).then((r) => setServices(r.data))
    api.get(`/workshops/${id}/reviews`).then((r) => setReviews(r.data))
  }, [id])

  if (!workshop) return <p>Загрузка...</p>

  return (
    <div>
      <h1>{workshop.name}</h1>
      <p>{workshop.description}</p>
      <p>{workshop.address}</p>
      <div className="photo-grid">
        {workshop.photos.map((photo) => (
          <img key={photo.id} src={photo.photoUrl} alt="Фото мастерской" />
        ))}
      </div>
      <h2>Услуги</h2>
      <div className="grid">
        {services.map((service) => (
          <div key={service.id} className="card">
            <h4>{service.name}</h4>
            <p>{service.description}</p>
            <p>{service.durationMinutes} мин • {service.price} ₽</p>
          </div>
        ))}
      </div>
      <h2>Отзывы</h2>
      <div className="grid">
        {reviews.map((review) => (
          <div key={review.id} className="card">
            <strong>{review.clientName}</strong>
            <p>Оценка: {review.rating}/5</p>
            <p>{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
