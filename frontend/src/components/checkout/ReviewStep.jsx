import React from 'react';
import { Typography, Row, Col, Divider, Button } from 'antd';
import { EnvironmentOutlined, CreditCardOutlined, CarOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

const ReviewStep = ({ shippingDetails, paymentMethod, onEditStep }) => {
    
    // Giả lập tính toán ngày giao hàng (Cộng thêm 3 ngày từ hiện tại)
    const estimatedDeliveryStart = moment().add(3, 'days').format('dddd, MMM Do');
    const estimatedDeliveryEnd = moment().add(5, 'days').format('dddd, MMM Do');

    const getPaymentName = () => {
        if (paymentMethod === 'credit_card') return 'Credit / Debit Card';
        if (paymentMethod === 'bank_transfer') return 'Bank Transfer';
        return 'Cash on Delivery (COD)';
    };

    return (
        <div style={{ background: '#161e2e', padding: '32px', borderRadius: '16px', border: '1px solid #30363d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>📋 Review Order</Title>
                <Text style={{ color: '#2162ed', fontWeight: 'bold' }}>STEP 3/3</Text>
            </div>

            {/* BLOCK 1: SHIPPING DETAILS */}
            <div style={{ background: '#0d1117', padding: '24px', borderRadius: '12px', border: '1px solid #30363d', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Text strong style={{ color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Shipping Details</Text>
                    <Button type="link" onClick={() => onEditStep(0)} style={{ color: '#2162ed', padding: 0 }}>EDIT</Button>
                </div>
                
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Contact</Text>
                        <Text strong style={{ color: '#fff', display: 'block' }}>{shippingDetails.firstName} {shippingDetails.lastName}</Text>
                        <Text style={{ color: '#e6edf3', display: 'block' }}>{shippingDetails.email}</Text>
                        <Text style={{ color: '#e6edf3', display: 'block' }}>{shippingDetails.phone}</Text>
                    </Col>
                    <Col xs={24} md={12}>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Shipping Address</Text>
                        <Text strong style={{ color: '#fff', display: 'block' }}>{shippingDetails.address}</Text>
                        <Text style={{ color: '#e6edf3', display: 'block' }}>{shippingDetails.city}, {shippingDetails.zipCode}</Text>
                        <Text style={{ color: '#e6edf3', display: 'block' }}>{shippingDetails.country}</Text>
                    </Col>
                </Row>
            </div>

            {/* BLOCK 2: PAYMENT METHOD */}
            <div style={{ background: '#0d1117', padding: '24px', borderRadius: '12px', border: '1px solid #30363d', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Text strong style={{ color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Method</Text>
                    <Button type="link" onClick={() => onEditStep(1)} style={{ color: '#2162ed', padding: 0 }}>EDIT</Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#161e2e', padding: '12px', borderRadius: '8px', border: '1px solid #30363d' }}>
                        <CreditCardOutlined style={{ fontSize: '24px', color: '#e6edf3' }} />
                    </div>
                    <div>
                        <Text strong style={{ color: '#fff', display: 'block', fontSize: '16px' }}>{getPaymentName()}</Text>
                        {paymentMethod === 'credit_card' && <Text style={{ color: '#8b949e' }}>Pending validation securely</Text>}
                    </div>
                </div>
            </div>

            {/* BLOCK 3: ESTIMATED DELIVERY */}
            <div style={{ background: 'rgba(33, 98, 237, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(33, 98, 237, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <CarOutlined style={{ fontSize: '20px', color: '#2162ed' }} />
                    <Text strong style={{ color: '#fff', fontSize: '16px' }}>Estimated Delivery</Text>
                </div>
                <div style={{ marginLeft: '32px' }}>
                    <Text style={{ color: '#e6edf3', display: 'block', fontSize: '15px', marginBottom: '4px' }}>
                        {estimatedDeliveryStart} - {estimatedDeliveryEnd}
                    </Text>
                    <Text style={{ color: '#2162ed', fontWeight: 'bold' }}>Standard Shipping Applied</Text>
                </div>
            </div>
        </div>
    );
};

export default ReviewStep;