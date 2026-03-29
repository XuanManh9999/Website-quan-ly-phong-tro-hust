import { Card, Col, List, Row, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchListings } from '../api/listingApi'

const { Text } = Typography

export function ListingsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ content: Record<string, unknown>[]; totalElements: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetchListings({ page: 0, size: 12 })
        if (!cancelled) setData(res as { content: Record<string, unknown>[]; totalElements: number })
      } catch (e) {
        if (!cancelled) setError('Không tải được danh sách (kiểm tra API đã chạy chưa).')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return <Text type="danger">{error}</Text>
  }

  return (
    <div>
      <Typography.Title level={3}>Danh sách phòng</Typography.Title>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={data?.content ?? []}
        renderItem={(item) => (
          <List.Item>
            <Card title={String(item.title ?? '')} extra={<Link to={`/phong/${item.id}`}>Chi tiết</Link>}>
              <Row gutter={[8, 8]}>
                <Col span={24}>
                  <Text type="secondary">{String(item.address ?? '')}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>{Number(item.price ?? 0).toLocaleString('vi-VN')} đ/tháng</Text>
                </Col>
              </Row>
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}
