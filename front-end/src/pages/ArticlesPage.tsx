import { List, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchArticles } from '../api/articleApi'

export function ArticlesPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetchArticles({ page: 0, size: 20 })
        setRows((res.content as Record<string, unknown>[]) ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }

  return (
    <div>
      <Typography.Title level={3}>Tin tức & hướng dẫn</Typography.Title>
      <List
        itemLayout="vertical"
        dataSource={rows}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<Link to={`/tin/${item.slug}`}>{String(item.title)}</Link>}
              description={String(item.excerpt ?? '')}
            />
          </List.Item>
        )}
      />
    </div>
  )
}
