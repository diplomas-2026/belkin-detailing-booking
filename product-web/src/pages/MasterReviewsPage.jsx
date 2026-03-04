import { useEffect, useState } from 'react'
import api from '../api'

export default function MasterReviewsPage() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    api.get('/master/reviews/me').then((r) => setReviews(r.data))
  }, [])

  return (
    <div>
      <h1>Отзывы о мастере</h1>
      <div className="grid">
        {reviews.map((r) => (
          <div className="card" key={r.id}>
            <strong>{r.clientName}</strong>
            <p>Оценка: {r.rating}/5</p>
            <p>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
