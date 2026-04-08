import { http } from './http'
import type { ArticleDetail } from './articleTypes'
import type { ListingDetail, PageResponse } from './listingApi'

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
export type ArticleType = 'NEWS' | 'BLOG' | 'GUIDE' | 'POLICY'

export type ArticleUpsertPayload = {
  slug: string
  title: string
  excerpt?: string
  body?: string
  type: ArticleType
  status?: ArticleStatus
  coverUrl?: string
  categoryId?: number
  tagIds?: number[]
  metaTitle?: string
  metaDescription?: string
}

export async function fetchPendingListings(params: { page?: number; size?: number }) {
  const { data } = await http.get<PageResponse<ListingDetail>>('/api/v1/admin/listings', { params })
  return data
}

export async function approveListing(id: number) {
  await http.post(`/api/v1/admin/listings/${id}/approve`)
}

export async function rejectListing(id: number) {
  await http.post(`/api/v1/admin/listings/${id}/reject`)
}

export async function fetchAdminArticles(params: { page?: number; size?: number }) {
  const { data } = await http.get<PageResponse<ArticleDetail>>('/api/v1/admin/articles', { params })
  return data
}

export async function createAdminArticle(payload: ArticleUpsertPayload) {
  const { data } = await http.post<ArticleDetail>('/api/v1/admin/articles', payload)
  return data
}

export async function updateAdminArticle(id: number, payload: ArticleUpsertPayload) {
  const { data } = await http.put<ArticleDetail>(`/api/v1/admin/articles/${id}`, payload)
  return data
}
