import { useState } from 'react'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/authApi'
import { setSession } from '../auth/session'
import { LoginFormCard } from '../components/auth/LoginFormCard'

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  return (
    <LoginFormCard
      loading={loading}
      onSubmit={async (v) => {
        setLoading(true)
        try {
          const res = await login(v.email, v.password)
          setSession(res)
          message.success('Đăng nhập thành công')
          navigate('/')
        } catch {
          message.error('Sai email hoặc mật khẩu')
        } finally {
          setLoading(false)
        }
      }}
    />
  )
}
