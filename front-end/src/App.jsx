import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth.jsx";
import { RequireRole } from "./auth/RequireRole.jsx";
import MainLayout from "./components/MainLayout.jsx";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import ForgotPasswordPage from "./pages/ForgotPassword.jsx";
import ResetPasswordPage from "./pages/ResetPassword.jsx";
import DashboardPage from "./pages/Dashboard.jsx";
import ProfilePage from "./pages/Profile.jsx";
import ChangePasswordPage from "./pages/ChangePassword.jsx";
import MyBookmarksPage from "./pages/MyBookmarks.jsx";
import RoomsListPage from "./pages/RoomsList.jsx";
import RoomDetailPage from "./pages/RoomDetail.jsx";
import BlogListPage from "./pages/BlogList.jsx";
import BlogDetailPage from "./pages/BlogDetail.jsx";
import AboutPage from "./pages/About.jsx";
import FaqsPage from "./pages/Faqs.jsx";
import LandlordRoomsPage from "./pages/LandlordRooms.jsx";
import LandlordRoomFormPage from "./pages/LandlordRoomForm.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboardPage from "./pages/AdminDashboard.jsx";
import AdminPendingRoomsPage from "./pages/AdminPendingRooms.jsx";
import AdminPostsListPage from "./pages/AdminPostsList.jsx";
import AdminPostEditorPage from "./pages/AdminPostEditor.jsx";
import AdminCategoriesPage from "./pages/AdminCategories.jsx";
import PaymentReturnPage from "./pages/PaymentReturn.jsx";
import AdminPackagesPage from "./pages/AdminPackages.jsx";
import AdminCouponsPage from "./pages/AdminCoupons.jsx";
import AdminStaticPagesPage from "./pages/AdminStaticPages.jsx";
import AdminStaticPageEditorPage from "./pages/AdminStaticPageEditor.jsx";
import AdminFaqsPage from "./pages/AdminFaqs.jsx";
import AdminUsersPage from "./pages/AdminUsers.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<RoomsListPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/rooms" element={<RoomsListPage />} />
        <Route path="/rooms/:id" element={<RoomDetailPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route
          path="/payment/vnpay-return"
          element={
            <RequireAuth>
              <PaymentReturnPage />
            </RequireAuth>
          }
        />
        <Route
          path="/payment/return"
          element={
            <RequireAuth>
              <PaymentReturnPage />
            </RequireAuth>
          }
        />
        <Route
          path="/landlord/rooms"
          element={
            <RequireRole roles={["landlord", "admin"]}>
              <LandlordRoomsPage />
            </RequireRole>
          }
        />
        <Route
          path="/landlord/rooms/new"
          element={
            <RequireRole roles={["landlord", "admin"]}>
              <LandlordRoomFormPage />
            </RequireRole>
          }
        />
        <Route
          path="/landlord/rooms/:id/edit"
          element={
            <RequireRole roles={["landlord", "admin"]}>
              <LandlordRoomFormPage />
            </RequireRole>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />
        <Route
          path="/me/bookmarks"
          element={
            <RequireAuth>
              <MyBookmarksPage />
            </RequireAuth>
          }
        />
        <Route
          path="/me/likes"
          element={
            <RequireAuth>
              <MyBookmarksPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireRole roles={["admin"]}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="rooms" element={<AdminPendingRoomsPage />} />
        <Route path="posts" element={<AdminPostsListPage />} />
        <Route path="posts/new" element={<AdminPostEditorPage />} />
        <Route path="posts/:id/edit" element={<AdminPostEditorPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="packages" element={<AdminPackagesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="pages" element={<AdminStaticPagesPage />} />
        <Route path="pages/new" element={<AdminStaticPageEditorPage />} />
        <Route path="pages/:id/edit" element={<AdminStaticPageEditorPage />} />
        <Route path="faqs" element={<AdminFaqsPage />} />
      </Route>
      <Route path="*" element={<div className="page">Không tìm thấy trang</div>} />
    </Routes>
  );
}

