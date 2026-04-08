import { Alert, Button, Space } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchListingById, type ListingDetail } from '../api/listingApi'
import { PageLoadingState } from '../components/common/PageState'
import { ListingOverview } from '../components/listings/ListingOverview'

export function ListingDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<ListingDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setError(null)
        const data = await fetchListingById(Number(id))
        setItem(data)
      } catch {
        setError('Không thể tải chi tiết phòng.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <PageLoadingState />

  if (!item) {
    return <Alert type="warning" message={error ?? 'Không tìm thấy tin.'} showIcon />
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Link to="/phong">
        <Button>&larr; Quay lại danh sách</Button>
      </Link>
      <ListingOverview item={item} />
    </Space>
  )
}
