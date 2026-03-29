import { Button, Space, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

export function HomePage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Tìm phòng trọ gần HUST</Title>
      <Paragraph>
        Nền tảng kết nối người thuê và chủ trọ: tin đăng có duyệt, gói mở quota, thanh toán VNPay, trợ lý Gemini
        (backend).
      </Paragraph>
      <Space>
        <Link to="/phong">
          <Button type="primary" size="large">
            Xem danh sách phòng
          </Button>
        </Link>
        <Link to="/tin">
          <Button size="large">Đọc bài viết</Button>
        </Link>
      </Space>
    </Space>
  )
}
