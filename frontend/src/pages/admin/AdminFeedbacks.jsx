import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Popconfirm, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');
const { Text, Paragraph } = Typography;

const AdminFeedbacks = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingFeedback, setViewingFeedback] = useState(null);
    
    // Pagination state
    const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

    const fetchFeedbacks = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/feedbacks?page=${page}&limit=${pagination.pageSize}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setFeedbacks(res.data.data);
                setPagination({
                    ...pagination,
                    current: res.data.pagination.page,
                    total: res.data.pagination.total
                });
            }
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi tải danh sách phản hồi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTableChange = (newPagination) => {
        fetchFeedbacks(newPagination.current);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.delete(`/feedbacks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                message.success('Xóa phản hồi thành công');
                fetchFeedbacks(pagination.current);
            }
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi xóa phản hồi');
        }
    };

    const openViewModal = (record) => {
        setViewingFeedback(record);
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'Tên khách hàng',
            dataIndex: 'name',
            key: 'name',
            width: '20%',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: '25%',
        },
        {
            title: 'Nội dung',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true, 
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '15%',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: '15%',
            render: (_, record) => (
                <Space>
                    <Button 
                        type="primary" 
                        icon={<EyeOutlined />} 
                        onClick={() => openViewModal(record)} 
                        size="small"
                        style={{ background: '#5b8c00', borderColor: '#5b8c00' }}
                    >
                        Xem
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa thư này?"
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

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2>Hộp thư Phản hồi / Hỗ trợ</h2>
            </div>

            <Table 
                columns={columns} 
                dataSource={feedbacks} 
                rowKey="_id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={<span><EyeOutlined /> Chi tiết Phản hồi</span>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>,
                    <Button key="reply" type="primary" onClick={() => window.open(`mailto:${viewingFeedback?.email}`)}>
                        Phản hồi qua Email
                    </Button>
                ]}
                width={600}
            >
                {viewingFeedback && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <Text type="secondary">Từ: </Text>
                            <Text strong style={{ fontSize: '16px' }}>{viewingFeedback.name}</Text>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <Text type="secondary">Email: </Text>
                            <a href={`mailto:${viewingFeedback.email}`}>{viewingFeedback.email}</a>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <Text type="secondary">Thời gian: </Text>
                            <Text>{moment(viewingFeedback.createdAt).format('LLLL')}</Text>
                        </div>
                        <div style={{ 
                            background: '#f5f5f5', 
                            padding: '16px', 
                            borderRadius: '8px',
                            minHeight: '100px'
                        }}>
                            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                {viewingFeedback.message}
                            </Paragraph>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminFeedbacks;
