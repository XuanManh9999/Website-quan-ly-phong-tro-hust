import { Empty, List, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { fetchArticles } from '../api/articleApi'
import { ArticleFilters } from '../components/articles/ArticleFilters'
import { ArticleListItem } from '../components/articles/ArticleListItem'
import { PageErrorState, PageLoadingState } from '../components/common/PageState'
import type { ArticleSummary } from '../api/articleTypes'

export function ArticlesPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ArticleSummary[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(0)
  const pageSize = 12
  const [totalElements, setTotalElements] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetchArticles({ page, size: pageSize, q: query || undefined, category })
        setRows(res.content ?? [])
        setTotalElements(res.totalElements ?? 0)
      } catch {
        setError('Không thể tải danh sách bài viết.')
      } finally {
        setLoading(false)
      }
    })()
  }, [category, page, query])

  const categories = useMemo(() => {
    const names = [...new Set(rows.map((x) => x.categoryName).filter(Boolean) as string[])]
    return names.map((name) => ({ label: name, value: name }))
  }, [rows])

  if (loading) return <PageLoadingState />
  if (error) return <PageErrorState message={error} />

  return (
    <div>
      <Typography.Title level={3}>Tin tức và hướng dẫn</Typography.Title>
      <ArticleFilters
        query={query}
        category={category}
        categories={categories}
        onQueryChange={(value) => {
          setPage(0)
          setQuery(value)
        }}
        onCategoryChange={(value) => {
          setPage(0)
          setCategory(value)
        }}
        onReset={() => {
          setPage(0)
          setQuery('')
          setCategory(undefined)
        }}
      />
      <List
        itemLayout="vertical"
        dataSource={rows}
        locale={{ emptyText: <Empty description="Chưa có bài viết." /> }}
        pagination={{
          pageSize,
          current: page + 1,
          total: totalElements,
          onChange: (next) => setPage(next - 1),
          showSizeChanger: false,
        }}
        renderItem={(item) => <ArticleListItem item={item} />}
      />
    </div>
  )
}
