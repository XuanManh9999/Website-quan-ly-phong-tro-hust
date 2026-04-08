import { MessageOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Drawer, Input, List, Space, Typography, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { sendChat } from '../api/chatApi'

type ChatMessage = {
  role: 'user' | 'bot'
  text: string
}

const CHAT_STORAGE_KEY = 'chat-widget-state'
const defaultMessages: ChatMessage[] = [
  { role: 'bot', text: 'Chào bạn! Mình có thể giúp lọc phòng theo giá, khu vực và nhu cầu.' },
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [apiMessage, contextHolder] = message.useMessage()

  const listRef = useRef<HTMLDivElement | null>(null)

  const placeholder = useMemo(() => 'Ví dụ: phòng gần HUST dưới 3 triệu, có điều hòa', [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { sessionId?: string; messages?: ChatMessage[] }
      setSessionId(parsed.sessionId)
      if (parsed.messages?.length) setMessages(parsed.messages)
    } catch {
      // ignore malformed storage
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({
        sessionId,
        messages: messages.slice(-30),
      }),
    )
  }, [messages, sessionId])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 10000, behavior: 'smooth' })
    })
  }, [open, messages])

  const onSend = async (preset?: string) => {
    const value = (preset ?? text).trim()
    if (!value || loading) return

    setText('')
    setMessages((prev) => [...prev, { role: 'user', text: value }])
    setLoading(true)

    try {
      const res = await sendChat(value, sessionId)
      setSessionId(res.sessionId)
      setMessages((prev) => [...prev, { role: 'bot', text: res.reply }])
    } catch {
      // auto retry once to improve reliability on transient timeout
      try {
        const retryRes = await sendChat(value, sessionId)
        setSessionId(retryRes.sessionId)
        setMessages((prev) => [...prev, { role: 'bot', text: retryRes.reply }])
      } catch {
        setMessages((prev) => [...prev, { role: 'bot', text: 'Kết nối tạm thời gián đoạn. Bạn vui lòng thử lại sau ít phút.' }])
        apiMessage.error('Chatbot đang bận hoặc timeout. Bạn thử gửi lại giúp mình nhé.')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetConversation = () => {
    setSessionId(undefined)
    setMessages(defaultMessages)
    setText('')
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        shape="circle"
        icon={<MessageOutlined />}
        size="large"
        className="chat-fab"
        style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000 }}
        onClick={() => setOpen(true)}
        aria-label="Mở chatbot"
      />

      <Drawer
        title="Trợ lý thuê trọ AI"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={420}
        footer={
          <Space style={{ width: '100%' }} direction="vertical">
            <Space wrap>
              <Button size="small" onClick={() => void onSend('Phòng dưới 3 triệu gần HUST')}>
                Gợi ý 1
              </Button>
              <Button size="small" onClick={() => void onSend('Gợi ý phòng còn trống ở Hai Bà Trưng')}>
                Gợi ý 2
              </Button>
              <Button size="small" onClick={resetConversation}>
                Làm mới chat
              </Button>
            </Space>
            <Space style={{ width: '100%' }}>
              <Input
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPressEnter={() => void onSend()}
                disabled={loading}
              />
              <Button type="primary" onClick={() => void onSend()} loading={loading} disabled={!text.trim()}>
                Gửi
              </Button>
            </Space>
          </Space>
        }
      >
        <div ref={listRef} style={{ height: 520, overflow: 'auto', paddingRight: 8 }}>
          <List
            dataSource={messages}
            renderItem={(m, idx) => (
              <List.Item key={idx}>
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  {m.role === 'bot' && <RobotOutlined style={{ color: '#1d4ed8', marginTop: 8 }} />}
                  <div
                    className={m.role === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-bot'}
                    style={{
                      maxWidth: 300,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <Typography.Text style={{ color: 'inherit' }}>{m.text}</Typography.Text>
                  </div>
                  {m.role === 'user' && <UserOutlined style={{ color: '#475569', marginTop: 8 }} />}
                </div>
              </List.Item>
            )}
          />
          {loading ? (
            <Typography.Text type="secondary" style={{ display: 'block', paddingInline: 8 }}>
              Trợ lý đang soạn câu trả lời...
            </Typography.Text>
          ) : null}
        </div>
      </Drawer>
    </>
  )
}
