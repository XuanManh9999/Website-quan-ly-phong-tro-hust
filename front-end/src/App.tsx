import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { ArticlesPage } from './pages/ArticlesPage'
import { ArticleDetailPage } from './pages/ArticleDetailPage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  return (
    <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="phong" element={<ListingsPage />} />
          <Route path="phong/:id" element={<ListingDetailPage />} />
          <Route path="tin" element={<ArticlesPage />} />
          <Route path="tin/:slug" element={<ArticleDetailPage />} />
          <Route path="dang-nhap" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}
