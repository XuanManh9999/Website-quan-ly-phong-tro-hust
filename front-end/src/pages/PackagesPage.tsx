import { Button, Card, Col, Row, Space, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { fetchPackages, type SubscriptionPackage } from '../api/packageApi'
import { createPaymentOrder } from '../api/paymentApi'
import { PageErrorState, PageLoadingState } from '../components/common/PageState'

export function PackagesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<SubscriptionPackage[]>([])
  const [buyingCode, setBuyingCode] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchPackages()
        setRows(data)
      } catch {
        setError('Không thể tải danh sách gói dịch vụ.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const buy = async (pkg: SubscriptionPackage) => {
    setBuyingCode(pkg.code)
    try {
      const res = await createPaymentOrder(pkg.code)
      window.location.href = res.paymentUrl
    } catch {
      message.error('Không thể tạo giao dịch thanh toán.')
      setBuyingCode(null)
    }
  }

  if (loading) return <PageLoadingState />
  if (error) return <PageErrorState message={error} />

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Gói dịch vụ chủ trọ
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {rows.map((pkg) => (
          <Col key={pkg.id} xs={24} md={8}>
            <Card className="listing-card" title={pkg.name}>
              <Typography.Paragraph>{pkg.description ?? 'Gói mở rộng quota đăng tin.'}</Typography.Paragraph>
              <Typography.Paragraph strong>
                {Number(pkg.priceVnd).toLocaleString('vi-VN')} đ
              </Typography.Paragraph>
              <Typography.Paragraph>+{pkg.extraListingsPerMonth} slot đăng/tháng</Typography.Paragraph>
              <Typography.Paragraph>
                Ưu tiên hiển thị: {pkg.priorityDays ? `${pkg.priorityDays} ngày` : 'Không áp dụng'}
              </Typography.Paragraph>
              <Button type="primary" loading={buyingCode === pkg.code} onClick={() => void buy(pkg)} block>
                Mua qua VNPay
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  )
}
