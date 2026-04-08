import { lazy, Suspense, useMemo } from 'react'
import { Layout, Menu, theme } from 'antd'
import {
  HomeOutlined,
  SearchOutlined,
  ReadOutlined,
  LoginOutlined,
  LogoutOutlined,
  TeamOutlined,
  SettingOutlined,
  CreditCardOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearSession, getAccessToken, getCurrentUser } from '../auth/session'
import { PageLoadingState } from '../components/common/PageState'

const { Header, Content, Footer } = Layout
const ChatWidget = lazy(() => import('../components/ChatWidget').then((m) => ({ default: m.ChatWidget })))

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const token = getAccessToken()
  const currentUser = getCurrentUser()
  const selected = useMemo(() => {
    const p = location.pathname
    if (p.startsWith('/chu-tro')) return ['landlord']
    if (p.startsWith('/quan-tri')) return ['admin']
    if (p.startsWith('/goi-dich-vu')) return ['packages']
    if (p.startsWith('/tin')) return ['tin']
    if (p.startsWith('/phong')) return ['phong']
    if (p.startsWith('/dang-nhap')) return ['login']
    return ['home']
  }, [location.pathname])

  const logout = () => {
    clearSession()
    navigate('/dang-nhap')
  }

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="page-container app-header-inner">
          <Link to="/" className="app-brand">
            <div className="app-brand-icon">H</div>
            <div>
              Phòng trọ HUST
              <span>Nền tảng tìm trọ sinh viên</span>
            </div>
          </Link>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={selected}
            className="app-menu"
            items={[
              { key: 'home', icon: <HomeOutlined />, label: <Link to="/">Trang chủ</Link> },
              { key: 'phong', icon: <SearchOutlined />, label: <Link to="/phong">Tìm phòng</Link> },
              { key: 'tin', icon: <ReadOutlined />, label: <Link to="/tin">Tin và hướng dẫn</Link> },
              currentUser?.role === 'LANDLORD' || currentUser?.role === 'ADMIN'
                ? {
                    key: 'landlord',
                    icon: <TeamOutlined />,
                    label: <Link to="/chu-tro/tin">Quản lý tin</Link>,
                  }
                : null,
              currentUser?.role === 'ADMIN' || currentUser?.role === 'EDITOR'
                ? {
                    key: 'admin',
                    icon: <SettingOutlined />,
                    label: <Link to="/quan-tri/duyet">Duyệt nội dung</Link>,
                  }
                : null,
              currentUser?.role === 'LANDLORD'
                ? {
                    key: 'packages',
                    icon: <CreditCardOutlined />,
                    label: <Link to="/goi-dich-vu">Mua gói</Link>,
                  }
                : null,
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
            ].filter(Boolean)}
          />
        </div>
      </Header>
      <Content className="app-content">
        <div className="page-container">
          <div className="content-card" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </div>
        </div>
      </Content>
      <Footer className="footer-shell">
        <div className="footer-inner">
          <div>
            <div className="footer-title">Phòng trọ HUST</div>
            <div className="footer-text">
              Nền tảng tìm phòng trọ và kết nối chủ trọ gần khu vực Bách Khoa. Hỗ trợ lọc nhanh, tin duyệt và trợ
              lý AI.
            </div>
          </div>
          <div>
            <div className="footer-title">Điều hướng nhanh</div>
            <Link className="footer-link" to="/phong">
              Danh sách phòng
            </Link>
            <Link className="footer-link" to="/tin">
              Tin và hướng dẫn
            </Link>
            <Link className="footer-link" to="/dang-nhap">
              Đăng nhập
            </Link>
          </div>
          <div>
            <div className="footer-title">Kỹ thuật</div>
            <div className="footer-text">Frontend React + Ant Design, Backend Spring Boot, Auth JWT, AI chat.</div>
          </div>
        </div>
      </Footer>
      <Suspense fallback={<PageLoadingState />}>
        <ChatWidget />
      </Suspense>
    </Layout>
  )
}
