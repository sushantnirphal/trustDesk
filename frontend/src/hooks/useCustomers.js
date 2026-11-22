import { useQuery } from '@tanstack/react-query'
import { customersApi, ordersApi } from '../api/customers'
import { queryKeys } from '../api/queryKeys'

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: customersApi.list,
    staleTime: 5 * 60_000,
  })
}

export function useOrders(customerId) {
  return useQuery({
    queryKey: queryKeys.orders.byCustomer(customerId),
    queryFn: () => ordersApi.list({ customerId }),
    enabled: Boolean(customerId),
    staleTime: 60_000,
  })
}
