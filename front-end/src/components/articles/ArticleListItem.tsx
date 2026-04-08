import { Card, List, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import type { ArticleSummary } from '../../api/articleTypes'

const { Text } = Typography

type ArticleListItemProps = {
  item: ArticleSummary
}

export function ArticleListItem({ item }: ArticleListItemProps) {
  return (
    <List.Item>
      <Card className="listing-card" style={{ width: '100%' }}>
        <List.Item.Meta title={<Link to={`/tin/${item.slug}`}>{item.title}</Link>} description={item.excerpt ?? 'Chưa có mô tả ngắn.'} />
        <div style={{ marginTop: 10 }}>
          {item.categoryName ? <Tag color="geekblue">{item.categoryName}</Tag> : null}
          {item.authorName ? <Tag color="purple">{item.authorName}</Tag> : null}
          {item.publishedAt ? <Text type="secondary">Đăng lúc: {new Date(item.publishedAt).toLocaleString('vi-VN')}</Text> : null}
          {typeof item.viewCount === 'number' ? <Text type="secondary"> · {item.viewCount} lượt xem</Text> : null}
        </div>
      </Card>
    </List.Item>
  )
}
