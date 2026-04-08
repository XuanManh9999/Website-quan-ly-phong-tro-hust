import { Empty, List, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { fetchListings, type ListingSummary } from '../api/listingApi'
import { PageErrorState, PageLoadingState } from '../components/common/PageState'
import { ListingCardItem } from '../components/listings/ListingCardItem'
import { ListingFilters, type SortValue } from '../components/listings/ListingFilters'

const { Text } = Typography

export function ListingsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ content: ListingSummary[]; totalElements: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState<string | undefined>(undefined)
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
  const [sortBy, setSortBy] = useState<SortValue>('newest')
  const [page, setPage] = useState(0)
  const pageSize = 12

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetchListings({
          page,
          size: pageSize,
          q: query || undefined,
          district,
          minPrice,
          maxPrice,
        })
        if (!cancelled) setData({ content: res.content, totalElements: res.totalElements })
      } catch {
        if (!cancelled) setError('Không tải được danh sách phòng. Vui lòng kiểm tra API backend.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [district, maxPrice, minPrice, page, query])

  const districtOptions = useMemo(() => {
    const source = data?.content ?? []
    const names = [...new Set(source.map((x) => x.district).filter(Boolean) as string[])]
    return names.map((name) => ({ label: name, value: name }))
  }, [data?.content])

  const sortedContent = useMemo(() => {
    const source = [...(data?.content ?? [])]
    if (sortBy === 'priceAsc') return source.sort((a, b) => a.price - b.price)
    if (sortBy === 'priceDesc') return source.sort((a, b) => b.price - a.price)
    return source
  }, [data?.content, sortBy])

  if (loading) return <PageLoadingState />

  if (error) return <PageErrorState message={error} />

  return (
    <div>
      <Typography.Title level={3}>Danh sách phòng</Typography.Title>
      <ListingFilters
        query={query}
        district={district}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sortBy={sortBy}
        districtOptions={districtOptions}
        onQueryChange={(value) => {
          setPage(0)
          setQuery(value)
        }}
        onDistrictChange={(value) => {
          setPage(0)
          setDistrict(value)
        }}
        onMinPriceChange={(value) => {
          setPage(0)
          setMinPrice(value)
        }}
        onMaxPriceChange={(value) => {
          setPage(0)
          setMaxPrice(value)
        }}
        onSortByChange={setSortBy}
        onReset={() => {
          setPage(0)
          setQuery('')
          setDistrict(undefined)
          setMinPrice(undefined)
          setMaxPrice(undefined)
          setSortBy('newest')
        }}
      />
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Tổng {data?.totalElements ?? 0} kết quả
      </Text>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={sortedContent}
        locale={{
          emptyText: <Empty description="Chưa có tin phòng phù hợp bộ lọc." />,
        }}
        pagination={{
          pageSize,
          current: page + 1,
          total: data?.totalElements ?? 0,
          onChange: (next) => setPage(next - 1),
          showSizeChanger: false,
        }}
        renderItem={(item) => (
          <List.Item>
            <ListingCardItem item={item} />
          </List.Item>
        )}
      />
    </div>
  )
}
