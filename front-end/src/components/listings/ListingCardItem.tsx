import { Card, Col, Row, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import type { ListingSummary } from '../../api/listingApi'

const { Text } = Typography

type ListingCardItemProps = {
  item: ListingSummary
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  PENDING: 'gold',
  INACTIVE: 'default',
}

export function ListingCardItem({ item }: ListingCardItemProps) {
  return (
    <Card className="listing-card" title={item.title} extra={<Link to={`/phong/${item.id}`}>Chi tiết</Link>}>
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Text type="secondary">{item.address}</Text> {item.district ? <Text type="secondary">- {item.district}</Text> : null}
        </Col>
        <Col span={24}>
          <Text strong>{Number(item.price ?? 0).toLocaleString('vi-VN')} đ/tháng</Text>
        </Col>
        {item.areaM2 ? (
          <Col span={24}>
            <Text type="secondary">Diện tích: {item.areaM2} m²</Text>
          </Col>
        ) : null}
        <Col span={24}>
          <Tag color={STATUS_COLORS[item.status] ?? 'blue'}>{item.status}</Tag>
          {typeof item.roomAvailable === 'boolean' ? (
            <Tag color={item.roomAvailable ? 'green' : 'red'}>{item.roomAvailable ? 'Còn phòng' : 'Đã đầy'}</Tag>
          ) : null}
        </Col>
      </Row>
    </Card>
  )
}
