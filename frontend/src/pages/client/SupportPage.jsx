import React, { useState } from 'react';
import { Row, Col, Typography, Collapse, Form, Input, Button, Card, message, Space } from 'antd';
import { 
    PhoneOutlined, 
    EnvironmentOutlined, 
    MailOutlined,
    SendOutlined,
    FacebookFilled,
    MessageFilled 
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const SupportPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Dữ liệu giả lập cho FAQ
    const faqData = [
        {
            key: '1',
            header: 'Thời gian giao hàng là bao lâu?',
            content: 'Đối với các quận nội thành, thời gian giao hàng từ 1-2 ngày. Các tỉnh khác từ 3-5 ngày làm việc. Quý khách có thể theo dõi tiến độ đơn hàng qua email xác nhận.'
        },
        {
            key: '2',
            header: 'Tôi có thể đổi trả sản phẩm không?',
            content: 'TECHNOVA áp dụng chính sách đổi trả miễn phí trong vòng 7 ngày đầu nếu sản phẩm có lỗi từ nhà sản xuất. Sản phẩm đổi trả phải còn nguyên hộp và phụ kiện đi kèm.'
        },
        {
            key: '3',
            header: 'Cửa hàng có hỗ trợ trả góp không?',
            content: 'Có, chúng tôi hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng hoặc các công ty tài chính đối tác với kỳ hạn linh hoạt 3, 6, 9 hoặc 12 tháng.'
        },
        {
            key: '4',
            header: 'Chính sách bảo hành như thế nào?',
            content: 'Tất cả sản phẩm điện thoại phân phối tại TECHNOVA đều được bảo hành chính hãng từ 12-24 tháng tùy thương hiệu. Ngoài ra, chúng tôi có thêm gói bảo hành vip rơi vỡ.'
        }
    ];

    const onFinishFeedback = async (values) => {
        setLoading(true);
        try {
            const res = await api.post('/feedbacks', values);
            if (res.data.success) {
                message.success('Cảm ơn bạn! Thông điệp đã được gửi thành công.');
                form.resetFields();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#101622', minHeight: '100vh', padding: '120px 24px 60px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <Title level={1} style={{ color: '#fff', fontSize: '36px', fontWeight: '900', marginBottom: '16px' }}>Hỗ Trợ Khách Hàng</Title>
                    <Text style={{ color: '#8b949e', fontSize: '18px', display: 'block', maxWidth: '600px', margin: '0 auto' }}>
                        Chúng tôi ở đây để lắng nghe và giải quyết mọi vấn đề của bạn.
                    </Text>
                </div>

                <Row gutter={[48, 48]}>
                    {/* Left Column: Contact Info & FAQ */}
                    <Col xs={24} md={12}>
                        
                        <div style={{ marginBottom: '40px' }}>
                            <Title level={3} style={{ color: '#e6edf3', marginBottom: '24px' }}>Thông Tin Liên Hệ</Title>
                            
                            <Space direction="vertical" size="large" style={{ width: '100%', color: '#8b949e', fontSize: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#161e2e', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px', color: '#2162ed' }}>
                                        <EnvironmentOutlined style={{ fontSize: '20px' }} />
                                    </div>
                                    <Text style={{ color: '#c9d1d9' }}>123 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM</Text>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#161e2e', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px', color: '#2162ed' }}>
                                        <PhoneOutlined style={{ fontSize: '20px' }} />
                                    </div>
                                    <Text style={{ color: '#c9d1d9' }}>1900 1000 - 0987 654 321</Text>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#161e2e', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px', color: '#2162ed' }}>
                                        <MailOutlined style={{ fontSize: '20px' }} />
                                    </div>
                                    <Text style={{ color: '#c9d1d9' }}>support@technova.com</Text>
                                </div>
                            </Space>

                            {/* Social Links Mocks */}
                            <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                    <Button type="primary" shape="round" icon={<FacebookFilled />} style={{ background: '#1877F2', borderColor: '#1877F2' }}>Facebook</Button>
                                </a>
                                <a href="https://zalo.me" target="_blank" rel="noopener noreferrer">
                                    <Button type="primary" shape="round" icon={<MessageFilled />} style={{ background: '#0068FF', borderColor: '#0068FF' }}>Zalo OA</Button>
                                </a>
                            </div>
                        </div>

                        {/* FAQ Group */}
                        <div>
                            <Title level={3} style={{ color: '#e6edf3', marginBottom: '24px' }}>Câu Hỏi Thường Gặp (FAQ)</Title>
                            <Collapse 
                                accordion 
                                style={{ background: 'transparent', border: 'none' }}
                                expandIconPosition="end"
                                className="custom-collapse"
                            >
                                {faqData.map(item => (
                                    <Panel 
                                        header={<Text style={{ color: '#c9d1d9', fontWeight: 'bold' }}>{item.header}</Text>} 
                                        key={item.key}
                                        style={{ background: '#161e2e', borderRadius: '8px', marginBottom: '16px', border: 'none' }}
                                    >
                                        <Paragraph style={{ color: '#8b949e', margin: 0 }}>
                                            {item.content}
                                        </Paragraph>
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>

                    </Col>

                    {/* Right Column: Contact Form */}
                    <Col xs={24} md={12}>
                        <Card 
                            style={{ 
                                background: '#161e2e', 
                                border: '1px solid #30363d', 
                                borderRadius: '16px',
                                padding: '16px'
                            }}
                        >
                            <Title level={3} style={{ color: '#e6edf3', marginBottom: '8px' }}>Gửi Tin Nhắn Cho Chúng Tôi</Title>
                            <Paragraph style={{ color: '#8b949e', marginBottom: '24px' }}>
                                Điền form bên dưới để yêu cầu hỗ trợ, khiếu nại hoặc góp ý.
                            </Paragraph>

                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinishFeedback}
                            >
                                <Form.Item
                                    name="name"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                    style={{ marginBottom: '20px' }}
                                >
                                    <Input 
                                        placeholder="Họ và Tên của bạn" 
                                        size="large" 
                                        style={{ background: '#101622', border: '1px solid #30363d', color: '#fff', borderRadius: '8px' }} 
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập Email' },
                                        { type: 'email', message: 'Email không hợp lệ' }
                                    ]}
                                    style={{ marginBottom: '20px' }}
                                >
                                    <Input 
                                        placeholder="Địa chỉ Email phản hồi" 
                                        size="large" 
                                        style={{ background: '#101622', border: '1px solid #30363d', color: '#fff', borderRadius: '8px' }} 
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="message"
                                    rules={[{ required: true, message: 'Vui lòng nhập nội dung muốn gửi' }]}
                                    style={{ marginBottom: '24px' }}
                                >
                                    <TextArea 
                                        placeholder="Nhập nội dung thắc mắc, phản hồi..." 
                                        rows={6}
                                        style={{ background: '#101622', border: '1px solid #30363d', color: '#fff', borderRadius: '8px', padding: '12px' }} 
                                    />
                                </Form.Item>

                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    size="large" 
                                    block 
                                    loading={loading}
                                    icon={<SendOutlined />}
                                    style={{ height: '48px', borderRadius: '8px', fontWeight: 'bold' }}
                                >
                                    GỬI YÊU CẦU NGAY
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </div>

            <style>{`
                .custom-collapse .ant-collapse-content {
                    background-color: transparent !important;
                    border-top: 1px solid #30363d !important;
                }
                .custom-collapse .ant-collapse-item-active .ant-collapse-header {
                    color: #2162ed !important;
                }
            `}</style>
        </div>
    );
};

export default SupportPage;
