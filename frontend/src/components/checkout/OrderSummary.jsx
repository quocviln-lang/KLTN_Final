import React, { useState } from 'react';
import { Typography, Input, Button, Space, Divider, message, Badge } from 'antd';
import { TagOutlined, LockOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Text, Title } = Typography;

const OrderSummary = ({ cartItems, subtotal, shippingFee, discount, setDiscount }) => {
    const [promoCode, setPromoCode] = useState('');
    const [loadingPromo, setLoadingPromo] = useState(false);

    const tax = subtotal * 0.08; // Giả sử thuế VAT 8%
    const totalDue = subtotal + shippingFee + tax - (discount?.discountAmount || 0);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return message.warning('Vui lòng nhập mã giảm giá');
        setLoadingPromo(true);
        try {
            const res = await api.post('/promotions/check-coupon', {
                code: promoCode,
                orderTotal: subtotal
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            
            setDiscount(res.data.data);
            message.success('Áp dụng mã thành công!');
        } catch (error) {
            message.error(error.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn');
            setDiscount(null);
        } finally {
            setLoadingPromo(false);
        }
    };

    return (
        <div style={{ background: '#161e2e', padding: '32px', borderRadius: '16px', border: '1px solid #30363d' }}>
            <Title level={4} style={{ color: '#fff', margin: '0 0 24px 0' }}>Tóm tắt đơn hàng</Title>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px', marginBottom: '24px' }}>
                {cartItems.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <Badge count={item.quantity} color="#2162ed">
                            <div style={{ width: '64px', height: '64px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <img src={item.image || 'https://via.placeholder.com/64'} alt={item.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                            </div>
                        </Badge>
                        <div style={{ flex: 1 }}>
                            <Text strong style={{ color: '#e6edf3', display: 'block' }}>{item.name}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{item.storage ? `${item.storage} / ` : ''}{item.color}</Text>
                        </div>
                        <Text strong style={{ color: '#fff' }}>{(item.price * item.quantity).toLocaleString('vi-VN')} đ</Text>
                    </div>
                ))}
            </div>

            <Divider style={{ borderColor: '#30363d', margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Text style={{ color: '#8b949e' }}>Tạm tính</Text>
                <Text style={{ color: '#e6edf3' }}>{subtotal.toLocaleString('vi-VN')} đ</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Text style={{ color: '#8b949e' }}>Phí giao hàng</Text>
                <Text style={{ color: shippingFee > 0 ? '#e6edf3' : '#52c41a' }}>
                    {shippingFee > 0 ? `${shippingFee.toLocaleString('vi-VN')} đ` : 'Tính ở bước sau'}
                </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Text style={{ color: '#8b949e' }}>Thuế VAT (8%)</Text>
                <Text style={{ color: '#e6edf3' }}>{tax.toLocaleString('vi-VN')} đ</Text>
            </div>
            
            {discount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <Text style={{ color: '#52c41a' }}>Giảm giá ({discount.code})</Text>
                    <Text style={{ color: '#52c41a' }}>-{discount.discountAmount.toLocaleString('vi-VN')} đ</Text>
                </div>
            )}

            <Divider style={{ borderColor: '#30363d', margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>Tổng thanh toán</Text>
                <div style={{ textAlign: 'right' }}>
                    <Text style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>{Math.max(0, totalDue).toLocaleString('vi-VN')} đ</Text>
                    <div style={{ color: '#8b949e', fontSize: '12px' }}>VNĐ</div>
                </div>
            </div>

            <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
                <Input 
                    placeholder="Mã giảm giá..." 
                    prefix={<TagOutlined style={{ color: '#8b949e' }} />} 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    style={{ background: '#0d1117', borderColor: '#30363d', color: '#fff' }} 
                />
                <Button type="primary" onClick={handleApplyPromo} loading={loadingPromo} style={{ background: '#2162ed', border: 'none', fontWeight: 'bold' }}>
                    ÁP DỤNG
                </Button>
            </Space.Compact>

            <div style={{ textAlign: 'center' }}>
                <Text style={{ color: '#8b949e', fontSize: '12px' }}><LockOutlined /> Giao dịch được mã hóa SSL an toàn</Text>
            </div>
        </div>
    );
};

export default OrderSummary;