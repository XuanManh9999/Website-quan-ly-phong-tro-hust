import { http } from './http'
import type { PageResponse } from './listingApi'

export async function fetchArticles(params: { page?: number; size?: number; category?: string; q?: string }) {
  const { data } = await http.get<PageResponse<Record<string, unknown>>>('/api/v1/articles', { params })
  return data
}

export async function fetchArticleBySlug(slug: string) {
  const { data } = await http.get(`/api/v1/articles/${slug}`)
  return data
}
