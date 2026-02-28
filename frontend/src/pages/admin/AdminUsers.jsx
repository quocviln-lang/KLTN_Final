import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Input, Select, Space, Typography, 
  Avatar, Drawer, Form, message, Row, Col, Switch 
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, EditOutlined, 
  UserOutlined, DeleteOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filter States
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Drawer States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Lấy dữ liệu từ API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/users/admin/list', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          role: roleFilter,
          status: statusFilter
        }
      });
      
      const { docs, totalDocs } = response.data.data;
      setUsers(docs);
      setTotal(totalDocs);
    } catch (error) {
      console.error('Lỗi lấy danh sách users:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, roleFilter, statusFilter]);

  useEffect(() => {
     const delayDebounceFn = setTimeout(() => {
       fetchUsers();
     }, 500);
     return () => clearTimeout(delayDebounceFn);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Mở Drawer thêm mới
  const showAddDrawer = () => {
    setIsEditing(false);
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ role: 'user', isActive: true });
    setDrawerVisible(true);
  };

  // Mở Drawer sửa
  const showEditDrawer = (record) => {
    setIsEditing(true);
    setEditingId(record._id);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      isActive: record.isActive
    });
    setDrawerVisible(true);
  };

  // Lưu dữ liệu (Thêm hoặc Sửa)
  const handleSave = async (values) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      if (isEditing) {
        await api.put(`/users/admin/${editingId}`, values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Cập nhật tài khoản thành công!');
      } else {
        await api.post('/users/admin/create', values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Thêm tài khoản thành công!');
      }
      
      setDrawerVisible(false);
      fetchUsers(); // Tải lại danh sách
    } catch (error) {
      console.error('Lỗi lưu user:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  // ================ CẤU HÌNH CỘT CHO TABLE ================
  const columns = [
    {
      title: 'USER',
      key: 'user',
      render: (_, record) => (
        <Space size="middle">
          <Avatar src={record.avatar} icon={!record.avatar && <UserOutlined />} />
          <Text strong style={{ color: '#111827' }}>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <Text style={{ color: '#6b7280' }}>{text}</Text>,
    },
    {
      title: 'ROLE',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = '';
        let bgColor = '';
        let label = role;
        
        if (role === 'admin') {
          color = '#8b5cf6'; bgColor = '#f5f3ff'; label = 'Admin';
        } else if (role === 'staff' || role === 'editor') {
          color = '#3b82f6'; bgColor = '#eff6ff'; label = 'Staff';
        } else {
          color = '#6b7280'; bgColor = '#f3f4f6'; label = 'Customer';
        }

        return (
          <span style={{ 
            color: color, background: bgColor, 
            padding: '4px 10px', borderRadius: '16px', 
            fontSize: '13px', fontWeight: '500',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <UserOutlined style={{ fontSize: '11px' }} /> {label}
          </span>
        );
      }
    },
    {
      title: 'STATUS',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive) => {
        const color = isActive ? '#10b981' : '#f59e0b';
        const bgColor = isActive ? '#ecfdf5' : '#fffbeb';
        const text = isActive ? 'Active' : 'Suspended';
        
        return (
          <span style={{ 
            color: color, background: bgColor, 
            padding: '4px 10px', borderRadius: '16px', 
            fontSize: '13px', fontWeight: '500',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
            {text}
          </span>
        );
      }
    },
    {
      title: 'JOIN DATE',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <Text style={{ color: '#6b7280' }}>{moment(date).format('MMM DD, YYYY')}</Text>,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EditOutlined style={{ color: '#6b7280' }} />} 
          onClick={() => showEditDrawer(record)}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111827' }}>Manage Users</Title>
          <Text style={{ color: '#6b7280', fontSize: '15px' }}>View and manage customer accounts</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={showAddDrawer}
          style={{ background: '#2563eb', borderRadius: '8px', fontWeight: '500' }}
        >
          Add New User
        </Button>
      </div>

      {/* Filter Section */}
      <div style={{ background: '#fff', padding: '16px 24px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
        <Input 
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} 
          placeholder="Search users by name or email..." 
          style={{ width: '350px', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e5e7eb' }}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Space size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ color: '#4b5563' }}>Role:</Text>
            <Select defaultValue="All" style={{ width: 120 }} onChange={setRoleFilter} bordered={false} className="custom-select">
              <Option value="All">All</Option>
              <Option value="admin">Admin</Option>
              <Option value="staff">Staff</Option>
              <Option value="user">Customer</Option>
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ color: '#4b5563' }}>Status:</Text>
            <Select defaultValue="All" style={{ width: 120 }} onChange={setStatusFilter} bordered={false} className="custom-select">
              <Option value="All">All</Option>
              <Option value="Active">Active</Option>
              <Option value="Suspended">Suspended</Option>
            </Select>
          </div>
        </Space>
      </div>

      {/* Table Section */}
      <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', padding: '0 24px 24px 24px' }}>
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} results`,
            showSizeChanger: true
          }}
          onChange={handleTableChange}
        />
      </div>

      {/* THÔNG QUA DRAWER ĐỂ CHỈNH SỬA / THÊM MỚI */}
      <Drawer
        title={<span style={{ fontWeight: 'bold' }}>{isEditing ? 'Edit User' : 'Add New User'}</span>}
        width={450}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleSave} requiredMark={false}>
          <Form.Item name="name" label={<span style={{ fontWeight: '500' }}>Full Name</span>} rules={[{ required: true, message: 'Please enter a name' }]}>
            <Input size="large" style={{ borderRadius: '8px' }} />
          </Form.Item>
          
          <Form.Item name="email" label={<span style={{ fontWeight: '500' }}>Email Address</span>} rules={[{ required: true, message: 'Please enter an email' }]}>
            <Input size="large" style={{ borderRadius: '8px' }} disabled={isEditing} /> 
            {/* Không cho sửa email nếu edit */}
          </Form.Item>

          {!isEditing && (
            <Form.Item name="password" label={<span style={{ fontWeight: '500' }}>Password</span>} rules={[{ required: true, message: 'Please enter a password' }]}>
              <Input.Password size="large" style={{ borderRadius: '8px' }} />
            </Form.Item>
          )}

          <Form.Item name="phone" label={<span style={{ fontWeight: '500' }}>Phone Number</span>}>
            <Input size="large" style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label={<span style={{ fontWeight: '500' }}>User Role</span>}>
                <Select size="large">
                  <Option value="user">Customer</Option>
                  <Option value="staff">Staff/Editor</Option>
                  <Option value="admin">Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label={<span style={{ fontWeight: '500' }}>Account Status</span>} valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Suspended" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ position: 'absolute', right: 0, bottom: 0, width: '100%', borderTop: '1px solid #e9e9e9', padding: '16px 24px', background: '#fff', textAlign: 'right', borderRadius: '0 0 8px 8px' }}>
            <Space>
              <Button onClick={() => setDrawerVisible(false)} style={{ borderRadius: '8px' }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#2563eb', borderRadius: '8px' }}>
                {isEditing ? 'Save Changes' : 'Create User'}
              </Button>
            </Space>
          </div>
        </Form>
      </Drawer>

      <style>{`
        .ant-table-thead > tr > th { background: #fff; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f3f4f6; }
        .ant-table-tbody > tr > td { border-bottom: 1px solid #f3f4f6; }
        .custom-select .ant-select-selector { padding: 0 !important; font-weight: 500; color: #111827; }
        .ant-pagination-total-text { margin-right: auto !important; color: #6b7280; }
        .ant-pagination { display: flex; width: 100%; border-top: 1px solid #f3f4f6; padding-top: 16px; margin-top: 0 !important; }
      `}</style>
    </div>
  );
};

export default AdminUsers;
