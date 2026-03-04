import { useEffect, useState } from 'react'
import api from '../api'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])

  const load = () => api.get('/admin/reviews').then((r) => setReviews(r.data))
  useEffect(() => { load() }, [])

  const toggle = async (review) => {
    await api.patch(`/admin/reviews/${review.id}/visibility`, { visible: !review.visible })
    load()
  }

  return (
    <div>
      <h1>Модерация отзывов</h1>
      <div className="grid">
        {reviews.map((review) => (
          <div className="card" key={review.id}>
            <strong>{review.clientName}</strong>
            <p>Оценка: {review.rating}</p>
            <p>{review.comment}</p>
            <p>Видимость: {review.visible ? 'Показан' : 'Скрыт'}</p>
            <button onClick={() => toggle(review)}>{review.visible ? 'Скрыть' : 'Показать'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
