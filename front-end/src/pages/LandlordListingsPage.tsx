import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import type { ListingDetail } from '../api/listingApi'
import {
  createMyListing,
  deleteMyListing,
  fetchMyListings,
  updateMyListing,
  type ListingUpsertPayload,
} from '../api/landlordListingApi'
import { PageErrorState, PageLoadingState } from '../components/common/PageState'

type FormValues = ListingUpsertPayload

export function LandlordListingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ListingDetail[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ListingDetail | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchMyListings({ page: 0, size: 50 })
      setRows(res.content ?? [])
    } catch {
      setError('Không thể tải danh sách tin của bạn.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ roomAvailable: true })
    setOpen(true)
  }

  const openEdit = (item: ListingDetail) => {
    setEditing(item)
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      price: item.price,
      areaM2: item.areaM2,
      address: item.address,
      district: item.district ?? undefined,
      roomAvailable: Boolean(item.roomAvailable),
    })
    setOpen(true)
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editing?.id) {
        await updateMyListing(editing.id, {
          ...values,
          images: (editing.images ?? []).map((img, idx) => ({ url: img.url, sortOrder: img.sortOrder ?? idx })),
        })
        message.success('Cập nhật tin thành công (đã chuyển chờ duyệt).')
      } else {
        await createMyListing({ ...values, images: [] })
        message.success('Tạo tin thành công (đang chờ duyệt).')
      }
      setOpen(false)
      await loadData()
    } catch {
      message.error('Không thể lưu tin. Vui lòng kiểm tra dữ liệu.')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteMyListing(id)
      message.success('Đã xóa tin.')
      await loadData()
    } catch {
      message.error('Không thể xóa tin.')
    }
  }

  if (loading) return <PageLoadingState />
  if (error) return <PageErrorState message={error} />

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Quản lý tin chủ trọ
        </Typography.Title>
        <Button type="primary" onClick={openCreate}>
          Tạo tin mới
        </Button>
      </Space>

      <Table<ListingDetail>
        rowKey="id"
        dataSource={rows}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Tiêu đề', dataIndex: 'title' },
          { title: 'Địa chỉ', dataIndex: 'address' },
          {
            title: 'Giá',
            dataIndex: 'price',
            render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
          },
          { title: 'Trạng thái', dataIndex: 'status' },
          {
            title: 'Thao tác',
            render: (_, row) => (
              <Space>
                <Button onClick={() => openEdit(row)}>Sửa</Button>
                <Popconfirm title="Xóa tin này?" onConfirm={() => onDelete(row.id)}>
                  <Button danger>Xóa</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Cập nhật tin' : 'Tạo tin mới'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void onSubmit()}
        confirmLoading={submitting}
        width={760}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle" wrap>
            <Form.Item name="price" label="Giá" rules={[{ required: true }]}>
              <InputNumber min={100000} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="areaM2" label="Diện tích (m²)">
              <InputNumber min={1} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="district" label="Quận/Huyện">
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="Địa chỉ" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roomAvailable" label="Còn phòng" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
