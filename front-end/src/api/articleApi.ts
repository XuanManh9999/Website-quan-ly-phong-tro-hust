import { http } from './http'
import type { PageResponse } from './listingApi'
import type { ArticleDetail, ArticleSummary } from './articleTypes'

export async function fetchArticles(params: { page?: number; size?: number; category?: string; q?: string }) {
  const { data } = await http.get<PageResponse<ArticleSummary>>('/api/v1/articles', { params })
  return data
}

export async function fetchArticleBySlug(slug: string) {
  const { data } = await http.get<ArticleDetail>(`/api/v1/articles/${slug}`)
  return data
}
