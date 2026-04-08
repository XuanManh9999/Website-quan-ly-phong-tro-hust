import { http } from './http'

export interface ListingSummary {
  id: number
  title: string
  price: number
  district: string | null
  address: string
  status: string
  roomAvailable?: boolean
  areaM2?: number
}

export interface ListingDetail extends ListingSummary {
  description?: string
  ownerName?: string
  images?: Array<{ url: string; sortOrder?: number }>
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
  minPrice?: number
  maxPrice?: number
}) {
  const { data } = await http.get<PageResponse<ListingSummary>>('/api/v1/listings', {
    params,
  })
  return data
}

export async function fetchListingById(id: number) {
  const { data } = await http.get<ListingDetail>(`/api/v1/listings/${id}`)
  return data
}
