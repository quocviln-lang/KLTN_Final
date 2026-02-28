import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Typography, Modal, 
  Form, Input, InputNumber, Select, message, Popconfirm, Switch 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SafetyCertificateOutlined, CarOutlined, ToolOutlined 
} from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();

  // 1. LẤY DANH SÁCH DỊCH VỤ
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services');
      setServices(res.data.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // 2. MỞ MODAL (THÊM/SỬA)
  const showModal = (service = null) => {
    setEditingService(service);
    if (service) {
      form.setFieldsValue(service);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 3. XỬ LÝ LƯU DỮ LIỆU
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingService) {
        await api.put(`/services/${editingService._id}`, values, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        message.success('Cập nhật dịch vụ thành công');
      } else {
        await api.post('/services', values, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        message.success('Thêm dịch vụ mới thành công');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      message.error('Thao tác thất bại');
    }
  };

  // 4. XỬ LÝ XÓA
  const handleDelete = async (id) => {
    try {
      await api.delete(`/services/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Đã xóa dịch vụ');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      message.error('Xóa thất bại');
    }
  };

  const columns = [
    {
      title: 'TÊN DỊCH VỤ',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'LOẠI',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'blue';
        let icon = <ToolOutlined />;
        if (type === 'warranty') { color = 'gold'; icon = <SafetyCertificateOutlined />; }
        if (type === 'shipping') { color = 'green'; icon = <CarOutlined />; }
        return <Tag icon={icon} color={color}>{type.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'GIÁ',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{price.toLocaleString()} đ</span>,
    },
    {
      title: 'MÔ TẢ',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => <Tag color={active ? 'cyan' : 'red'}>{active ? 'ĐANG BẬT' : 'ĐÃ TẮT'}</Tag>
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Popconfirm title="Xóa dịch vụ này?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Title level={2}>Quản lý Dịch vụ & Phí</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Thêm dịch vụ
        </Button>
      </div>

      <Table columns={columns} dataSource={services} rowKey="_id" loading={loading} />

      <Modal
        title={editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true, type: 'warranty' }}>
          <Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
            <Input placeholder="Ví dụ: Bảo hành 1 đổi 1 trong 12 tháng" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="type" label="Loại dịch vụ" style={{ flex: 1 }}>
              <Select options={[
                { value: 'warranty', label: 'Bảo hành' },
                { value: 'shipping', label: 'Vận chuyển' },
                { value: 'other', label: 'Khác' },
              ]} />
            </Form.Item>
            <Form.Item name="price" label="Giá (đ)" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả chi tiết quyền lợi của khách hàng..." />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const { TextArea } = Input;
export default AdminServices;