import React, { useState } from 'react';
import { Row, Col, Tabs, Form, Input, Button, Checkbox, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const AuthPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinishLogin = async (values) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', values);
            const { token, user } = response.data.data;

            message.success('Đăng nhập thành công!');
            
            // Lưu token và thông tin user (bao gồm cả role)
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // LOGIC PHÂN QUYỀN: Kiểm tra role để chuyển hướng
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Đăng nhập thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const onFinishRegister = async (values) => {
        setLoading(true);
        try {
            await api.post('/auth/register', values);
            message.success('Đăng ký thành công! Vui lòng đăng nhập.');
        } catch (error) {
            message.error(error.response?.data?.message || 'Đăng ký thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const loginForm = (
        <Form layout="vertical" onFinish={onFinishLogin} size="large">
            <Form.Item label={<span style={{ color: '#8b949e' }}>Email</span>} name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}>
                <Input prefix={<MailOutlined style={{ color: '#8b949e' }} />} placeholder="name@example.com" style={{ backgroundColor: '#232f48', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white' }} />
            </Form.Item>

            <Form.Item label={<span style={{ color: '#8b949e' }}>Mật khẩu</span>} name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#8b949e' }} />} placeholder="Nhập mật khẩu" style={{ backgroundColor: '#232f48', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white' }} />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Checkbox style={{ color: '#8b949e' }}>Ghi nhớ thiết bị</Checkbox>
                <a style={{ color: '#2162ed' }}>Quên mật khẩu?</a>
            </div>

            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '50px', borderRadius: '12px', background: 'linear-gradient(to right, #2162ed, #1a4dc6)', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 0 20px rgba(33, 98, 237, 0.4)' }}>
                Đăng Nhập <ArrowRightOutlined />
            </Button>
        </Form>
    );

    const registerForm = (
        <Form layout="vertical" onFinish={onFinishRegister} size="large">
            <Form.Item label={<span style={{ color: '#8b949e' }}>Họ và tên</span>} name="name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                <Input prefix={<UserOutlined style={{ color: '#8b949e' }} />} placeholder="Nguyễn Văn A" style={{ backgroundColor: '#232f48', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white' }} />
            </Form.Item>

            <Form.Item label={<span style={{ color: '#8b949e' }}>Email</span>} name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!', type: 'email' }]}>
                <Input prefix={<MailOutlined style={{ color: '#8b949e' }} />} placeholder="name@example.com" style={{ backgroundColor: '#232f48', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white' }} />
            </Form.Item>

            <Form.Item label={<span style={{ color: '#8b949e' }}>Số điện thoại</span>} name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
                <Input prefix={<PhoneOutlined style={{ color: '#8b949e' }} />} placeholder="0987654321" style={{ backgroundColor: '#232f48', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white' }} />
            </Form.Item>

            <Form.Item label={<span style={{ color: '#8b949e' }}>Mật khẩu</span>} name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#8b949e' }} />} placeholder="Tạo mật khẩu" style={{ backgroundColor: '#232f48', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white' }} />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '50px', borderRadius: '12px', background: 'linear-gradient(to right, #2162ed, #1a4dc6)', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                Tạo Tài Khoản
            </Button>
        </Form>
    );

    const tabItems = [
        { key: '1', label: 'Đăng nhập', children: loginForm },
        { key: '2', label: 'Đăng ký', children: registerForm },
    ];

    return (
        <Row style={{ minHeight: '100vh', backgroundColor: '#101622' }}>
            <Col xs={0} md={10} lg={10} style={{ 
                background: 'radial-gradient(circle at 10% 20%, rgba(33, 97, 237, 0.15) 0%, rgba(16, 22, 34, 0) 40%)', 
                padding: '60px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center' 
            }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '40px', cursor: 'pointer' }}>
                        <span style={{ color: '#2162ed' }}>⚡</span> TechNova
                    </div>
                </Link>
                <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#fff', lineHeight: '1.2' }}>
                    Bước Vào <br /> <span style={{ color: '#2162ed' }}>Tương Lai</span>
                </h1>
                <p style={{ color: '#8b949e', fontSize: '1.1rem', marginTop: '20px', maxWidth: '400px' }}>
                    Đăng nhập để quản lý đơn hàng, lưu sản phẩm yêu thích và nhận thông báo sớm nhất về các đợt mở bán iPhone, Samsung mới.
                </p>
            </Col>

            <Col xs={24} md={14} lg={14} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: '480px', 
                    background: 'rgba(22, 30, 46, 0.7)', 
                    backdropFilter: 'blur(16px)', 
                    WebkitBackdropFilter: 'blur(16px)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '20px', 
                    padding: '40px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 10
                }}>
                    <Tabs defaultActiveKey="1" items={tabItems} centered tabBarStyle={{ color: '#8b949e' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', margin: '30px 0' }}>
                        <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
                        <span style={{ padding: '0 15px', color: '#8b949e', fontSize: '12px', textTransform: 'uppercase' }}>Hoặc tiếp tục với</span>
                        <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
                    </div>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Button block style={{ height: '48px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>Google</Button>
                        </Col>
                        <Col span={12}>
                            <Button block style={{ height: '48px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>GitHub</Button>
                        </Col>
                    </Row>
                </div>
            </Col>
        </Row>
    );
};

export default AuthPage;