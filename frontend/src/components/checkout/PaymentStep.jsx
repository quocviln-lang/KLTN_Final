import React, { useState } from 'react';
import { Radio, Space, Typography, Input, Row, Col, Form } from 'antd';
import { CreditCardOutlined, BankOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PaymentStep = ({ paymentMethod, setPaymentMethod }) => {
    // Tạm thời dùng state nội bộ để quản lý việc hiển thị Form thẻ tín dụng
    const [selectedMethod, setSelectedMethod] = useState(paymentMethod || 'credit_card');

    const handleChange = (e) => {
        setSelectedMethod(e.target.value);
        setPaymentMethod(e.target.value);
    };

    return (
        <div style={{ background: '#161e2e', padding: '32px', borderRadius: '16px', border: '1px solid #30363d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>💳 Payment Method</Title>
                <Text style={{ color: '#2162ed', fontWeight: 'bold' }}>STEP 2/3</Text>
            </div>

            <style>
                {`
                    .payment-radio-group { width: 100%; }
                    .payment-radio-wrapper {
                        display: flex;
                        align-items: center;
                        padding: 16px;
                        border: 1px solid #30363d;
                        border-radius: 12px;
                        margin-bottom: 16px;
                        background: #0d1117;
                        transition: all 0.3s;
                    }
                    .payment-radio-wrapper.active { border-color: #2162ed; background: rgba(33, 98, 237, 0.05); }
                    .payment-radio-group .ant-radio { margin-top: 2px; align-self: flex-start; }
                    .payment-radio-group .ant-radio-inner { background-color: transparent; border-color: #4a5568; }
                    .payment-radio-group .ant-radio-checked .ant-radio-inner { border-color: #2162ed; }
                    .payment-radio-group .ant-radio-checked .ant-radio-inner::after { background-color: #2162ed; }
                    .payment-content { margin-left: 12px; flex: 1; }
                    .payment-title { color: #fff; font-weight: bold; font-size: 16px; display: block; }
                    .payment-desc { color: #8b949e; font-size: 13px; }
                `}
            </style>

            <Radio.Group onChange={handleChange} value={selectedMethod} className="payment-radio-group">
                {/* 1. CREDIT CARD */}
                <div className={`payment-radio-wrapper ${selectedMethod === 'credit_card' ? 'active' : ''}`}>
                    <Radio value="credit_card">
                        <div className="payment-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="payment-title">Credit or Debit Card</span>
                                <Space>
                                    <div style={{ background: '#fff', padding: '2px 4px', borderRadius: '4px' }}><Text strong style={{ color: '#1a1f36', fontSize: '10px' }}>VISA</Text></div>
                                    <div style={{ background: '#ff5f00', padding: '2px 4px', borderRadius: '4px' }}><Text strong style={{ color: '#fff', fontSize: '10px' }}>MC</Text></div>
                                </Space>
                            </div>
                            <span className="payment-desc">Secure encrypted transaction</span>
                            
                            {/* KHUNG NHẬP THẺ (DUMMY UI) */}
                            {selectedMethod === 'credit_card' && (
                                <div style={{ marginTop: '20px' }}>
                                    <Form layout="vertical" className="dark-checkout-form">
                                        <Form.Item label="Name on Card">
                                            <Input placeholder="Alex Chen" size="large" />
                                        </Form.Item>
                                        <Form.Item label="Card Number">
                                            <Input placeholder="0000 0000 0000 0000" size="large" prefix={<CreditCardOutlined style={{ color: '#8b949e' }} />} />
                                        </Form.Item>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item label="Expiry Date">
                                                    <Input placeholder="MM/YY" size="large" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item label="CVV">
                                                    <Input placeholder="123" size="large" type="password" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Form>
                                </div>
                            )}
                        </div>
                    </Radio>
                </div>

                {/* 2. BANK TRANSFER */}
                <div className={`payment-radio-wrapper ${selectedMethod === 'bank_transfer' ? 'active' : ''}`}>
                    <Radio value="bank_transfer">
                        <div className="payment-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="payment-title">Bank Transfer</span>
                                <BankOutlined style={{ fontSize: '20px', color: '#8b949e' }} />
                            </div>
                            <span className="payment-desc">Direct wire to our corporate account</span>
                        </div>
                    </Radio>
                </div>

                {/* 3. CASH ON DELIVERY (COD) */}
                <div className={`payment-radio-wrapper ${selectedMethod === 'cod' ? 'active' : ''}`}>
                    <Radio value="cod">
                        <div className="payment-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="payment-title">Cash on Delivery</span>
                                <DollarOutlined style={{ fontSize: '20px', color: '#8b949e' }} />
                            </div>
                            <span className="payment-desc">Pay when you receive your order</span>
                        </div>
                    </Radio>
                </div>
            </Radio.Group>
        </div>
    );
};

export default PaymentStep;