import React, { useState, useEffect } from 'react';
import { 
    Table, Button, Space, Modal, Form, Input, 
    Select, message, Popconfirm, Tag, Switch 
} from 'antd';
import { 
    PlusOutlined, EditOutlined, DeleteOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
// Thư viện soạn thảo văn bản
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const { Option } = Select;

const AdminArticles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [form] = Form.useForm();
    
    // Pagination state
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchArticles = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/articles?page=${page}&limit=${pagination.pageSize}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setArticles(res.data.data);
                setPagination({
                    ...pagination,
                    current: res.data.pagination.page,
                    total: res.data.pagination.total
                });
            }
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTableChange = (newPagination) => {
        fetchArticles(newPagination.current);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.delete(`/articles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                message.success('Xóa bài viết thành công');
                fetchArticles(pagination.current);
            }
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi xóa bài viết');
        }
    };

    const openModal = (article = null) => {
        setEditingArticle(article);
        if (article) {
            form.setFieldsValue({
                ...article
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ 
                category: 'Tin tức chung',
                isPublished: true,
                thumbnail: 'https://via.placeholder.com/800x450?text=No+Cover'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (values) => {
        try {
            const token = localStorage.getItem('token');
            let res;
            if (editingArticle) {
                res = await api.put(`/articles/${editingArticle._id}`, values, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                res = await api.post('/articles', values, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (res.data.success) {
                message.success(editingArticle ? 'Cập nhật thành công' : 'Thêm mới thành công');
                setIsModalOpen(false);
                fetchArticles(pagination.current);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu bài viết');
        }
    };

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            width: '30%',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            render: (category) => {
                let color = 'blue';
                if (category === 'Khuyến mãi') color = 'magenta';
                if (category === 'Công nghệ') color = 'cyan';
                return <Tag color={color}>{category}</Tag>;
            }
        },
        {
            title: 'Lượt xem',
            dataIndex: 'views',
            key: 'views',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isPublished',
            key: 'isPublished',
            render: (isPublished) => (
                <Tag color={isPublished ? 'success' : 'default'}>
                    {isPublished ? 'Hiển thị' : 'Đang ẩn'}
                </Tag>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={() => openModal(record)} 
                        size="small"
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa bài viết này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // Cấu hình Toolbar cho Trình soạn thảo ReactQuill
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2>Quản lý Bài viết / Tin tức</h2>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => openModal()}
                >
                    Thêm bài viết mới
                </Button>
            </div>

            <Table 
                columns={columns} 
                dataSource={articles} 
                rowKey="_id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={editingArticle ? "Cập nhật bài viết" : "Thêm bài viết mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
                style={{ top: 20 }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                >
                    <Form.Item
                        name="title"
                        label="Tiêu đề bài viết"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Nhập tiêu đề..." size="large"/>
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="category"
                            label="Danh mục"
                            style={{ flex: 1 }}
                            rules={[{ required: true }]}
                        >
                            <Select>
                                <Option value="Tin tức chung">Tin tức chung</Option>
                                <Option value="Khuyến mãi">Khuyến mãi & Sự kiện</Option>
                                <Option value="Công nghệ">Giải pháp Công nghệ</Option>
                                <Option value="Đánh giá">Đánh giá sản phẩm</Option>
                                <Option value="Mẹo vặt">Mẹo vặt - Hướng dẫn</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="isPublished"
                            label="Hiển thị cho khách"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="thumbnail"
                        label="Link Ảnh Bìa (Thumbnail URL)"
                        rules={[{ required: true, message: 'Vui lòng cung cấp link ảnh' }]}
                    >
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Nội dung bài viết"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                    >
                        <ReactQuill 
                            theme="snow" 
                            modules={quillModules}
                            style={{ height: '300px', marginBottom: '40px' }}
                            placeholder="Bắt đầu viết nội dung ở đây..."
                        />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right' }}>
                        <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
                        <Button type="primary" htmlType="submit">
                            {editingArticle ? 'Cập nhật' : 'Đăng bài'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminArticles;
