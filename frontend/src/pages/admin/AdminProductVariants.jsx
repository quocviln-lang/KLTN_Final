import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Table, Button, Input, Select, Space, Tag, Avatar, 
  Typography, Form, InputNumber, message, Card, Row, Col, Upload, Popconfirm, Breadcrumb
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, LoadingOutlined, ArrowLeftOutlined 
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const AdminProductVariants = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  
  // Biến loading đã được kích hoạt để dùng cho Table
  const [loading, setLoading] = useState(false);
  
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [variantImageUrl, setVariantImageUrl] = useState('');

  // Đưa hàm fetch vào trong useEffect để triệt tiêu Warning Dependency
  useEffect(() => { 
    const fetchProductDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products');
        const foundProduct = res.data.data.find(p => p._id === id);
        setProduct(foundProduct);
      } catch (error) {
        console.error(error);
        message.error('Không tải được thông tin sản phẩm!');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail(); 
  }, [id]);

  const customUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVariantImageUrl(res.data.url);
      onSuccess("Ok");
      message.success("Tải ảnh biến thể thành công!");
    } catch (err) {
      onError({ err });
    } finally {
      setUploading(false);
    }
  };

  const handleAddVariant = async (values) => {
    try {
      const newVariant = { ...values, image: variantImageUrl };
      const updatedVariants = [...(product.variants || []), newVariant];
      
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const res = await api.put(`/products/${id}`, { variants: updatedVariants }, config);
      
      message.success('Đã thêm cấu hình mới!');
      setProduct(res.data.data);
      form.resetFields();
      setVariantImageUrl(''); 
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi lưu!');
    }
  };

  const handleDeleteVariant = async (indexToRemove) => {
    try {
      const updatedVariants = product.variants.filter((_, index) => index !== indexToRemove);
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const res = await api.put(`/products/${id}`, { variants: updatedVariants }, config);
      message.success('Đã xóa cấu hình!');
      setProduct(res.data.data);
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi xóa!');
    }
  };

  if (!product) return <div style={{ padding: 100, textAlign: 'center' }}><LoadingOutlined style={{ fontSize: 24 }} /> Đang tải dữ liệu...</div>;

  const isPhone = (product.type?.toLowerCase() || 'phones') === 'phones';
  const labelColor = isPhone ? "Màu sắc" : "Màu sắc / Kiểu dáng";
  const labelStorage = isPhone ? "Dung lượng (RAM/ROM)" : "Kích cỡ / Độ dài / Chi tiết";

  const columns = [
    { title: 'Ảnh', dataIndex: 'image', key: 'image', render: (img) => <Avatar src={img} shape="square" size={40} /> },
    { title: labelColor, dataIndex: 'color', key: 'color', render: (text) => <Tag color="blue">{text || 'N/A'}</Tag> },
    { title: labelStorage, dataIndex: 'storage', key: 'storage', render: (text) => <b>{text || 'N/A'}</b> },
    { title: 'Giá Nhập', dataIndex: 'importPrice', key: 'importPrice', render: (price) => <Text type="danger">{price?.toLocaleString()} đ</Text> },
    { title: 'Giá Bán', dataIndex: 'price', key: 'price', render: (price) => <Text type="success">{price?.toLocaleString()} đ</Text> },
    { title: 'Tồn Kho', dataIndex: 'quantity', key: 'quantity', render: (qty) => <Tag color={qty > 0 ? 'green' : 'red'}>{qty} cái</Tag> },
    { 
      title: 'Hành động', 
      key: 'action', 
      render: (_, __, index) => (
        <Popconfirm title="Xóa phiên bản này?" onConfirm={() => handleDeleteVariant(index)}>
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ) 
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Breadcrumb style={{ marginBottom: '16px' }} items={[
        { title: <a onClick={() => navigate('/admin/products')}>Kho hàng</a> },
        { title: 'Quản lý phiên bản' },
      ]} />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/products')} />
        <Title level={3} style={{ margin: 0 }}>Cấu hình chi tiết: {product.name}</Title>
        <Tag color={isPhone ? 'blue' : 'orange'}>{product.type || 'Chưa phân loại'}</Tag>
      </div>

      <Card title={`Thêm cấu hình mới cho ${isPhone ? 'Điện thoại' : 'Phụ kiện'}`} bordered={false} style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Form form={form} layout="vertical" onFinish={handleAddVariant}>
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item label="Ảnh phiên bản này">
                <Upload name="image" listType="picture-card" showUploadList={false} customRequest={customUpload}>
                  {variantImageUrl ? <img src={variantImageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div>{uploading ? <LoadingOutlined /> : <PlusOutlined />}<div>Upload</div></div>}
                </Upload>
              </Form.Item>
            </Col>
            
            <Col span={20}>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="color" label={labelColor}><Input placeholder={isPhone ? "VD: Đỏ, Titan" : "VD: Trắng, Nhám"} /></Form.Item></Col>
                <Col span={8}><Form.Item name="storage" label={labelStorage}><Input placeholder={isPhone ? "VD: 256GB, 8GB-128GB" : "VD: 2 mét, Size L"} /></Form.Item></Col>
                <Col span={8}><Form.Item name="quantity" label="Số lượng nhập kho" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="importPrice" label="Giá Nhập (Bảo mật - VNĐ)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                <Col span={8}><Form.Item name="price" label="Giá Bán (VNĐ)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                <Col span={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Form.Item style={{ width: '100%' }}>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block size="large">Lưu cấu hình</Button>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table 
        dataSource={product.variants || []} 
        columns={columns} 
        rowKey={(record, index) => index}
        loading={loading} // Bảng đã được tích hợp loading xoay xoay
        style={{ background: 'white', borderRadius: '12px' }}
      />
    </div>
  );
};

export default AdminProductVariants;