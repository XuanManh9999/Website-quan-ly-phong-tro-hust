import { http } from './http'

export type SubscriptionPackage = {
  id: number
  code: string
  name: string
  description?: string
  priceVnd: number
  extraListingsPerMonth: number
  priorityDays?: number
}

export async function fetchPackages() {
  const { data } = await http.get<SubscriptionPackage[]>('/api/v1/packages')
  return data
}
