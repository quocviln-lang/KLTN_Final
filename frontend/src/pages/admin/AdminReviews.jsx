import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Avatar, Typography, 
  Modal, Input, message, Rate, Popconfirm 
} from 'antd';
import { 
  MessageOutlined, DeleteOutlined, CheckCircleOutlined, 
  SyncOutlined, UserOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State cho Modal Phản hồi
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. LẤY TOÀN BỘ DANH SÁCH ĐÁNH GIÁ (Toàn hệ thống)
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/admin/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReviews(res.data.data || []);
    } catch (error) {
      console.log(error);
      message.error('Lỗi khi tải danh sách đánh giá!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // 2. XỬ LÝ GỬI PHẢN HỒI (Admin Reply)
  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      return message.warning('Vui lòng nhập nội dung phản hồi!');
    }
    setSubmitting(true);
    try {
      const res = await api.put(`/reviews/${selectedReview._id}/reply`, 
        { adminReply: replyText },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      message.success('Đã gửi phản hồi thành công!');
      
      // Cập nhật lại UI không cần reload trang
      setReviews(reviews.map(r => r._id === selectedReview._id ? res.data.data : r));
      setIsModalOpen(false);
      setReplyText('');
    } catch (error) {
      console.log(error);
      message.error('Gửi phản hồi thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. XỬ LÝ XÓA ĐÁNH GIÁ (Quyền lực tối cao của Admin)
  const handleDelete = async (id) => {
    try {
      await api.delete(`/reviews/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Đã xóa đánh giá vi phạm!');
      setReviews(reviews.filter(r => r._id !== id));
    } catch (error) {
      console.log(error);
      message.error('Xóa đánh giá thất bại!');
    }
  };

  // Mở Modal Phản hồi và set data mặc định
  const openReplyModal = (record) => {
    setSelectedReview(record);
    setReplyText(record.adminReply || ''); // Nếu đã có phản hồi cũ thì load lên để sửa
    setIsModalOpen(true);
  };

  // 4. CẤU HÌNH CỘT CHO BẢNG DATATABLE
  const columns = [
    {
      title: 'SẢN PHẨM',
      key: 'product',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.productId?.images?.[0] || 'https://via.placeholder.com/50'} 
            shape="square" 
            size={50} 
          />
          <Text strong ellipsis style={{ width: 150 }} title={record.productId?.name}>
            {record.productId?.name || 'Sản phẩm đã bị xóa'}
          </Text>
        </Space>
      )
    },
    {
      title: 'KHÁCH HÀNG',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar src={record.userAvatar} icon={<UserOutlined />} />
          <Text>{record.userName}</Text>
        </Space>
      )
    },
    {
      title: 'NỘI DUNG ĐÁNH GIÁ',
      key: 'content',
      render: (_, record) => (
        <div>
          <Rate disabled defaultValue={record.rating} style={{ fontSize: '12px', color: '#faad14', marginBottom: '8px' }} />
          <br/>
          <Text style={{ fontSize: '14px' }}>{record.comment}</Text>
          {record.images && record.images.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <Space>
                {record.images.map((img, idx) => (
                  <img key={idx} src={img} alt="review" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d9d9d9' }} />
                ))}
              </Space>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'THỜI GIAN',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => <Text type="secondary">{moment(date).format('DD/MM/YYYY HH:mm')}</Text>
    },
    {
      title: 'TRẠNG THÁI',
      key: 'status',
      width: 150,
      render: (_, record) => {
        if (record.adminReply) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>Đã phản hồi</Tag>;
        }
        return <Tag color="orange" icon={<SyncOutlined spin />}>Chờ xử lý</Tag>;
      }
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            ghost={!record.adminReply} 
            icon={<MessageOutlined />} 
            onClick={() => openReplyModal(record)}
          >
            {record.adminReply ? 'Sửa' : 'Trả lời'}
          </Button>
          
          <Popconfirm 
            title="Xóa đánh giá này?" 
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record._id)} 
            okText="Xóa luôn" 
            cancelText="Hủy"
            placement="left"
          >
            <Button danger icon={<DeleteOutlined />} type="text" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={2}>Quản lý Đánh giá Khách hàng</Title>
        <Button icon={<SyncOutlined />} onClick={fetchReviews}>Làm mới</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={reviews} 
        rowKey="_id" 
        loading={loading} 
        style={{ background: 'white', borderRadius: '12px' }} 
        pagination={{ pageSize: 8 }}
      />

      {/* MODAL GÕ PHẢN HỒI */}
      <Modal
        title={
          <Space>
            <MessageOutlined style={{ color: '#1890ff' }} />
            <span>Phản hồi Đánh giá của {selectedReview?.userName}</span>
          </Space>
        }
        open={isModalOpen}
        onOk={handleReplySubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText="Gửi phản hồi"
        cancelText="Đóng"
        width={600}
      >
        {selectedReview && (
          <div style={{ padding: '16px 0' }}>
            {/* Tóm tắt lại đánh giá của khách */}
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <Rate disabled defaultValue={selectedReview.rating} style={{ fontSize: '12px', color: '#faad14' }} />
              <div style={{ marginTop: '8px', fontStyle: 'italic' }}>"{selectedReview.comment}"</div>
            </div>

            <Text strong>Nội dung phản hồi từ Admin (TechNova):</Text>
            <TextArea 
              rows={5} 
              placeholder="Nhập nội dung cảm ơn hoặc giải quyết khiếu nại của khách hàng..." 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReviews;