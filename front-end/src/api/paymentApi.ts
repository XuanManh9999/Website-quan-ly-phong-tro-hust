import { http } from './http'

export type CreatePaymentResponse = {
  orderId: number
  paymentUrl: string
  vnpTxnRef: string
}

export async function createPaymentOrder(packageCode: string) {
  const { data } = await http.post<CreatePaymentResponse>('/api/v1/payments/orders', { packageCode })
  return data
}
