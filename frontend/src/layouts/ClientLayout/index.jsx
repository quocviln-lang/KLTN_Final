import React, { useState, useEffect } from 'react';
import { Layout, Input, Badge, Avatar, Dropdown, Space, Typography, Row, Col, Divider } from 'antd';
import { 
    ShoppingCartOutlined, 
    UserOutlined, 
    DownOutlined,
    MobileOutlined,
    CustomerServiceOutlined,
    ThunderboltOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api'; 

const { Header, Content, Footer } = Layout;
const { Search } = Input;
const { Text, Title } = Typography;

const ClientLayout = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const [cartItemCount, setCartItemCount] = useState(0); 

    const categoryItems = [
        { key: 'phones', icon: <MobileOutlined />, label: <Link to="/category/phones">Điện thoại</Link> },
        { key: 'audio', icon: <CustomerServiceOutlined />, label: <Link to="/category/audio">Tai nghe</Link> },
        { key: 'chargers', icon: <ThunderboltOutlined />, label: <Link to="/category/chargers">Sạc & Cáp</Link> },
        { key: 'cases', icon: <SafetyOutlined />, label: <Link to="/category/cases">Ốp lưng</Link> },
    ];

    // ================= LOGIC LẮNG NGHE SỰ KIỆN GIỎ HÀNG (EVENT LISTENER) =================
    useEffect(() => {
        const fetchCartCount = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setCartItemCount(0);
                return;
            }
            try {
                const res = await api.get('/cart', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const items = res.data.data?.items || [];
                const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
                setCartItemCount(totalCount);
            } catch (error) {
                console.error('Lỗi lấy thông tin giỏ hàng trên Header:', error);
            }
        };

        // 1. Chạy 1 lần khi load trang hoặc người dùng đổi URL
        fetchCartCount();

        // 2. Bật "ăng-ten" lắng nghe tín hiệu CART_UPDATED từ các trang khác bắn sang
        window.addEventListener('CART_UPDATED', fetchCartCount);

        // 3. Tắt "ăng-ten" khi component bị hủy (Tránh rò rỉ bộ nhớ - Clean Code chuẩn mực)
        return () => {
            window.removeEventListener('CART_UPDATED', fetchCartCount);
        };
    }, [location.pathname]);

    return (
        <Layout style={{ minHeight: '100vh', background: '#0d1117' }}>
            {/* ================= HEADER ================= */}
            <Header style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 999, 
                background: '#101622', 
                padding: '0 50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1f2937',
                height: '80px'
            }}>
                {/* Logo & Tên Web */}
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ 
                        width: '40px', height: '40px', background: '#2162ed', 
                        borderRadius: '8px', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '20px', marginRight: '12px'
                    }}>
                        T
                    </div>
                    <Title level={3} style={{ color: '#fff', margin: 0, letterSpacing: '1px' }}>TechNova</Title>
                </div>

                {/* Thanh Tìm Kiếm */}
                <div style={{ flex: 1, maxWidth: '400px', margin: '0 40px' }}>
                    <Search 
                        placeholder="Bạn tìm gì hôm nay?" 
                        allowClear 
                        enterButton 
                        size="large"
                        style={{ width: '100%' }}
                        className="dark-search-bar"
                    />
                </div>

                {/* Navigation Links */}
                <Space size="large" style={{ fontSize: '16px', fontWeight: '500' }}>
                    <Dropdown menu={{ items: categoryItems }} placement="bottomLeft">
                        <span style={{ color: '#e6edf3', cursor: 'pointer' }}>
                            Danh mục <DownOutlined style={{ fontSize: '12px' }} />
                        </span>
                    </Dropdown>
                    <Link to="/products" style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>Sản phẩm</Link>
                    <Link to="/promotions" style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>Khuyến mãi</Link>
                    <Link to="/news" style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>Tin tức</Link>
                    <Link to="/support" style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>Hỗ trợ</Link>
                </Space>

                {/* Giỏ hàng & User */}
                <Space size="large" style={{ marginLeft: '40px' }}>
                    {/* Badge đã được gắn state động, sẽ nhảy số ngay lập tức! */}
                    <Badge count={cartItemCount} size="small" color="#f5222d">
                        <ShoppingCartOutlined 
                            style={{ fontSize: '24px', color: '#fff', cursor: 'pointer' }} 
                            onClick={() => navigate('/cart')}
                        />
                    </Badge>
                    <div 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
                        onClick={() => {
                            const token = localStorage.getItem('token');
                            navigate(token ? '/profile' : '/login');
                        }}
                    >
                        <Avatar 
                            icon={<UserOutlined />} 
                            src={JSON.parse(localStorage.getItem('user'))?.avatar}
                            style={{ backgroundColor: '#2162ed' }} 
                        />
                        <Text style={{ color: '#fff', display: { xs: 'none', md: 'block' } }}>
                            {JSON.parse(localStorage.getItem('user'))?.name || 'Tài khoản'}
                        </Text>
                    </div>
                </Space>
            </Header>

            {/* ================= CONTENT ================= */}
            <Content style={{ padding: '0 50px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <Outlet /> 
            </Content>

            {/* ================= FOOTER ================= */}
            <Footer style={{ background: '#0a0d14', color: '#8b949e', padding: '60px 50px', borderTop: '1px solid #1f2937', marginTop: '40px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <Row gutter={[32, 32]}>
                        <Col xs={24} sm={12} md={6}>
                            <Title level={4} style={{ color: '#fff' }}>TechNova</Title>
                            <p>Kỷ nguyên công nghệ mới. Chúng tôi cam kết mang đến những thiết bị đỉnh cao nhất với dịch vụ hậu mãi chuẩn 5 sao.</p>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Title level={5} style={{ color: '#fff' }}>Danh mục</Title>
                            <Space direction="vertical">
                                <Link to="/category/phones" style={{ color: '#8b949e' }}>Điện thoại thông minh</Link>
                                <Link to="/category/audio" style={{ color: '#8b949e' }}>Âm thanh cao cấp</Link>
                                <Link to="/category/chargers" style={{ color: '#8b949e' }}>Cáp & Củ sạc</Link>
                                <Link to="/category/cases" style={{ color: '#8b949e' }}>Phụ kiện bảo vệ</Link>
                            </Space>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Title level={5} style={{ color: '#fff' }}>Hỗ trợ</Title>
                            <Space direction="vertical">
                                <span style={{ cursor: 'pointer' }}>Chính sách bảo hành</span>
                                <span style={{ cursor: 'pointer' }}>Hướng dẫn mua trả góp</span>
                                <span style={{ cursor: 'pointer' }}>Tra cứu đơn hàng</span>
                            </Space>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Title level={5} style={{ color: '#fff' }}>Liên hệ</Title>
                            <Space direction="vertical">
                                <span>📞 1900 8888</span>
                                <span>📧 hotro@technova.com</span>
                                <span>📍 Tòa nhà Bitexco, TP.HCM</span>
                            </Space>
                        </Col>
                    </Row>
                    <Divider style={{ borderColor: '#1f2937' }} />
                    <div style={{ textAlign: 'center' }}>
                        TechNova ©{new Date().getFullYear()} - Đồ án tốt nghiệp. All Rights Reserved.
                    </div>
                </div>
            </Footer>
        </Layout>
    );
};

export default ClientLayout;