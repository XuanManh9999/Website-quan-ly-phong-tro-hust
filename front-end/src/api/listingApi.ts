import { http } from './http'

export interface ListingSummary {
  id: number
  title: string
  price: number
  district: string | null
  address: string
  status: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export async function fetchListings(params: {
  page?: number
  size?: number
  district?: string
  q?: string
}) {
  const { data } = await http.get<PageResponse<Record<string, unknown>>>('/api/v1/listings', {
    params,
  })
  return data
}

export async function fetchListingById(id: number) {
  const { data } = await http.get(`/api/v1/listings/${id}`)
  return data
}
