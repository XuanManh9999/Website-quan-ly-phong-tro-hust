import { Button, Card, Form, Input, Typography } from 'antd'

type LoginFormCardProps = {
  loading: boolean
  onSubmit: (v: { email: string; password: string }) => Promise<void>
}

export function LoginFormCard({ loading, onSubmit }: LoginFormCardProps) {
  return (
    <Card title="Đăng nhập" className="filter-card" style={{ maxWidth: 460, margin: '0 auto' }}>
      <Typography.Paragraph type="secondary">
        Tài khoản admin mặc định (dev): <code>admin@hust.local</code> / <code>Admin@123456</code>
      </Typography.Paragraph>
      <Form layout="vertical" onFinish={onSubmit}>
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
