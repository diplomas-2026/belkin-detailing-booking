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
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="muted">{r.targetType}</span>
              <span className={`badge ${r.status === 'APPROVED' ? 'badge-approved' : r.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                {r.status === 'APPROVED' ? 'Опубликован' : r.status === 'REJECTED' ? 'Отклонён' : 'На проверке'}
              </span>
            </div>
            <p>Оценка: {r.rating}/5</p>
            <p>{r.comment || 'Без комментария'}</p>
            {r.status === 'REJECTED' && r.rejectionReason && (
              <p className="error">Причина: {r.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
