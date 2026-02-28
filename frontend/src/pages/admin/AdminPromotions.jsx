import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Typography, Modal, 
  Form, Input, InputNumber, Select, message, Popconfirm, DatePicker, Switch, Row, Col, Tabs 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  PercentageOutlined, ThunderboltOutlined, TagOutlined, CalendarOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [activeTab, setActiveTab] = useState('voucher'); // Mặc định là Voucher
  const [form] = Form.useForm();

  // 1. LẤY DỮ LIỆU
  const fetchData = async () => {
    setLoading(true);
    try {
      const [promoRes, prodRes] = await Promise.all([
        api.get('/promotions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        api.get('/products')
      ]);
      setPromotions(promoRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. MỞ MODAL THEO LOẠI
  const showModal = (type, promo = null) => {
    setActiveTab(type);
    setEditingPromo(promo);
    if (promo) {
      form.setFieldsValue({
        ...promo,
        rangeDate: [dayjs(promo.startDate), dayjs(promo.endDate)]
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ type: type, isActive: true });
    }
    setIsModalOpen(true);
  };

  // 3. XỬ LÝ LƯU
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        type: activeTab, // Ép kiểu theo Tab đang đứng
        startDate: values.rangeDate[0].toISOString(),
        endDate: values.rangeDate[1].toISOString(),
      };

      if (editingPromo) {
        await api.put(`/promotions/${editingPromo._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        message.success('Cập nhật khuyến mãi thành công');
      } else {
        await api.post('/promotions', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        message.success('Tạo chương trình mới thành công');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving promotion:', error);
      message.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/promotions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Đã xóa chương trình');
      fetchData();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      message.error('Xóa thất bại');
    }
  };

  // 4. RENDER FORM DỰA TRÊN LOẠI KHUYẾN MÃI
  const renderDynamicFields = () => {
    switch (activeTab) {
      case 'voucher':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="code" label="Mã khuyến mãi (Code)" rules={[{ required: true, message: 'Nhập mã giảm giá!' }]}>
                  <Input placeholder="Ví dụ: TECHNOVA10" style={{ textTransform: 'uppercase' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="usageLimit" label="Số lượt sử dụng" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="minOrderValue" label="Giá trị đơn hàng tối thiểu (đ)">
              <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </>
        );
      case 'discount':
        return (
          <Form.Item name="products" label="Sản phẩm được giảm giá" rules={[{ required: true, message: 'Chọn ít nhất 1 sản phẩm!' }]}>
            <Select mode="multiple" placeholder="Chọn các sản phẩm muốn giảm giá..." showSearch optionFilterProp="children">
              {products.map(p => <Select.Option key={p._id} value={p._id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
        );
      case 'flashsale':
        return (
          <Form.Item name="products" label="Sản phẩm Flash Sale duy nhất" rules={[{ required: true, message: 'Phải chọn 1 sản phẩm!' }]}>
            <Select 
              placeholder="Chọn 1 sản phẩm duy nhất để đưa ra Home..." 
              showSearch 
              optionFilterProp="children"
              // Chế độ đơn (không dùng mode="multiple") để thực thi ý định của bạn
            >
              {products.map(p => <Select.Option key={p._id} value={p._id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      title: 'TÊN CHƯƠNG TRÌNH',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong>{text}</Text>
          {record.code && <Text type="secondary" style={{ fontSize: '12px' }}>Mã: {record.code}</Text>}
        </div>
      )
    },
    {
      title: 'GIẢM GIÁ',
      key: 'discount',
      render: (_, record) => (
        <Tag color="red" style={{ fontWeight: 'bold' }}>
          {record.discountPercent > 0 ? `${record.discountPercent}%` : `${record.discountedPrice?.toLocaleString()}đ`}
        </Tag>
      )
    },
    {
      title: 'THỜI HẠN',
      key: 'dates',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <CalendarOutlined />
          <span>{dayjs(record.startDate).format('DD/MM')} - {dayjs(record.endDate).format('DD/MM/YYYY')}</span>
        </div>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record.type, record)} />
          <Popconfirm title="Xóa chương trình này?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    { key: 'voucher', label: <Space><TagOutlined /> Mã giảm giá</Space>, children: <Table columns={columns} dataSource={promotions.filter(p => p.type === 'voucher')} rowKey="_id" loading={loading} /> },
    { key: 'discount', label: <Space><PercentageOutlined /> Giảm giá sản phẩm</Space>, children: <Table columns={columns} dataSource={promotions.filter(p => p.type === 'discount')} rowKey="_id" loading={loading} /> },
    { key: 'flashsale', label: <Space><ThunderboltOutlined /> Flash Sale Home</Space>, children: <Table columns={columns} dataSource={promotions.filter(p => p.type === 'flashsale')} rowKey="_id" loading={loading} /> },
  ];

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>Trung tâm Khuyến mãi</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal(activeTab)}
          size="large"
        >
          Tạo {activeTab === 'voucher' ? 'Mã' : activeTab === 'discount' ? 'Giảm giá' : 'Flash Sale'} mới
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems} 
        type="card"
      />

      <Modal
        title={
          <Space>
            {activeTab === 'flashsale' ? <ThunderboltOutlined style={{ color: '#faad14' }} /> : <PercentageOutlined style={{ color: '#2162ed' }} />}
            <span>{editingPromo ? 'Chỉnh sửa' : 'Tạo mới'} {activeTab.toUpperCase()}</span>
          </Space>
        }
        open={isModalOpen} 
        onOk={handleOk} 
        onCancel={() => setIsModalOpen(false)} 
        width={650}
        okText="Lưu chương trình"
        cancelText="Hủy bỏ"
      >
        <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
          <Form.Item name="title" label="Tên chiến dịch Marketing" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
            <Input placeholder="Ví dụ: Lễ hội iPhone - Giảm giá sốc" />
          </Form.Item>

          {renderDynamicFields()}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="discountPercent" label="Giảm theo %">
                <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountedPrice" label="Hoặc Giảm số tiền thẳng">
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="đ" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="rangeDate" label="Thời gian diễn ra chương trình" rules={[{ required: true }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label="Ghi chú chương trình">
            <TextArea rows={2} placeholder="Thông tin chi tiết cho Admin..." />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPromotions;