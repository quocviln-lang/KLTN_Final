import React, { useState } from 'react';
import { Layout, Menu, Button, Input, Badge, Avatar, Space } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  DashboardOutlined, 
  ShoppingOutlined, 
  LogoutOutlined, 
  SearchOutlined, 
  BellOutlined, 
  MessageOutlined, 
  SafetyOutlined,
  GiftOutlined,
  UserOutlined,
  FileTextOutlined,
  MailOutlined
} from '@ant-design/icons';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Khai báo các mục trong Menu Admin
  const menuItems = [
    { 
      key: '/admin', 
      icon: <DashboardOutlined />, 
      label: <Link to="/admin">Dashboard</Link> 
    },
    { 
      key: '/admin/products', 
      icon: <ShoppingOutlined />, 
      label: <Link to="/admin/products">Products</Link> 
    },
    { 
      key: '/admin/reviews', 
      icon: <MessageOutlined />, 
      label: <Link to="/admin/reviews">Reviews</Link> 
    },
    { 
      key: '/admin/services', 
      icon: <SafetyOutlined />, 
      label: <Link to="/admin/services">Services</Link> 
    }, 
    { 
      key: '/admin/promotions', 
      icon: <GiftOutlined />, 
      label: <Link to="/admin/promotions">Promotions</Link> 
    },
    { 
      key: '/admin/orders', 
      icon: <FileTextOutlined />, 
      label: <Link to="/admin/orders">Orders</Link> 
    },
    { 
      key: '/admin/users', 
      icon: <UserOutlined />, 
      label: <Link to="/admin/users">Users</Link> 
    },
    { 
      key: '/admin/feedbacks', 
      icon: <MailOutlined />, 
      label: <Link to="/admin/feedbacks">Hộp thư Phản hồi</Link> 
    },
    { 
      key: '/admin/news', 
      icon: <FileTextOutlined />, 
      label: <Link to="/admin/news">Tin tức</Link> 
    },
    { 
      key: 'logout', 
      icon: <LogoutOutlined />, 
      label: 'Logout', 
      danger: true, 
      onClick: () => { 
        localStorage.removeItem('token'); 
        localStorage.removeItem('user');
        navigate('/login'); 
      } 
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#101622' }}>
        <div style={{ padding: '24px', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
          {collapsed ? '⚡' : '⚡ TECHNOVA'}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={menuItems} 
          style={{ background: 'transparent' }} 
        />
      </Sider>
      <Layout style={{ background: '#f8fafc' }}>
        <Header style={{ background: 'white', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Space size="middle">
            <Input prefix={<SearchOutlined />} placeholder="Search..." style={{ width: 250, borderRadius: '10px', background: '#f1f5f9', border: 'none' }} />
            <Badge dot><Button type="text" icon={<BellOutlined />} /></Badge>
            <Avatar src="https://i.pravatar.cc/150?u=admin" />
          </Space>
        </Header>
        <Content style={{ padding: '32px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;