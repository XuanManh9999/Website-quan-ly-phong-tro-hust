import { Descriptions, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchListingById } from '../api/listingApi'

export function ListingDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const data = await fetchListingById(Number(id))
        setItem(data as Record<string, unknown>)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }

  if (!item) {
    return <Typography.Text type="danger">Không tìm thấy tin.</Typography.Text>
  }

  return (
    <div>
      <Typography.Title level={3}>{String(item.title)}</Typography.Title>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Địa chỉ">{String(item.address)}</Descriptions.Item>
        <Descriptions.Item label="Giá">
          {Number(item.price).toLocaleString('vi-VN')} đ/tháng
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">{String(item.description ?? '')}</Descriptions.Item>
      </Descriptions>
    </div>
  )
}
