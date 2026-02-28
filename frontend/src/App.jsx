import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/client/HomePage';
import AuthPage from './pages/client/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductVariants from './pages/admin/AdminProductVariants';
import AdminReviews from './pages/admin/AdminReviews';
import AdminServices from './pages/admin/AdminServices'; 
import ProductsPage from './pages/client/ProductsPage';
import ProductDetailPage from './pages/client/ProductDetailPage';
import AdminPromotions from './pages/admin/AdminPromotions'; 
import AdminUsers from './pages/admin/AdminUsers'; 
import AdminOrders from './pages/admin/AdminOrders'; 
import AdminArticles from './pages/admin/AdminArticles'; 
import AdminFeedbacks from './pages/admin/AdminFeedbacks'; // <-- Import Hộp Thư
import CheckoutPage from './pages/client/CheckoutPage'; 
import CartPage from './pages/client/CartPage'; // <-- 1. IMPORT TRANG GIỎ HÀNG
import ProfilePage from './pages/client/ProfilePage';
import OrderSuccessPage from './pages/client/OrderSuccessPage'; // <-- THÊM MỚI Ở ĐÂY
import PromotionsPage from './pages/client/PromotionsPage';
import NewsPage from './pages/client/NewsPage';
import NewsDetailPage from './pages/client/NewsDetailPage';
import SupportPage from './pages/client/SupportPage';

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token || user?.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
};

// Route bảo vệ dành cho User thông thường (Khách hàng) - Chỉ cần đăng nhập
const UserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#2162ed' } }}>
            <AuthPage />
          </ConfigProvider>
        } />

        <Route path="/admin" element={
          <ProtectedRoute>
            <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#2162ed' } }}>
              <AdminLayout />
            </ConfigProvider>
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/:id/variants" element={<AdminProductVariants />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="news" element={<AdminArticles />} />
          <Route path="feedbacks" element={<AdminFeedbacks />} /> {/* <-- Route Hộp Thư */}
        </Route>

        <Route path="/" element={
          <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#2162ed', colorBgBase: '#101622' } }}>
            <ClientLayout />
          </ConfigProvider>
        }>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="category/:catId" element={<ProductsPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/success" element={<OrderSuccessPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<NewsDetailPage />} />
          <Route path="support" element={<SupportPage />} />

          <Route path="cart" element={<CartPage />} />
          <Route path="profile" element={
            <UserRoute>
              <ProfilePage />
            </UserRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;