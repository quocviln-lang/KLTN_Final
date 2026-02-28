import React from 'react';
import { Typography, Button, Space, Divider, Row, Col, Card } from 'antd';
import { CheckCircleOutlined, ArrowRightOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;

const OrderSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Trong thực tế, dữ liệu này sẽ lấy từ location.state.orderData hoặc API GET /order/:id
    // Tạm thời dùng Mock Data giống 100% hình mẫu để dàn Layout
    const mockOrder = {
        orderId: '#TN-102938',
        createdAt: new Date(),
        paymentMethod: 'Credit Card (**** 4242)', // Hoặc 'Thanh toán tiền mặt'
        shippingAddress: '123 Tech Blvd, San Francisco, CA',
        items: [
            {
                _id: '1',
                name: 'RTX 4090 Gaming GPU',
                quantity: 1,
                price: 1599.00,
                image: 'https://via.placeholder.com/80?text=GPU'
            },
            {
                _id: '2',
                name: 'Mechanical Keyboard Pro',
                quantity: 1,
                price: 199.00,
                image: 'https://via.placeholder.com/80?text=Keyboard'
            }
        ],
        totalPaid: 1798.00
    };

    const orderData = location.state?.orderData || mockOrder;

    return (
        <div style={{
            background: '#0b1120', // Màu nền xanh đen đậm 
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            {/* Vỏ chứa (Container) */}
            <div style={{
                background: '#111827', // Nền Box xám xanh đậm
                borderRadius: '24px',
                padding: '48px 40px',
                maxWidth: '650px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>

                {/* Phần 1: Header (Mũi tên xanh lá glow mờ ảo) */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.1)', // Vòng halo màu xanh mờ
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        marginBottom: '24px',
                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' // Hiệu ứng Glow
                    }}>
                        <CheckCircleOutlined style={{ fontSize: '40px', color: '#10b981' }} />
                    </div>
                    
                    <Title level={2} style={{ color: '#fff', margin: '0 0 16px 0', fontWeight: 'bold' }}>
                        Đặt Hàng Thành Công
                    </Title>
                    <Text style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6', display: 'block', maxWidth: '400px', margin: '0 auto' }}>
                        Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đã được tiếp nhận và đang trong quá trình xử lý.
                    </Text>
                </div>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                {/* Phần 2: Thông tin Đơn hàng (Grid 2 Cột) */}
                <Row gutter={[24, 32]} style={{ marginBottom: '40px' }}>
                    <Col span={12}>
                        <Text style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Mã Đơn Hàng
                        </Text>
                        <Text strong style={{ color: '#fff', fontSize: '16px' }}>{orderData.orderId}</Text>
                    </Col>
                    <Col span={12}>
                        <Text style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Ngày Đặt
                        </Text>
                        <Text strong style={{ color: '#fff', fontSize: '16px' }}>{moment(orderData.createdAt).format('MMM DD, YYYY')}</Text>
                    </Col>
                    <Col span={12}>
                        <Text style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Phương thức Thanh toán
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>
                            <CreditCardOutlined style={{ marginRight: '8px', color: '#9ca3af' }} />
                            {orderData.paymentMethod}
                        </div>
                    </Col>
                    <Col span={12}>
                        <Text style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Địa chỉ Giao hàng
                        </Text>
                        <Text strong style={{ color: '#fff', fontSize: '15px' }}>{orderData.shippingAddress}</Text>
                    </Col>
                </Row>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                {/* Phần 3: Tóm tắt Đơn hàng */}
                <div style={{ marginBottom: '32px' }}>
                    <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>Tóm tắt Đơn hàng</Title>
                    
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {orderData.items.map((item) => (
                            <div key={item._id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ 
                                    width: '64px', 
                                    height: '64px', 
                                    borderRadius: '50%', 
                                    overflow: 'hidden', 
                                    background: '#1f2937',
                                    marginRight: '16px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ color: '#fff', fontSize: '15px', display: 'block' }}>{item.name}</Text>
                                    <Text style={{ color: '#9ca3af', fontSize: '14px' }}>SL: {item.quantity}</Text>
                                </div>
                                <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                                    ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </div>
                        ))}
                    </Space>
                </div>

                {/* Phần 4: Tổng cộng */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <Text style={{ color: '#9ca3af', fontSize: '16px', fontWeight: 'bold' }}>Tổng Đã Thanh Toán</Text>
                    <Text strong style={{ color: '#3b82f6', fontSize: '24px' }}>
                        ${orderData.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </div>

                {/* Phần 5: Hành động */}
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Button 
                        type="primary" 
                        block 
                        size="large"
                        onClick={() => navigate('/profile', { state: { activeTab: 'orders' }})}
                        style={{ 
                            height: '56px', 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            borderRadius: '12px',
                            background: '#2563eb', // Xanh dương sống động
                            border: 'none',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        Theo dõi Đơn hàng <ArrowRightOutlined />
                    </Button>
                    
                    <Button 
                        block 
                        size="large"
                        onClick={() => navigate('/products')}
                        style={{ 
                            height: '56px', 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            borderRadius: '12px',
                            background: 'transparent',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    >
                        Tiếp tục Mua sắm
                    </Button>
                </Space>

            </div>
        </div>
    );
};

export default OrderSuccessPage;
