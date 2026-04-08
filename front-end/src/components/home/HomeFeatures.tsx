import { Card, Col, Row, Typography } from 'antd'

const { Title, Paragraph } = Typography

const FEATURE_ITEMS = [
  {
    title: 'Tìm nhanh',
    desc: 'Dễ dàng lọc theo từ khóa, khu vực và khoảng giá để ra đúng phòng cần tìm.',
  },
  {
    title: 'Thông tin rõ ràng',
    desc: 'Mỗi phòng có tiêu đề, địa chỉ, mức giá và mô tả để bạn ra quyết định nhanh.',
  },
  {
    title: 'Trợ lý AI tích hợp',
    desc: 'Đặt câu hỏi tự nhiên để nhận gợi ý phù hợp theo nhu cầu cá nhân.',
  },
]

export function HomeFeatures() {
  return (
    <>
      <Title level={4} className="section-title">
        Điểm nổi bật của hệ thống
      </Title>
      <Row gutter={[16, 16]} className="feature-grid">
        {FEATURE_ITEMS.map((feature) => (
          <Col key={feature.title} xs={24} md={8}>
            <Card className="feature-card">
              <Title level={5}>{feature.title}</Title>
              <Paragraph>{feature.desc}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
