import { Button, Card, Col, Input, InputNumber, Row, Select } from 'antd'

export type SortValue = 'newest' | 'priceAsc' | 'priceDesc'

type ListingFiltersProps = {
  query: string
  district?: string
  minPrice?: number
  maxPrice?: number
  sortBy: SortValue
  districtOptions: Array<{ label: string; value: string }>
  onQueryChange: (value: string) => void
  onDistrictChange: (value?: string) => void
  onMinPriceChange: (value?: number) => void
  onMaxPriceChange: (value?: number) => void
  onSortByChange: (value: SortValue) => void
  onReset: () => void
}

export function ListingFilters(props: ListingFiltersProps) {
  const {
    query,
    district,
    minPrice,
    maxPrice,
    sortBy,
    districtOptions,
    onQueryChange,
    onDistrictChange,
    onMinPriceChange,
    onMaxPriceChange,
    onSortByChange,
    onReset,
  } = props

  return (
    <Card className="filter-card" style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Input.Search
            allowClear
            placeholder="Tìm theo tiêu đề, địa chỉ..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            allowClear
            placeholder="Lọc theo quận/huyện"
            options={districtOptions}
            value={district}
            style={{ width: '100%' }}
            onChange={(v) => onDistrictChange(v)}
          />
        </Col>
        <Col xs={12} md={4}>
          <InputNumber
            min={0}
            value={minPrice}
            onChange={(v) => onMinPriceChange(v ?? undefined)}
            placeholder="Giá từ"
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={12} md={4}>
          <InputNumber
            min={0}
            value={maxPrice}
            onChange={(v) => onMaxPriceChange(v ?? undefined)}
            placeholder="Giá đến"
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={3}>
          <Select
            value={sortBy}
            style={{ width: '100%' }}
            options={[
              { label: 'Mới nhất', value: 'newest' },
              { label: 'Giá tăng dần', value: 'priceAsc' },
              { label: 'Giá giảm dần', value: 'priceDesc' },
            ]}
            onChange={(v) => onSortByChange(v)}
          />
        </Col>
        <Col xs={24} md={1}>
          <Button block onClick={onReset}>
            Reset
          </Button>
        </Col>
      </Row>
    </Card>
  )
}
