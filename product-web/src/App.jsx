import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import SmartLayout from './components/SmartLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminAppointmentsPage from './pages/AdminAppointmentsPage'
import AdminReviewsPage from './pages/AdminReviewsPage'
import AdminServicesPage from './pages/AdminServicesPage'
import AdminWorkshopsPage from './pages/AdminWorkshopsPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import PublicReviewsPage from './pages/PublicReviewsPage'
import RegisterPage from './pages/RegisterPage'
import ServicesPage from './pages/ServicesPage'
import MasterReviewsPage from './pages/MasterReviewsPage'
import MasterTasksPage from './pages/MasterTasksPage'
import MyAppointmentsPage from './pages/MyAppointmentsPage'
import MyAppointmentDetailPage from './pages/MyAppointmentDetailPage'
import MyAppointmentPayPage from './pages/MyAppointmentPayPage'
import MyCarsPage from './pages/MyCarsPage'
import MyCarDetailPage from './pages/MyCarDetailPage'
import MasterDetailPage from './pages/MasterDetailPage'
import WorkshopDetailPage from './pages/WorkshopDetailPage'
import WorkshopsPage from './pages/WorkshopsPage'

function InLayout({ children }) {
  return <Layout>{children}</Layout>
}

function InPublicLayout({ children }) {
  return <PublicLayout>{children}</PublicLayout>
}

function InSmartLayout({ children }) {
  return <SmartLayout>{children}</SmartLayout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InPublicLayout><LandingPage /></InPublicLayout>} />
      <Route path="/workshops" element={<InSmartLayout><WorkshopsPage /></InSmartLayout>} />
      <Route path="/workshops/:id" element={<InSmartLayout><WorkshopDetailPage /></InSmartLayout>} />
      <Route path="/workshops/:id/masters/:masterId" element={<InSmartLayout><MasterDetailPage /></InSmartLayout>} />
      <Route path="/services" element={<InSmartLayout><ServicesPage /></InSmartLayout>} />
      <Route path="/reviews" element={<InSmartLayout><PublicReviewsPage /></InSmartLayout>} />

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

      <Route path="/my-cars" element={<ProtectedRoute roles={['CLIENT']}><InLayout><MyCarsPage /></InLayout></ProtectedRoute>} />
      <Route path="/my-cars/:id" element={<ProtectedRoute roles={['CLIENT']}><InLayout><MyCarDetailPage /></InLayout></ProtectedRoute>} />
      <Route path="/my-appointments" element={<ProtectedRoute roles={['CLIENT']}><InLayout><MyAppointmentsPage /></InLayout></ProtectedRoute>} />
      <Route path="/my-appointments/:id" element={<ProtectedRoute roles={['CLIENT', 'MASTER', 'ADMIN']}><InLayout><MyAppointmentDetailPage /></InLayout></ProtectedRoute>} />
      <Route path="/my-appointments/:id/pay" element={<ProtectedRoute roles={['CLIENT']}><InLayout><MyAppointmentPayPage /></InLayout></ProtectedRoute>} />

      <Route path="/master/tasks" element={<ProtectedRoute roles={['MASTER']}><InLayout><MasterTasksPage /></InLayout></ProtectedRoute>} />
      <Route path="/master/reviews" element={<ProtectedRoute roles={['MASTER']}><InLayout><MasterReviewsPage /></InLayout></ProtectedRoute>} />

      <Route path="/admin/workshops" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminWorkshopsPage /></InLayout></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminAppointmentsPage /></InLayout></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminServicesPage /></InLayout></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute roles={['ADMIN']}><InLayout><AdminReviewsPage /></InLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
