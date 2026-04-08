import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import {
  approveListing,
  createAdminArticle,
  fetchAdminArticles,
  fetchPendingListings,
  rejectListing,
  updateAdminArticle,
  type ArticleStatus,
  type ArticleType,
} from '../api/adminApi'
import type { ArticleDetail } from '../api/articleTypes'
import type { ListingDetail } from '../api/listingApi'
import { PageErrorState, PageLoadingState } from '../components/common/PageState'

type ArticleForm = {
  slug: string
  title: string
  excerpt?: string
  body?: string
  type: ArticleType
  status: ArticleStatus
  coverUrl?: string
  metaTitle?: string
  metaDescription?: string
}

export function AdminModerationPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingListings, setPendingListings] = useState<ListingDetail[]>([])
  const [articles, setArticles] = useState<ArticleDetail[]>([])
  const [articleOpen, setArticleOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null)
  const [savingArticle, setSavingArticle] = useState(false)
  const [form] = Form.useForm<ArticleForm>()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [listingRes, articleRes] = await Promise.all([
        fetchPendingListings({ page: 0, size: 100 }),
        fetchAdminArticles({ page: 0, size: 100 }),
      ])
      setPendingListings(listingRes.content ?? [])
      setArticles(articleRes.content ?? [])
    } catch {
      setError('Không thể tải dữ liệu duyệt nội dung.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const moderateListing = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await approveListing(id)
      else await rejectListing(id)
      message.success(action === 'approve' ? 'Đã duyệt tin.' : 'Đã từ chối tin.')
      await loadData()
    } catch {
      message.error('Không thể thực hiện thao tác duyệt.')
    }
  }

  const openCreateArticle = () => {
    setEditingArticle(null)
    form.resetFields()
    form.setFieldsValue({ type: 'NEWS', status: 'DRAFT' })
    setArticleOpen(true)
  }

  const openEditArticle = (item: ArticleDetail) => {
    setEditingArticle(item)
    form.setFieldsValue({
      slug: item.slug ?? '',
      title: item.title,
      excerpt: item.excerpt,
      body: item.body,
      type: (item.type as ArticleType) ?? 'NEWS',
      status: (item.status as ArticleStatus) ?? 'DRAFT',
      coverUrl: item.coverUrl,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
    })
    setArticleOpen(true)
  }

  const saveArticle = async () => {
    const values = await form.validateFields()
    setSavingArticle(true)
    try {
      if (editingArticle?.id) {
        await updateAdminArticle(editingArticle.id, values)
        message.success('Đã cập nhật bài viết.')
      } else {
        await createAdminArticle(values)
        message.success('Đã tạo bài viết.')
      }
      setArticleOpen(false)
      await loadData()
    } catch {
      message.error('Không thể lưu bài viết.')
    } finally {
      setSavingArticle(false)
    }
  }

  if (loading) return <PageLoadingState />
  if (error) return <PageErrorState message={error} />

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Quản trị duyệt tin và bài viết
      </Typography.Title>

      <Tabs
        items={[
          {
            key: 'listing',
            label: `Tin chờ duyệt (${pendingListings.length})`,
            children: (
              <Table<ListingDetail>
                rowKey="id"
                dataSource={pendingListings}
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: 'Tiêu đề', dataIndex: 'title' },
                  { title: 'Chủ tin', dataIndex: 'ownerName' },
                  { title: 'Địa chỉ', dataIndex: 'address' },
                  {
                    title: 'Giá',
                    dataIndex: 'price',
                    render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
                  },
                  {
                    title: 'Thao tác',
                    render: (_, row) => (
                      <Space>
                        <Button type="primary" onClick={() => void moderateListing(row.id, 'approve')}>
                          Duyệt
                        </Button>
                        <Popconfirm title="Từ chối tin này?" onConfirm={() => void moderateListing(row.id, 'reject')}>
                          <Button danger>Từ chối</Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'article',
            label: `Bài viết (${articles.length})`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" onClick={openCreateArticle}>
                  Tạo bài viết
                </Button>
                <Table<ArticleDetail>
                  rowKey="id"
                  dataSource={articles}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    { title: 'Tiêu đề', dataIndex: 'title' },
                    { title: 'Slug', dataIndex: 'slug' },
                    {
                      title: 'Trạng thái',
                      render: (_, row) => <Tag color={row.status === 'PUBLISHED' ? 'green' : 'gold'}>{row.status}</Tag>,
                    },
                    {
                      title: 'Thao tác',
                      render: (_, row) => <Button onClick={() => openEditArticle(row)}>Sửa/Duyệt</Button>,
                    },
                  ]}
                />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingArticle ? 'Cập nhật bài viết' : 'Tạo bài viết'}
        open={articleOpen}
        onCancel={() => setArticleOpen(false)}
        onOk={() => void saveArticle()}
        confirmLoading={savingArticle}
        width={860}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="middle" wrap>
            <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
              <Input style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="type" label="Loại bài" rules={[{ required: true }]}>
              <Select
                style={{ width: 180 }}
                options={[
                  { label: 'News', value: 'NEWS' },
                  { label: 'Blog', value: 'BLOG' },
                  { label: 'Guide', value: 'GUIDE' },
                  { label: 'Policy', value: 'POLICY' },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select
                style={{ width: 200 }}
                options={[
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Pending', value: 'PENDING_REVIEW' },
                  { label: 'Published', value: 'PUBLISHED' },
                  { label: 'Archived', value: 'ARCHIVED' },
                ]}
              />
            </Form.Item>
          </Space>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="excerpt" label="Tóm tắt">
            <Input />
          </Form.Item>
          <Form.Item name="coverUrl" label="Ảnh đại diện (URL)">
            <Input />
          </Form.Item>
          <Form.Item name="metaTitle" label="SEO meta title">
            <Input />
          </Form.Item>
          <Form.Item name="metaDescription" label="SEO meta description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="body" label="Nội dung">
            <Input.TextArea rows={10} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
