import React, { useState, useEffect } from 'react';
import { Form, Input, Row, Col, Typography, Select, Card, Checkbox, Spin } from 'antd';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const ShippingStep = ({ form, onNext, selectedServices, setSelectedServices }) => {
    const [servicesData, setServicesData] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await api.get('/services');
                setServicesData(res.data.data || []);
            } catch (error) {
                console.error('Error fetching services:', error);
                setServicesData([
                    { _id: 's1', name: 'Gói quà cao cấp', price: 50000, description: 'Đóng gói sang trọng kèm thiệp viết tay' },
                    { _id: 's2', name: 'Bảo hành rơi vỡ 1 năm', price: 490000, description: 'Đổi mới ngay lập tức nếu rơi vỡ' }
                ]);
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, []);

    const toggleService = (service) => {
        const isExists = selectedServices.find(s => s._id === service._id);
        if (isExists) {
            setSelectedServices(selectedServices.filter(s => s._id !== service._id));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    return (
        <div style={{ background: '#161e2e', padding: '32px', borderRadius: '16px', border: '1px solid #30363d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>🚚 Thông tin giao hàng</Title>
                <Text style={{ color: '#2162ed', fontWeight: 'bold' }}>BƯỚC 1/3</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={onNext} requiredMark={false} className="dark-checkout-form">
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item name="lastName" label="Họ" rules={[{ required: true, message: 'Vui lòng nhập họ' }]}>
                            <Input placeholder="Nguyễn" size="large" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="firstName" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                            <Input placeholder="Văn A" size="large" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="email" label="Địa chỉ Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
                    <Input placeholder="nguyenvana@example.com" size="large" />
                </Form.Item>

                <Form.Item name="address" label="Địa chỉ chi tiết (Số nhà, Đường...)" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
                    <Input placeholder="123 Đường Điện Biên Phủ" size="large" />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item name="city" label="Tỉnh / Thành phố" rules={[{ required: true, message: 'Nhập Tỉnh/Thành' }]}>
                            <Input placeholder="Hồ Chí Minh" size="large" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="district" label="Quận / Huyện" rules={[{ required: true, message: 'Nhập Quận/Huyện' }]}>
                            <Input placeholder="Quận 1" size="large" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="ward" label="Phường / Xã" rules={[{ required: true, message: 'Nhập Phường/Xã' }]}>
                            <Input placeholder="Phường Đa Kao" size="large" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                    <Input placeholder="0901234567" size="large" />
                </Form.Item>
            </Form>

            {/* KHU VỰC CHỌN GÓI DỊCH VỤ */}
            <div style={{ marginTop: '32px' }}>
                <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>📦 Dịch vụ đính kèm (Tùy chọn)</Title>
                {loadingServices ? <Spin /> : (
                    <Row gutter={[16, 16]}>
                        {servicesData.map(service => {
                            const isSelected = selectedServices.some(s => s._id === service._id);
                            return (
                                <Col xs={24} md={12} key={service._id}>
                                    <Card hoverable onClick={() => toggleService(service)} style={{ background: isSelected ? 'rgba(33, 98, 237, 0.1)' : '#0d1117', borderColor: isSelected ? '#2162ed' : '#30363d', cursor: 'pointer' }} bodyStyle={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <Checkbox checked={isSelected} style={{ marginRight: '8px' }} />
                                                <Text strong style={{ color: isSelected ? '#2162ed' : '#e6edf3' }}>{service.name}</Text>
                                                <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '4px', paddingLeft: '24px' }}>{service.description}</div>
                                            </div>
                                            <Text strong style={{ color: '#fff' }}>{service.price.toLocaleString('vi-VN')} đ</Text>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
        </div>
    );
};

export default ShippingStep;