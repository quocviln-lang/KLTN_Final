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
import CheckoutPage from './pages/client/CheckoutPage'; // <-- 1. IMPORT TRANG CHECKOUT

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token || user?.role !== 'admin') return <Navigate to="/login" replace />;
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
          <Route path="checkout" element={<CheckoutPage />} /> {/* <-- 2. CẤP QUYỀN TRUY CẬP ROUTE CHECKOUT */}
          <Route path="cart" element={<div style={{ padding: 20 }}><h2>🛒 Giỏ hàng</h2></div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;