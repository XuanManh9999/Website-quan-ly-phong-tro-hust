import { http } from './http'
import type { ListingDetail, PageResponse } from './listingApi'

export type ListingUpsertPayload = {
  title: string
  description?: string
  price: number
  areaM2?: number
  address: string
  district?: string
  latitude?: number
  longitude?: number
  roomAvailable: boolean
  images?: Array<{ url: string; sortOrder: number }>
}

export async function fetchMyListings(params: { page?: number; size?: number }) {
  const { data } = await http.get<PageResponse<ListingDetail>>('/api/v1/landlord/listings', { params })
  return data
}

export async function createMyListing(payload: ListingUpsertPayload) {
  const { data } = await http.post<ListingDetail>('/api/v1/landlord/listings', payload)
  return data
}

export async function updateMyListing(id: number, payload: ListingUpsertPayload) {
  const { data } = await http.put<ListingDetail>(`/api/v1/landlord/listings/${id}`, payload)
  return data
}

export async function deleteMyListing(id: number) {
  await http.delete(`/api/v1/landlord/listings/${id}`)
}
