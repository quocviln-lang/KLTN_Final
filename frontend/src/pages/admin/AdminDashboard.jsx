import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, message, Spin, Space } from 'antd';
import { ArrowUpOutlined, DollarOutlined, ShoppingCartOutlined, UserOutlined, ShoppingOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const KPICard = ({ title, value, icon, trend, color }) => (
  <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '100%' }}>
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '12px', background: `${color}10`, color: color, borderRadius: '12px', fontSize: '20px' }}>
          {icon}
        </div>
        <Tag color="green" icon={<ArrowUpOutlined />} bordered={false} style={{ borderRadius: '6px', fontWeight: 'bold' }}>
          {trend}%
        </Tag>
      </div>
      <Statistic title={<Text type="secondary">{title}</Text>} value={value} valueStyle={{ fontWeight: '800', fontSize: '28px' }} />
    </Space>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          message.warning('Vui lòng đăng nhập với quyền Admin!');
          setLoading(false);
          return;
        }
        const res = await api.get('/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data.data);
      } catch (error) {
        console.error("API Error:", error);
        message.info('Sử dụng dữ liệu tạm thời (Vui lòng kiểm tra kết nối Backend).');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2}>Admin Dashboard</Title>
        <Text type="secondary">Tổng quan hiệu suất cửa hàng của bạn hôm nay.</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} xl={6}>
          <KPICard title="Tổng doanh thu" value={`$${stats.totalRevenue}`} icon={<DollarOutlined />} trend={12.5} color="#2162ed" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KPICard title="Tổng đơn hàng" value={stats.totalOrders} icon={<ShoppingCartOutlined />} trend={5.2} color="#3b82f6" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KPICard title="Khách hàng" value={stats.totalCustomers} icon={<UserOutlined />} trend={3.1} color="#6366f1" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KPICard title="Sản phẩm trong kho" value={stats.totalProducts} icon={<ShoppingOutlined />} trend={2.4} color="#f59e0b" />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Xu hướng doanh thu (Figma)" style={{ borderRadius: '16px', minHeight: '300px' }}>
             <Text type="secondary">Biểu đồ sẽ hiển thị tại đây khi có dữ liệu đơn hàng chính thức.</Text>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bổ đơn hàng" style={{ borderRadius: '16px', minHeight: '300px' }}>
             <Text type="secondary">Dữ liệu phân bổ theo tuần.</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;