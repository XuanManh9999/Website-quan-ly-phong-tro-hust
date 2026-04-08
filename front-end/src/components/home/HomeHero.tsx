import { Button, Card, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

export function HomeHero() {
  return (
    <section className="hero">
      <div>
        <Title level={2}>Tìm phòng trọ gần HUST nhanh và chuẩn nhu cầu</Title>
        <Paragraph>
          Nền tảng giúp sinh viên tìm phòng theo giá, khu vực, tiện ích. Kết hợp dữ liệu tin đăng và trợ lý AI để
          rút ngắn thời gian tìm trọ.
        </Paragraph>
        <div className="hero-actions">
          <Link to="/phong">
            <Button type="primary" size="large">
              Xem danh sách phòng
            </Button>
          </Link>
          <Link to="/tin">
            <Button size="large">Đọc bài viết hướng dẫn</Button>
          </Link>
        </div>
      </div>
      <Card className="hero-card" bordered={false}>
        <Title level={4}>Bắt đầu trong 3 bước</Title>
        <Paragraph>1) Lọc theo mức giá và quận/huyện</Paragraph>
        <Paragraph>2) Mở chi tiết để so sánh địa chỉ, mô tả</Paragraph>
        <Paragraph>3) Hỏi trợ lý AI để nhận gợi ý nhanh</Paragraph>
      </Card>
    </section>
  )
}
