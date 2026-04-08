import { Alert, Button, Space, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchArticleBySlug } from '../api/articleApi'
import { ArticleMarkdownContent } from '../components/articles/ArticleMarkdownContent'
import { PageLoadingState } from '../components/common/PageState'
import type { ArticleDetail } from '../api/articleTypes'

export function ArticleDetailPage() {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      try {
        setError(null)
        const data = await fetchArticleBySlug(slug)
        setArticle(data)
      } catch {
        setError('Không thể tải nội dung bài viết.')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) return <PageLoadingState />
  if (error) return <Alert type="error" showIcon message={error} />

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Link to="/tin">
        <Button>&larr; Quay lại danh sách bài viết</Button>
      </Link>
      <Typography.Title level={2}>{article?.title ?? ''}</Typography.Title>
      <Space size={[8, 8]} wrap>
        {article?.categoryName ? <Tag color="geekblue">{article.categoryName}</Tag> : null}
        {article?.authorName ? <Tag color="purple">Tác giả: {article.authorName}</Tag> : null}
        {article?.publishedAt ? (
          <Tag>Xuất bản: {new Date(article.publishedAt).toLocaleDateString('vi-VN')}</Tag>
        ) : null}
        {typeof article?.viewCount === 'number' ? <Tag>{article.viewCount} lượt xem</Tag> : null}
        <Button
          size="small"
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href)
            message.success('Đã sao chép liên kết bài viết')
          }}
        >
          Sao chép link
        </Button>
      </Space>
      <ArticleMarkdownContent body={article?.body ?? ''} />
    </Space>
  )
}
