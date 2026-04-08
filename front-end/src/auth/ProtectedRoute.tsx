import { Result } from 'antd'
import { Navigate } from 'react-router-dom'
import type { UserRole } from '../api/authApi'
import { getAccessToken, getCurrentUser } from './session'

type ProtectedRouteProps = {
  roles?: UserRole[]
  children: React.ReactElement
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const token = getAccessToken()
  const user = getCurrentUser()

  if (!token || !user) {
    return <Navigate to="/dang-nhap" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Result status="403" title="403" subTitle="Bạn không có quyền truy cập chức năng này." />
  }

  return children
}
