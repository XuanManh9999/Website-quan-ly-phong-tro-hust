import { useState } from 'react'
import { Button, Card, Form, Input, Typography, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/authApi'

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  return (
    <Card title="Đăng nhập" style={{ maxWidth: 420, margin: '0 auto' }}>
      <Typography.Paragraph type="secondary">
        Tài khoản admin mặc định (dev): <code>admin@hust.local</code> / <code>Admin@123456</code>
      </Typography.Paragraph>
      <Form
        layout="vertical"
        onFinish={async (v: { email: string; password: string }) => {
          setLoading(true)
          try {
            const res = await login(v.email, v.password)
            localStorage.setItem('accessToken', res.accessToken)
            message.success('Đăng nhập thành công')
            navigate('/')
          } catch {
            message.error('Sai email hoặc mật khẩu')
          } finally {
            setLoading(false)
          }
        }}
      >
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
