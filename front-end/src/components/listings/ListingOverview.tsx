import { Descriptions, Image, Space, Tag, Typography } from 'antd'
import type { ListingDetail } from '../../api/listingApi'

type ListingOverviewProps = {
  item: ListingDetail
}

const STATUS_TEXT: Record<string, string> = {
  ACTIVE: 'Đang hiển thị',
  PENDING: 'Chờ duyệt',
  INACTIVE: 'Tạm ẩn',
}

export function ListingOverview({ item }: ListingOverviewProps) {
  return (
    <>
      <Typography.Title level={3}>{item.title}</Typography.Title>
      {item.images?.length ? (
        <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
          {item.images.map((img, idx) => (
            <Image
              key={`${img.url}-${idx}`}
              src={img.url}
              width={160}
              height={110}
              style={{ objectFit: 'cover', borderRadius: 10 }}
              fallback="https://placehold.co/160x110?text=No+Image"
            />
          ))}
        </Space>
      ) : null}
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Chủ tin">{item.ownerName ?? 'Đang cập nhật'}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">{item.address}</Descriptions.Item>
        <Descriptions.Item label="Khu vực">{item.district ?? 'Đang cập nhật'}</Descriptions.Item>
        <Descriptions.Item label="Diện tích">{item.areaM2 ? `${item.areaM2} m²` : 'Đang cập nhật'}</Descriptions.Item>
        <Descriptions.Item label="Giá">{Number(item.price).toLocaleString('vi-VN')} đ/tháng</Descriptions.Item>
        <Descriptions.Item label="Tình trạng phòng">
          <Tag color={item.roomAvailable ? 'green' : 'red'}>{item.roomAvailable ? 'Còn phòng' : 'Đã đầy'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={item.status === 'ACTIVE' ? 'green' : item.status === 'PENDING' ? 'gold' : 'default'}>
            {STATUS_TEXT[item.status] ?? item.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">{item.description ?? 'Chưa có mô tả.'}</Descriptions.Item>
      </Descriptions>
    </>
  )
}
