import { Card, Col, Row, Statistic } from 'antd'

const STATS = [
  { label: 'Nguồn dữ liệu', value: 'Listings + Articles' },
  { label: 'Tìm kiếm', value: 'Theo từ khóa/khu vực' },
  { label: 'Hỗ trợ', value: 'Chatbot AI 24/7' },
]

export function HomeStats() {
  return (
    <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
      {STATS.map((item) => (
        <Col key={item.label} xs={24} md={8}>
          <Card className="feature-card home-kpi">
            <Statistic title={item.label} value={item.value} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}
