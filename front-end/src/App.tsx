import { lazy, Suspense } from 'react'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { PageLoadingState } from './components/common/PageState'

const AppLayout = lazy(() => import('./layouts/AppLayout').then((m) => ({ default: m.AppLayout })))
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ListingsPage = lazy(() => import('./pages/ListingsPage').then((m) => ({ default: m.ListingsPage })))
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage').then((m) => ({ default: m.ListingDetailPage })))
const ArticlesPage = lazy(() => import('./pages/ArticlesPage').then((m) => ({ default: m.ArticlesPage })))
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage').then((m) => ({ default: m.ArticleDetailPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const LandlordListingsPage = lazy(() => import('./pages/LandlordListingsPage').then((m) => ({ default: m.LandlordListingsPage })))
const AdminModerationPage = lazy(() => import('./pages/AdminModerationPage').then((m) => ({ default: m.AdminModerationPage })))
const PackagesPage = lazy(() => import('./pages/PackagesPage').then((m) => ({ default: m.PackagesPage })))
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage').then((m) => ({ default: m.PaymentResultPage })))

export default function App() {
  return (
    <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <Suspense fallback={<PageLoadingState />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="phong" element={<ListingsPage />} />
            <Route path="phong/:id" element={<ListingDetailPage />} />
            <Route path="tin" element={<ArticlesPage />} />
            <Route path="tin/:slug" element={<ArticleDetailPage />} />
            <Route path="dang-nhap" element={<LoginPage />} />
            <Route
              path="chu-tro/tin"
              element={
                <ProtectedRoute roles={['LANDLORD', 'ADMIN']}>
                  <LandlordListingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="quan-tri/duyet"
              element={
                <ProtectedRoute roles={['ADMIN', 'EDITOR']}>
                  <AdminModerationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="goi-dich-vu"
              element={
                <ProtectedRoute roles={['LANDLORD']}>
                  <PackagesPage />
                </ProtectedRoute>
              }
            />
            <Route path="thanh-toan/ket-qua" element={<PaymentResultPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ConfigProvider>
  )
}
