import { Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchArticleBySlug } from '../api/articleApi'

export function ArticleDetailPage() {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [html, setHtml] = useState<string | null>(null)
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      try {
        const data = (await fetchArticleBySlug(slug)) as { title?: string; body?: string }
        setTitle(data.title ?? '')
        setHtml(data.body ?? '')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }

  return (
    <div>
      <Typography.Title level={2}>{title}</Typography.Title>
      <div className="article-body" dangerouslySetInnerHTML={{ __html: html ?? '' }} />
    </div>
  )
}
