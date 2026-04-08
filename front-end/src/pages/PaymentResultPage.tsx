import { Button, Result, Space, Typography } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'

export function PaymentResultPage() {
  const [params] = useSearchParams()
  const responseCode = params.get('vnp_ResponseCode')
  const txnRef = params.get('vnp_TxnRef')
  const amount = params.get('vnp_Amount')

  const isSuccess = responseCode === '00'
  const formattedAmount = amount ? `${(Number(amount) / 100).toLocaleString('vi-VN')} đ` : undefined

  return (
    <Result
      status={isSuccess ? 'success' : 'warning'}
      title={isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}
      subTitle={isSuccess ? 'Giao dịch đã được ghi nhận. Hệ thống sẽ cập nhật quota sớm nhất.' : 'Bạn có thể thử lại hoặc liên hệ hỗ trợ.'}
      extra={[
        <Link to="/goi-dich-vu" key="retry">
          <Button type="primary">Quay lại mua gói</Button>
        </Link>,
        <Link to="/" key="home">
          <Button>Về trang chủ</Button>
        </Link>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {txnRef ? <Typography.Text>Mã giao dịch: {txnRef}</Typography.Text> : null}
        {formattedAmount ? <Typography.Text>Số tiền: {formattedAmount}</Typography.Text> : null}
        {responseCode ? <Typography.Text>Mã phản hồi VNPay: {responseCode}</Typography.Text> : null}
      </Space>
    </Result>
  )
}
