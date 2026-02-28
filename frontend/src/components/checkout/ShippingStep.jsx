import React, { useState, useEffect } from 'react';
import { Form, Input, Row, Col, Typography, Select, Card, Checkbox, Spin, Button, message } from 'antd';
import { EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const ShippingStep = ({ form, onNext, selectedServices, setSelectedServices }) => {
    const [servicesData, setServicesData] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    
    // States for Address Dropdowns
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    
    const [selectedProvinceStr, setSelectedProvinceStr] = useState('');
    const [selectedDistrictStr, setSelectedDistrictStr] = useState('');

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

    // 1. Fetch Provinces API
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await fetch('https://provinces.open-api.vn/api/?depth=3');
                const data = await res.json();
                setProvinces(data);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu tỉnh thành:", error);
                message.error("Không thể tải hệ thống địa chỉ.");
            }
        };
        fetchProvinces();
    }, []);

    // Handle Province Change
    const handleProvinceChange = (value) => {
        setSelectedProvinceStr(value);
        form.setFieldsValue({ district: undefined, ward: undefined }); // Xóa lựa chọn cũ
        setDistricts([]);
        setWards([]);
        const province = provinces.find(p => p.name === value);
        if (province) setDistricts(province.districts);
    };

    // Handle District Change
    const handleDistrictChange = (value) => {
        setSelectedDistrictStr(value);
        form.setFieldsValue({ ward: undefined });
        setWards([]);
        const district = districts.find(d => d.name === value);
        if (district) setWards(district.wards);
    };

    const toggleService = (service) => {
        const isExists = selectedServices.find(s => s._id === service._id);
        if (isExists) {
            setSelectedServices(selectedServices.filter(s => s._id !== service._id));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    // 2. Chức năng Auto-fill từ Profile
    const handleAutoFillProfile = () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) {
                message.warning("Vui lòng đăng nhập để sử dụng tính năng này");
                return;
            }

            // Cố gắng tách Họ và Tên từ FullName
            const parts = userData.name ? userData.name.split(' ') : [];
            const lastName = parts.length > 1 ? parts[0] : '';
            const firstName = parts.length > 1 ? parts.slice(1).join(' ') : userData.name;

            // Xử lý địa chỉ lưu trong máy (Lấy cái đầu tiên nếu có)
            let savedAddress = '';
            if (userData.addresses && userData.addresses.length > 0) {
                const addObj = userData.addresses[0];
                savedAddress = `${addObj.detail ? addObj.detail + ', ' : ''}${addObj.ward ? addObj.ward + ', ' : ''}${addObj.district ? addObj.district + ', ' : ''}${addObj.province || ''}`;
            }

            form.setFieldsValue({
                lastName: lastName,
                firstName: firstName,
                email: userData.email,
                phone: userData.phone || '',
                address: savedAddress // Điền vào ô Chú thích địa chỉ
            });
            message.success('Đã tự động điền thông tin từ hồ sơ!');
        } catch (error) {
             console.error('Lỗi trích xuất hồ sơ:', error);
             message.error('Không thể trích xuất hồ sơ.');
        }
    };

    return (
        <div style={{ background: '#161e2e', padding: '32px', borderRadius: '16px', border: '1px solid #30363d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>🚚 Thông tin giao hàng</Title>
                <Text style={{ color: '#2162ed', fontWeight: 'bold' }}>BƯỚC 1/3</Text>
            </div>

            {/* FILL PROFILE BUTTON */}
            <div style={{ marginBottom: '24px' }}>
                <Button 
                    type="dashed" 
                    icon={<UserOutlined />} 
                    onClick={handleAutoFillProfile}
                    style={{ background: 'rgba(33, 98, 237, 0.1)', color: '#2162ed', borderColor: '#2162ed', width: '100%' }}
                >
                    Sử dụng thông tin tài khoản đang đăng nhập
                </Button>
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

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item name="email" label="Địa chỉ Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
                            <Input placeholder="nguyenvana@example.com" size="large" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                            <Input placeholder="0901234567" size="large" />
                        </Form.Item>
                    </Col>
                </Row>

                {/* HỆ THỐNG SELECT TỈNH THÀNH */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#0d1117', border: '1px solid #30363d', marginBottom: '24px' }}>
                     <div style={{ color: '#8b949e', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EnvironmentOutlined /> Nơi nhận hàng
                     </div>
                     <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="city" label="Tỉnh / Thành phố" rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành' }]}>
                                <Select 
                                    size="large" 
                                    placeholder="Chọn Tỉnh/Thành" 
                                    showSearch
                                    onChange={handleProvinceChange}
                                >
                                    {provinces.map(p => (
                                        <Option key={p.code} value={p.name}>{p.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="district" label="Quận / Huyện" rules={[{ required: true, message: 'Vui lòng chọn Quận/Huyện' }]}>
                                <Select 
                                    size="large" 
                                    placeholder="Chọn Quận/Huyện" 
                                    showSearch
                                    disabled={!selectedProvinceStr}
                                    onChange={handleDistrictChange}
                                >
                                     {districts.map(d => (
                                        <Option key={d.code} value={d.name}>{d.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="ward" label="Phường / Xã" rules={[{ required: true, message: 'Vui lòng chọn Phường/Xã' }]}>
                                <Select 
                                    size="large" 
                                    placeholder="Chọn Phường/Xã" 
                                    showSearch
                                    disabled={!selectedDistrictStr}
                                >
                                     {wards.map(w => (
                                        <Option key={w.code} value={w.name}>{w.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <Form.Item name="address" label="Địa chỉ chi tiết / Chú thích" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết' }]}>
                    <Input.TextArea placeholder="Nhập số nhà, tên đường, tòa nhà hoặc ghi chú từ địa chỉ đã lưu..." rows={3} size="large" />
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