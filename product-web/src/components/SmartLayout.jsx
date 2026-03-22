import Layout from './Layout'
import PublicLayout from './PublicLayout'
import { isLoggedIn } from '../utils/auth'

export default function SmartLayout({ children }) {
  return isLoggedIn() ? <Layout>{children}</Layout> : <PublicLayout>{children}</PublicLayout>
}

