import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Form, Input, Button, message, Avatar, Upload, Spin, Divider } from 'antd';
import {
    UserOutlined,
    HistoryOutlined,
    SafetyCertificateOutlined,
    LogoutOutlined,
    CameraOutlined,
    EditOutlined,
    LockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import UserOrders from '../../components/profile/UserOrders'; // <-- THÊM MỚI Ở ĐÂY

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const ProfilePage = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [pwdForm] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false); // Trạng thái: Chỉ xem hay Đang sửa

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const res = await api.get('/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const userData = res.data.data;
                setUser(userData);
                
                const defaultAddress = userData.addresses?.find(a => a.isDefault)?.detail || '';
                form.setFieldsValue({
                    name: userData.name,
                    phone: userData.phone || '',
                    email: userData.email,
                    shippingAddress: defaultAddress
                });
            } catch (error) {
                message.error('Không thể tải thông tin người dùng');
                if (error.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [form, navigate]);

    // 1. LƯU THÔNG TIN CÁ NHÂN
    const handleSaveProfile = async (values) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.put('/users/profile', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
            window.dispatchEvent(new Event('storage'));
            message.success('Cập nhật thông tin thành công!');
            setIsEditing(false); // Thành công thì quay về Read-Only
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
        } finally {
            setSaving(false);
        }
    };

    // 2. UPLOAD ẢNH ĐẠI DIỆN
    const customUpload = async ({ file, onSuccess, onError }) => {
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const token = localStorage.getItem('token');
            const uploadRes = await api.post('/upload', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            const newAvatarUrl = uploadRes.data.url;
            
            // Xong tiếp tục gọi API update profile để lưu URL avatar mới vào DB
            const updateRes = await api.put('/users/profile', { avatar: newAvatarUrl }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(updateRes.data.data);
            localStorage.setItem('user', JSON.stringify(updateRes.data.data));
            window.dispatchEvent(new Event('storage'));

            message.success('Đã tải lên ảnh đại diện thành công!');
            onSuccess("ok");
        } catch (error) {
            message.error('Lỗi khi tải ảnh lên');
            onError(error);
        } finally {
            setUploadingAvatar(false);
        }
    };

    // 3. ĐỔI MẬT KHẨU
    const handleChangePassword = async (values) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await api.put('/users/password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            message.success('Đổi mật khẩu thành công!');
            pwdForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        navigate('/');
        message.success('Đã đăng xuất thành công');
    };

    if (loading) {
        return <div style={{ height: 'calc(100vh - 80px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;
    }

    return (
        <Layout style={{ minHeight: 'calc(100vh - 80px)', background: '#101622', maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
            {/* Sidebar Cài đặt */}
            <Sider width={280} style={{ background: 'transparent' }}>
                <div style={{ padding: '0 20px 30px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: '#2162ed', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                        TN
                    </div>
                    <Title level={4} style={{ color: '#fff', margin: 0 }}>TechNova</Title>
                </div>

                <div style={{ padding: '0 20px 30px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Avatar size={48} src={user?.avatar} icon={<UserOutlined />} />
                    <div>
                        <Text strong style={{ color: '#fff', display: 'block', fontSize: '16px' }}>{user?.name}</Text>
                        <Text style={{ color: '#8b949e', fontSize: '13px' }}>Tech Enthusiast</Text>
                    </div>
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[activeTab]}
                    onClick={({ key }) => {
                        if (key === 'logout') handleLogout();
                        else {
                            setActiveTab(key);
                            setIsEditing(false); // Reset trạng thái edit khi chuyển tab
                        }
                    }}
                    style={{ background: 'transparent', borderRight: 'none', color: '#8b949e' }}
                    items={[
                        {
                            key: 'profile',
                            icon: <UserOutlined style={{ fontSize: '18px' }} />,
                            label: 'Thông tin cá nhân',
                            style: activeTab === 'profile' ? { background: '#2162ed', color: '#fff', borderRadius: '12px' } : { borderRadius: '12px' }
                        },
                        {
                            key: 'orders',
                            icon: <HistoryOutlined style={{ fontSize: '18px' }} />,
                            label: 'Lịch sử đơn hàng',
                            style: activeTab === 'orders' ? { background: '#2162ed', color: '#fff', borderRadius: '12px' } : { borderRadius: '12px' }
                        },
                        {
                            key: 'security',
                            icon: <SafetyCertificateOutlined style={{ fontSize: '18px' }} />,
                            label: 'Bảo mật',
                            style: activeTab === 'security' ? { background: '#2162ed', color: '#fff', borderRadius: '12px' } : { borderRadius: '12px' }
                        },
                        { type: 'divider', style: { borderColor: '#30363d', margin: '24px 0' } },
                        {
                            key: 'logout',
                            icon: <LogoutOutlined style={{ fontSize: '18px' }} />,
                            label: 'Đăng xuất',
                            style: { borderRadius: '12px' }
                        },
                    ]}
                />
            </Sider>

            {/* Nội dung chính */}
            <Content style={{ padding: '0 40px', background: 'transparent' }}>
                <div style={{ marginBottom: '32px' }}>
                    <Title level={2} style={{ color: '#fff', margin: '0 0 8px 0' }}>Cài đặt tài khoản</Title>
                    <Text style={{ color: '#8b949e', fontSize: '16px' }}>Quản lý thông tin cá nhân và tài khoản của bạn.</Text>
                </div>

                <div style={{ background: '#161e2e', borderRadius: '24px', border: '1px solid #30363d', padding: '40px' }}>
                    {/* Header Card Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #30363d' }}>
                        <div style={{ position: 'relative' }}>
                            <Spin spinning={uploadingAvatar}>
                                <Avatar size={100} src={user?.avatar} style={{ border: '4px solid #30363d' }} />
                                <Upload customRequest={customUpload} showUploadList={false} accept="image/*">
                                    <Button 
                                        type="primary" 
                                        shape="circle" 
                                        icon={<CameraOutlined />} 
                                        size="small"
                                        style={{ position: 'absolute', bottom: 0, right: 0, background: '#2162ed', border: 'none' }}
                                    />
                                </Upload>
                            </Spin>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Title level={3} style={{ color: '#fff', margin: '0 0 4px 0' }}>{user?.name}</Title>
                            <Text style={{ color: '#8b949e', display: 'block', marginBottom: '12px' }}>{user?.email}</Text>
                            <div style={{ background: 'rgba(33, 98, 237, 0.1)', color: '#2162ed', padding: '4px 12px', borderRadius: '16px', display: 'inline-block', fontSize: '13px', fontWeight: '500' }}>
                                Thành viên từ {new Date(user?.createdAt || Date.now()).getFullYear()}
                            </div>
                        </div>
                        
                        {/* Nút Edit hiển thị khi ở tab Profile và view mode */}
                        {activeTab === 'profile' && !isEditing && (
                            <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)} style={{ background: '#2162ed', borderRadius: '24px' }}>
                                Chỉnh sửa thông tin
                            </Button>
                        )}
                    </div>

                    {/* ================= TAB 1: THÔNG TIN CÁ NHÂN ================= */}
                    {activeTab === 'profile' && (
                        <div>
                            {!isEditing ? (
                                // CHẾ ĐỘ CHỈ XEM (READ-ONLY)
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', gap: '24px' }}>
                                        <div style={{ flex: 1, background: '#0d1117', padding: '16px 20px', borderRadius: '12px', border: '1px solid #30363d' }}>
                                            <Text style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>Họ và tên</Text>
                                            <Text style={{ color: '#e6edf3', fontSize: '16px', fontWeight: '500' }}>{user?.name}</Text>
                                        </div>
                                        <div style={{ flex: 1, background: '#0d1117', padding: '16px 20px', borderRadius: '12px', border: '1px solid #30363d' }}>
                                            <Text style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>Số điện thoại</Text>
                                            <Text style={{ color: '#e6edf3', fontSize: '16px', fontWeight: '500' }}>{user?.phone || 'Chưa cập nhật'}</Text>
                                        </div>
                                    </div>
                                    <div style={{ background: '#0d1117', padding: '16px 20px', borderRadius: '12px', border: '1px solid #30363d' }}>
                                        <Text style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>Địa chỉ Email</Text>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text style={{ color: '#e6edf3', fontSize: '16px', fontWeight: '500' }}>{user?.email}</Text>
                                            <Text style={{ color: '#52c41a', fontSize: '13px' }}>Đã xác minh</Text>
                                        </div>
                                    </div>
                                    <div style={{ background: '#0d1117', padding: '16px 20px', borderRadius: '12px', border: '1px solid #30363d' }}>
                                        <Text style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>Địa chỉ giao hàng mặc định</Text>
                                        <Text style={{ color: '#e6edf3', fontSize: '16px', fontWeight: '500' }}>
                                            {user?.addresses?.find(a => a.isDefault)?.detail || 'Chưa cập nhật'}
                                        </Text>
                                    </div>
                                </div>
                            ) : (
                                // CHẾ ĐỘ CHỈNH SỬA
                                <Form form={form} layout="vertical" onFinish={handleSaveProfile} requiredMark={false}>
                                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                                        <Form.Item name="name" label={<span style={{ color: '#e6edf3', fontWeight: '500' }}>Họ và tên</span>} style={{ flex: 1, margin: 0 }}>
                                            <Input size="large" style={{ background: '#0d1117', borderColor: '#30363d', color: '#fff', borderRadius: '12px', padding: '12px 16px' }} />
                                        </Form.Item>
                                        <Form.Item name="phone" label={<span style={{ color: '#e6edf3', fontWeight: '500' }}>Số điện thoại</span>} style={{ flex: 1, margin: 0 }}>
                                            <Input size="large" style={{ background: '#0d1117', borderColor: '#30363d', color: '#fff', borderRadius: '12px', padding: '12px 16px' }} />
                                        </Form.Item>
                                    </div>
                                    <Form.Item name="email" label={<span style={{ color: '#e6edf3', fontWeight: '500' }}>Địa chỉ Email</span>} style={{ marginBottom: '8px' }}>
                                        <Input size="large" disabled suffix={<span style={{ color: '#8b949e', fontSize: '12px' }}>Đã xác minh</span>} style={{ background: '#0d1117', borderColor: '#30363d', color: '#8b949e', borderRadius: '12px', padding: '12px 16px' }} />
                                    </Form.Item>
                                    <Text style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '24px' }}>Liên hệ hỗ trợ để thay đổi địa chỉ email của bạn.</Text>
                                    <Form.Item name="shippingAddress" label={<span style={{ color: '#e6edf3', fontWeight: '500' }}>Địa chỉ giao hàng</span>} style={{ marginBottom: '32px' }}>
                                        <Input.TextArea rows={4} size="large" placeholder="Nhập địa chỉ giao hàng của bạn (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)..." style={{ background: '#0d1117', borderColor: '#30363d', color: '#fff', borderRadius: '12px', padding: '16px' }} />
                                    </Form.Item>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #30363d', paddingTop: '32px' }}>
                                        <Button type="text" style={{ color: '#e6edf3', fontWeight: '500', height: '48px', padding: '0 24px' }} onClick={() => setIsEditing(false)}>
                                            Hủy Bỏ
                                        </Button>
                                        <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#2162ed', border: 'none', fontWeight: 'bold', height: '48px', padding: '0 32px', borderRadius: '24px' }}>
                                            Lưu Thay Đổi
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </div>
                    )}

                    {/* ================= TAB 2: LỊCH SỬ ĐƠN HÀNG ================= */}
                    {activeTab === 'orders' && (
                        <div>
                             <UserOrders />
                        </div>
                    )}

                    {/* ================= TAB 3: BẢO MẬT (ĐỔI MẬT KHẨU) ================= */}
                    {activeTab === 'security' && (
                        <div style={{ maxWidth: '600px' }}>
                            <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}><LockOutlined /> Đổi Mật Khẩu</Title>
                            <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword} requiredMark={false}>
                                <Form.Item 
                                    name="currentPassword" 
                                    label={<span style={{ color: '#e6edf3' }}>Mật khẩu hiện tại</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                                >
                                    <Input.Password size="large" style={{ background: '#0d1117', borderColor: '#30363d', color: '#fff', borderRadius: '12px', padding: '12px 16px' }} />
                                </Form.Item>
                                <Form.Item 
                                    name="newPassword" 
                                    label={<span style={{ color: '#e6edf3' }}>Mật khẩu mới</span>}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                                    ]}
                                >
                                    <Input.Password size="large" style={{ background: '#0d1117', borderColor: '#30363d', color: '#fff', borderRadius: '12px', padding: '12px 16px' }} />
                                </Form.Item>
                                <Form.Item 
                                    name="confirmPassword" 
                                    label={<span style={{ color: '#e6edf3' }}>Xác nhận mật khẩu mới</span>}
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password size="large" style={{ background: '#0d1117', borderColor: '#30363d', color: '#fff', borderRadius: '12px', padding: '12px 16px' }} />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#2162ed', border: 'none', fontWeight: 'bold', height: '48px', padding: '0 32px', borderRadius: '24px', marginTop: '16px' }}>
                                    Cập nhật mật khẩu
                                </Button>
                            </Form>
                        </div>
                    )}
                </div>
            </Content>
        </Layout>
    );
};

export default ProfilePage;
