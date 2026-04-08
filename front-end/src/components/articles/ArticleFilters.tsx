import { Button, Card, Col, Input, Row, Select } from 'antd'

type ArticleFiltersProps = {
  query: string
  category?: string
  categories: Array<{ label: string; value: string }>
  onQueryChange: (value: string) => void
  onCategoryChange: (value?: string) => void
  onReset: () => void
}

export function ArticleFilters({
  query,
  category,
  categories,
  onQueryChange,
  onCategoryChange,
  onReset,
}: ArticleFiltersProps) {
  return (
    <Card className="filter-card" style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={16}>
          <Input.Search
            allowClear
            placeholder="Tìm bài viết theo tiêu đề/nội dung..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </Col>
        <Col xs={24} md={6}>
          <Select
            allowClear
            placeholder="Lọc theo danh mục"
            options={categories}
            value={category}
            style={{ width: '100%' }}
            onChange={(v) => onCategoryChange(v)}
          />
        </Col>
        <Col xs={24} md={2}>
          <Button block onClick={onReset}>
            Reset
          </Button>
        </Col>
      </Row>
    </Card>
  )
}
