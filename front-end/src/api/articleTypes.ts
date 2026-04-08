export interface ArticleSummary {
  id?: number
  slug: string
  title: string
  excerpt?: string
  categoryName?: string
  authorName?: string
  publishedAt?: string
  viewCount?: number
  coverUrl?: string
}

export interface ArticleDetail {
  id?: number
  slug?: string
  title: string
  body: string
  type?: 'NEWS' | 'BLOG' | 'GUIDE' | 'POLICY'
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  excerpt?: string
  categoryName?: string
  authorName?: string
  publishedAt?: string
  viewCount?: number
  coverUrl?: string
  tagNames?: string[]
  metaTitle?: string
  metaDescription?: string
}
