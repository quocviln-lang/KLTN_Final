import React, { useState, useEffect } from 'react';
import { Typography, Card, Tag, Spin, Space, Avatar, Button, Empty, Divider } from 'antd';
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    SyncOutlined, 
    CarOutlined, 
    CloseCircleOutlined,
    ShoppingOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const UserOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyOrders = async () => {
             setLoading(true);
             try {
                 const token = localStorage.getItem('token');
                 const res = await api.get('/orders/me', {
                     headers: { Authorization: `Bearer ${token}` }
                 });
                 if (res.data.success) {
                     setOrders(res.data.data);
                 }
             } catch (error) {
                 console.error('Lỗi khi tải lịch sử đơn hàng', error);
             } finally {
                 setLoading(false);
             }
        };

        fetchMyOrders();
    }, []);

    // Hàm render màu sắc và icon cho Badge trạng thái
    const renderStatusBadge = (dbStatus) => {
        let label = 'Đang xử lý';
        let color = '#d97706'; // Amber (pending)
        let bgColor = '#fef3c7';
        let icon = <ClockCircleOutlined />;

        if (dbStatus === 'waiting_approval') { 
            label = 'Đang chờ duyệt'; 
            color = '#d97706'; bgColor = '#fef3c7'; icon = <ClockCircleOutlined />;
        } 
        else if (dbStatus === 'pending' || dbStatus === 'paid') { 
            label = 'Đang đóng gói'; 
            color = '#2563eb'; bgColor = '#dbeafe'; icon = <SyncOutlined spin />;
        } 
        else if (dbStatus === 'shipping') { 
            label = 'Đang giao hàng'; 
            color = '#4f46e5'; bgColor = '#e0e7ff'; icon = <CarOutlined />;
        } 
        else if (dbStatus === 'done') { 
            label = 'Đã giao thành công'; 
            color = '#059669'; bgColor = '#d1fae5'; icon = <CheckCircleOutlined />;
        } 
        else if (dbStatus === 'cancelled' || dbStatus === 'unsuccessful') { 
            label = 'Đã hủy'; 
            color = '#dc2626'; bgColor = '#fef2f2'; icon = <CloseCircleOutlined />;
        }

        return (
            <span style={{ 
                color: color, background: bgColor, border: `1px solid ${color}40`,
                padding: '6px 16px', borderRadius: '24px', 
                fontSize: '13px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              {icon} {label}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#8b949e' }}>Đang tải lịch sử đơn hàng...</div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div style={{ background: '#161e2e', padding: '60px 0', borderRadius: '16px', border: '1px solid #30363d', textAlign: 'center' }}>
                <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description={<span style={{ color: '#8b949e' }}>Bạn chưa có đơn hàng nào</span>}
                />
                <Button type="primary" style={{ background: '#2162ed', marginTop: '16px', border: 'none', height: '40px', borderRadius: '8px' }} onClick={() => navigate('/products')}>
                    Khám phá Sản phẩm ngay
                </Button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {orders.map((order) => (
                <Card 
                    key={order._id} 
                    bordered={false} 
                    style={{ background: '#0d1117', borderRadius: '16px', border: '1px solid #30363d' }}
                    bodyStyle={{ padding: 0 }}
                >
                    {/* ORDER HEADER */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', padding: '16px 24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                Mã đơn: #{order.orderCode}
                            </Text>
                            <Text style={{ color: '#8b949e', fontSize: '13px' }}>
                                Đặt ngày: {moment(order.createdAt).format('HH:mm - DD/MM/YYYY')}
                            </Text>
                        </div>
                        <div>
                            {renderStatusBadge(order.status)}
                        </div>
                    </div>

                    {/* ORDER ITEMS LIST */}
                    <div style={{ padding: '24px' }}>
                        {order.items.map((item, index) => (
                            <div key={item._id || index}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#161e2e', borderRadius: '12px', padding: '8px', border: '1px solid #30363d', flexShrink: 0 }}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <ShoppingOutlined style={{ fontSize: '32px', color: '#8b949e', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <Text strong style={{ color: '#e6edf3', fontSize: '15px' }}>{item.name}</Text>
                                        <Text style={{ color: '#8b949e', fontSize: '13px' }}>
                                            Phân loại: {item.color} - {item.storage}
                                        </Text>
                                        <Text style={{ color: '#8b949e', fontSize: '13px' }}>
                                            Số lượng: x{item.quantity}
                                        </Text>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text strong style={{ color: '#2162ed', fontSize: '16px' }}>
                                            {item.price?.toLocaleString('vi-VN')} đ
                                        </Text>
                                    </div>
                                </div>
                                {index < order.items.length - 1 && <Divider style={{ borderColor: '#30363d', margin: '16px 0' }} />}
                            </div>
                        ))}
                    </div>

                    {/* ORDER FOOTER / TOTAL */}
                    <div style={{ background: '#161e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderRadius: '0 0 16px 16px', borderTop: '1px solid #30363d' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Text style={{ color: '#8b949e', fontSize: '13px' }}>Thanh toán: <strong style={{color: '#fff'}}>{order.paymentMethod}</strong></Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <Text style={{ color: '#8b949e', fontSize: '14px' }}>Thành tiền:</Text>
                            <Text strong style={{ color: '#ff4d4f', fontSize: '20px' }}>
                                {order.total?.toLocaleString('vi-VN')} đ
                            </Text>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default UserOrders;
