import { useEffect, useState } from 'react'
import api from '../api'

export default function MasterTasksPage() {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState('')
  const load = () => api.get('/master/appointments').then((r) => setTasks(r.data))

  useEffect(() => { load() }, [])

  const changeStatus = async (id, status) => {
    setError('')
    try {
      await api.patch(`/master/appointments/${id}/status`, { status, comment: 'Обновлено мастером' })
      load()
    } catch {
      setError('Не удалось сменить статус')
    }
  }

  return (
    <div>
      <h1>Мои задачи</h1>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {tasks.map((task) => (
          <div key={task.id} className="card">
            <h4>{task.serviceName}</h4>
            <p>{task.workshopName}</p>
            <p>{new Date(task.scheduledStart).toLocaleString('ru-RU')}</p>
            <p>Статус: {task.status}</p>
            {task.status === 'CONFIRMED' && <button onClick={() => changeStatus(task.id, 'IN_PROGRESS')}>Начать</button>}
            {task.status === 'IN_PROGRESS' && <button onClick={() => changeStatus(task.id, 'COMPLETED')}>Завершить</button>}
          </div>
        ))}
      </div>
    </div>
  )
}
