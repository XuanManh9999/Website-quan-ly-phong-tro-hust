import { Alert, Skeleton, Space } from 'antd'

export function PageLoadingState() {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Skeleton active paragraph={{ rows: 2 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
      <Skeleton active paragraph={{ rows: 3 }} />
    </Space>
  )
}

type PageErrorStateProps = {
  message: string
}

export function PageErrorState({ message }: PageErrorStateProps) {
  return <Alert type="error" message="Đã xảy ra lỗi" description={message} showIcon />
}
