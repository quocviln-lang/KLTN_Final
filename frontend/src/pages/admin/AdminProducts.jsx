import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Input, Select, Space, Tag, Avatar, 
  Typography, Modal, Form, InputNumber, message, Row, Col, Divider, Upload, Tabs
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  RocketOutlined, SettingOutlined, MinusCircleOutlined, ControlOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // NÂNG CẤP: Quản lý danh sách nhiều ảnh thay vì 1 ảnh
  const [fileList, setFileList] = useState([]); 
  
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
      setFilteredProducts(res.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Lỗi khi tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleTabChange = (key) => {
    if (key === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.type?.toLowerCase() === key.toLowerCase()));
    }
  };

  // NÂNG CẤP: Hàm Upload hỗ trợ nhiều ảnh
  const customUpload = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Trả về url để Ant Design cập nhật vào fileList
      onSuccess({ url: res.data.url }); 
      message.success("Tải ảnh thành công!");
    } catch (err) {
      onError({ err });
      message.error("Tải ảnh thất bại!");
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleSaveProduct = async (values) => {
    try {
      // 1. Trích xuất URL từ danh sách ảnh đã tải lên
      values.images = fileList.map(file => file.url || (file.response && file.response.url)).filter(Boolean);
      
      // 2. Lọc bỏ các dòng Highlight rỗng
      if (values.highlights) {
        values.highlights = values.highlights.filter(h => h && h.trim() !== '');
      }

      if (!values.specs) values.specs = [];

      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, values, config);
        message.success('Cập nhật thành công!');
      } else {
        await api.post('/products', values, config);
        message.success('Thêm sản phẩm mới thành công!');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      message.success('Đã xóa sản phẩm!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Xóa thất bại!');
    }
  };

  // Mở Modal Thêm mới
  const openAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setFileList([]);
    setIsModalOpen(true);
  };

  // Mở Modal Sửa (Load lại toàn bộ data cũ)
  const openEditModal = (record) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    
    // Chuyển mảng string url thành định dạng fileList của Ant Design
    if (record.images && record.images.length > 0) {
        setFileList(record.images.map((url, index) => ({
            uid: `-preview-${index}`,
            name: `image-${index}.png`,
            status: 'done',
            url: url
        })));
    } else {
        setFileList([]);
    }
    
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'SẢN PHẨM',
      key: 'product',
      render: (_, record) => (
        <Space size="middle">
          <Avatar src={record.images?.[0] || 'https://via.placeholder.com/50'} shape="square" size={48} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '11px' }}>{record.slug}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'PHÂN LOẠI',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const t = type?.toLowerCase();
        let color = 'default';
        let text = type || 'Chưa phân loại';
        if (t === 'phones') { color = 'blue'; text = 'Điện thoại'; }
        else if (t === 'audio') { color = 'purple'; text = 'Tai nghe'; }
        else if (t === 'chargers') { color = 'orange'; text = 'Sạc & Cáp'; }
        else if (t === 'cases') { color = 'green'; text = 'Ốp lưng'; }
        else if (t === 'others') { color = 'default'; text = 'Khác'; }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'GIÁ SÀN',
      dataIndex: 'basePrice',
      key: 'price',
      render: (price) => <span style={{ fontWeight: 'bold' }}>{price?.toLocaleString()} đ</span>
    },
    {
      title: 'TỔNG KHO',
      key: 'stock',
      render: (_, record) => {
        const totalStock = record.variants?.reduce((sum, v) => sum + (v.quantity || 0), 0);
        return <Tag color={totalStock > 0 ? 'blue' : 'red'}>{totalStock} máy</Tag>;
      }
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<SettingOutlined />} type="primary" ghost onClick={() => navigate(`/admin/products/${record._id}/variants`)}>
            Cấu hình ({record.variants?.length || 0})
          </Button>
          <Button icon={<EditOutlined />} type="text" onClick={() => openEditModal(record)} />
          <Button icon={<DeleteOutlined />} type="text" danger onClick={() => Modal.confirm({ title: 'Xác nhận xóa', content: 'Xóa sản phẩm này sẽ xóa toàn bộ biến thể của nó!', onOk: () => handleDeleteProduct(record._id) })} />
        </Space>
      )
    }
  ];

  const tabItems = [
    { key: 'all', label: 'Tất cả' },
    { key: 'phones', label: '📱 Điện thoại' },
    { key: 'audio', label: '🎧 Tai nghe' },
    { key: 'chargers', label: '🔋 Sạc & Cáp' },
    { key: 'cases', label: '🛡️ Ốp lưng' },
    { key: 'others', label: '📦 Khác' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={2}>Quản lý kho hàng chính</Title>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openAddModal}>
          Thêm sản phẩm mới
        </Button>
      </div>

      <Tabs defaultActiveKey="all" items={tabItems} onChange={handleTabChange} style={{ marginBottom: 16 }} />

      <Table columns={columns} dataSource={filteredProducts} rowKey="_id" loading={loading} style={{ background: 'white', borderRadius: '12px' }} />

      <Modal 
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onOk={() => form.submit()} 
        width={900} 
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveProduct} style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px' }}>
          
          <Divider orientation="left">Thông tin cơ bản</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={6}>
              <Form.Item name="type" label="Phân loại">
                <Select placeholder="Chọn loại">
                  <Select.Option value="Phones">Điện thoại</Select.Option>
                  <Select.Option value="Audio">Tai nghe</Select.Option>
                  <Select.Option value="Chargers">Sạc & Cáp</Select.Option>
                  <Select.Option value="Cases">Ốp lưng</Select.Option>
                  <Select.Option value="Others">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}><Form.Item name="basePrice" label="Giá hiển thị thấp nhất" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}><Form.Item name="brand" label="Thương hiệu"><Input /></Form.Item></Col>
            <Col span={12}>
                <Form.Item label="Bộ sưu tập ảnh (Upload nhiều ảnh)">
                  <Upload 
                    listType="picture-card" 
                    fileList={fileList} 
                    customRequest={customUpload}
                    onChange={handleUploadChange}
                    multiple={true} // Cho phép chọn nhiều file cùng lúc
                  >
                    {fileList.length >= 6 ? null : <div><PlusOutlined /><div>Tải ảnh</div></div>}
                  </Upload>
                </Form.Item>
            </Col>
          </Row>

          {/* NÂNG CẤP: KHU VỰC NỘI DUNG (Highlights & Mô tả) */}
          <Divider orientation="left"><FileTextOutlined /> Nội dung hiển thị</Divider>
          <Row gutter={16}>
              <Col span={10}>
                  <Form.Item label="3 Ưu điểm nổi bật (Highlights)">
                      <Form.Item name={['highlights', 0]} noStyle><Input placeholder="1. VD: Chip A17 Pro siêu mạnh mẽ" style={{ marginBottom: 8 }} /></Form.Item>
                      <Form.Item name={['highlights', 1]} noStyle><Input placeholder="2. VD: Khung Titan chuẩn hàng không" style={{ marginBottom: 8 }} /></Form.Item>
                      <Form.Item name={['highlights', 2]} noStyle><Input placeholder="3. VD: Camera zoom quang học 5x" /></Form.Item>
                  </Form.Item>
              </Col>
              <Col span={14}>
                  <Form.Item name="description" label="Bài viết mô tả chi tiết">
                      <Input.TextArea rows={5} placeholder="Nhập bài viết giới thiệu chi tiết về sản phẩm này..." />
                  </Form.Item>
              </Col>
          </Row>
          
          <Divider orientation="left"><ControlOutlined /> Thông số kỹ thuật (Tùy biến)</Divider>
          <Form.List name="specs">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key} style={{ marginBottom: 8 }} align="baseline">
                    <Col span={10}>
                      <Form.Item {...restField} name={[name, 'key']} rules={[{ required: true, message: 'Nhập tên thông số' }]}>
                        <Input placeholder="Tên (Ví dụ: RAM, Chất liệu)" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item {...restField} name={[name, 'value']} rules={[{ required: true, message: 'Nhập giá trị' }]}>
                        <Input placeholder="Giá trị (Ví dụ: 8GB, Nhựa dẻo)" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: '18px', marginTop: '10px' }} />
                    </Col>
                  </Row>
                ))}
                <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm dòng thông số</Button></Form.Item>
              </>
            )}
          </Form.List>

          <Divider orientation="left"><RocketOutlined /> Module AI Gợi ý</Divider>
          <Form.Item name="tags" label="Tags AI"><Select mode="tags" style={{ width: '100%' }} placeholder="gaming, camera, op-lung-iphone" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProducts;