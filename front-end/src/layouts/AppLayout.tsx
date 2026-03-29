import { Layout, Menu, theme } from 'antd'
import {
  HomeOutlined,
  SearchOutlined,
  ReadOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

const { Header, Content, Footer } = Layout

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const token = localStorage.getItem('accessToken')
  const selected = useMemo(() => {
    const p = location.pathname
    if (p.startsWith('/tin')) return ['tin']
    if (p.startsWith('/phong')) return ['phong']
    if (p.startsWith('/dang-nhap')) return ['login']
    return ['home']
  }, [location.pathname])

  const logout = () => {
    localStorage.removeItem('accessToken')
    navigate('/dang-nhap')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', paddingInline: 24 }}>
        <div style={{ color: '#fff', fontWeight: 700, marginRight: 32, fontSize: 18 }}>
          <Link to="/" style={{ color: 'inherit' }}>
            Phòng trọ HUST
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={selected}
          style={{ flex: 1, minWidth: 0 }}
          items={[
            { key: 'home', icon: <HomeOutlined />, label: <Link to="/">Trang chủ</Link> },
            { key: 'phong', icon: <SearchOutlined />, label: <Link to="/phong">Tìm phòng</Link> },
            { key: 'tin', icon: <ReadOutlined />, label: <Link to="/tin">Tin & hướng dẫn</Link> },
            token
              ? {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Đăng xuất',
                  onClick: logout,
                }
              : {
                  key: 'login',
                  icon: <LoginOutlined />,
                  label: <Link to="/dang-nhap">Đăng nhập</Link>,
                },
          ]}
        />
      </Header>
      <Content style={{ padding: 24 }}>
        <div
          style={{
            background: colorBgContainer,
            padding: 24,
            borderRadius: borderRadiusLG,
            minHeight: 360,
          }}
        >
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        HUST Room Rental — base UI · kết nối API Spring Boot
      </Footer>
    </Layout>
  )
}
