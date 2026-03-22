import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminAppointmentsPage from './pages/AdminAppointmentsPage'
import AdminReviewsPage from './pages/AdminReviewsPage'
import AdminServicesPage from './pages/AdminServicesPage'
import AdminWorkshopsPage from './pages/AdminWorkshopsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MasterReviewsPage from './pages/MasterReviewsPage'
import MasterTasksPage from './pages/MasterTasksPage'
import MyAppointmentsPage from './pages/MyAppointmentsPage'
import MyCarsPage from './pages/MyCarsPage'
import ReviewsNewPage from './pages/ReviewsNewPage'
import WorkshopDetailPage from './pages/WorkshopDetailPage'
import WorkshopsPage from './pages/WorkshopsPage'

function InLayout({ children }) {
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <InLayout><DashboardPage /></InLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshops"
        element={
          <ProtectedRoute>
            <InLayout><WorkshopsPage /></InLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshops/:id"
        element={
          <ProtectedRoute>
            <InLayout><WorkshopDetailPage /></InLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/my-cars" element={<ProtectedRoute roles={['CLIENT']}><InLayout><MyCarsPage /></InLayout></ProtectedRoute>} />
      <Route path="/my-appointments" element={<ProtectedRoute roles={['CLIENT']}><InLayout><MyAppointmentsPage /></InLayout></ProtectedRoute>} />
      <Route path="/reviews/new" element={<ProtectedRoute roles={['CLIENT']}><InLayout><ReviewsNewPage /></InLayout></ProtectedRoute>} />

      <Route path="/master/tasks" element={<ProtectedRoute roles={['MASTER']}><InLayout><MasterTasksPage /></InLayout></ProtectedRoute>} />
      <Route path="/master/reviews" element={<ProtectedRoute roles={['MASTER']}><InLayout><MasterReviewsPage /></InLayout></ProtectedRoute>} />

      <Route path="/admin/workshops" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminWorkshopsPage /></InLayout></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminAppointmentsPage /></InLayout></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminServicesPage /></InLayout></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminReviewsPage /></InLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
