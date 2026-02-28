import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Input, Select, Space, Typography, 
  Avatar, Drawer, Button, DatePicker, Row, Col, Card, message, Spin, Form
} from 'antd';
import { 
  SearchOutlined, EyeOutlined, ShoppingOutlined, 
  ClockCircleOutlined, CarOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, shippedOrders: 0, cancelledOrders: 0 });
  
  // Filter States
  const [pagination, setPagination] = useState({ current: 1, pageSize: 6 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateRange, setDateRange] = useState([]);

  // Drawer States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Lấy dữ liệu Thống kê & Danh sách
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Gọi API Thống kê
      const statsRes = await api.get('/orders/admin/stats', { headers });
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // Chuẩn bị query params cho Danh sách
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
      };

      if (dateRange && dateRange.length === 2) {
          params.startDate = dateRange[0].startOf('day').toISOString();
          params.endDate = dateRange[1].endOf('day').toISOString();
      }

      // Gọi API Danh sách
      const listRes = await api.get('/orders/admin', { headers, params });
      if (listRes.data.success) {
        setOrders(listRes.data.data);
        setTotal(listRes.data.total);
      }
    } catch (error) {
      console.error('Lỗi lấy dữ liệu Đơn hàng:', error);
      message.error('Không thể tải dữ liệu quản lý đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, statusFilter, dateRange]);

  useEffect(() => {
     const delayDebounceFn = setTimeout(() => {
       fetchData();
     }, 500);
     return () => clearTimeout(delayDebounceFn);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Mở Drawer chi tiết
  const showDetailsDrawer = (record) => {
    setSelectedOrder(record);
    setDrawerVisible(true);
  };

  // Cập nhật trạng thái Đơn hàng
  const handleUpdateStatus = async (newDbStatus) => {
      if (!selectedOrder) return;
      setUpdatingStatus(true);
      try {
          const token = localStorage.getItem('token');
          await api.put(`/orders/admin/${selectedOrder._id}/status`, 
            { status: newDbStatus }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          message.success('Cập nhật trạng thái thành công!');
          setDrawerVisible(false);
          fetchData(); // Reload lại bảng và stats
      } catch (error) {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          message.error('Lỗi khi cập nhật trạng thái');
      } finally {
          setUpdatingStatus(false);
      }
  };

  // Cấu hình Cột
  const columns = [
    {
      title: 'ORDER ID',
      dataIndex: 'orderCode',
      key: 'orderId',
      render: (text) => <Text strong style={{ color: '#111827' }}>#{text}</Text>,
    },
    {
      title: 'CUSTOMER',
      key: 'customer',
      render: (_, record) => (
        <Space size="middle">
          <Avatar src={record.userId?.avatar} icon={!record.userId?.avatar && <UserOutlined />} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ color: '#111827', lineHeight: '1.2' }}>{record.fullName}</Text>
            <Text style={{ color: '#6b7280', fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'DATE',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => <Text style={{ color: '#6b7280' }}>{moment(date).format('MMM DD, YYYY')}</Text>,
    },
    {
      title: 'TOTAL',
      dataIndex: 'total',
      key: 'total',
      render: (total) => <Text strong style={{ color: '#111827' }}>{total.toLocaleString('vi-VN')} đ</Text>,
    },
    {
      title: 'PAYMENT',
      key: 'payment',
      render: (_, record) => {
        // Simple logic for mockup: If Online -> Paid, COD -> Pending (unless done)
        const isOnline = record.paymentMethod === 'Thanh toán Online';
        const isDone = record.status === 'done';
        const isPaid = isOnline || isDone || record.status === 'paid';
        
        let color = isPaid ? '#10b981' : '#f59e0b'; // Green vs Orange
        let text = isPaid ? 'Paid' : 'Pending';

        if(record.status === 'cancelled' || record.status === 'unsuccessful'){
            color = '#9ca3af'; // Gray
            text = 'Refunded/Cancel';
        }

        return (
          <Space>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
            <Text style={{ color: '#6b7280', fontSize: '13px' }}>{text}</Text>
          </Space>
        );
      },
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (dbStatus) => {
        let label = 'Unknown';
        let color = '#d1d5db';
        let bgColor = '#f3f4f6';

        if (dbStatus === 'waiting_approval') { label = 'Pending'; color = '#d97706'; bgColor = '#fef3c7'; } // Amber
        else if (dbStatus === 'pending' || dbStatus === 'paid') { label = 'Processing'; color = '#2563eb'; bgColor = '#dbeafe'; } // Blue
        else if (dbStatus === 'shipping') { label = 'Shipped'; color = '#4f46e5'; bgColor = '#e0e7ff'; } // Indigo
        else if (dbStatus === 'done') { label = 'Completed'; color = '#059669'; bgColor = '#d1fae5'; } // Emerald
        else if (dbStatus === 'cancelled' || dbStatus === 'unsuccessful') { label = 'Cancelled'; color = '#6b7280'; bgColor = '#f3f4f6'; } // Gray

        return (
          <span style={{ 
            color: color, background: bgColor, border: `1px solid ${color}33`,
            padding: '4px 12px', borderRadius: '16px', 
            fontSize: '12px', fontWeight: '500', display: 'inline-block', textAlign: 'center', minWidth: '80px'
          }}>
            {label}
          </span>
        );
      }
    },
    {
      title: 'ACTION',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => showDetailsDrawer(record)}
          style={{ color: '#6b7280', padding: 0 }}
        >
          Details &rarr;
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 4 STATS CARDS */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card" style={{ borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '12px', color: '#3b82f6', fontSize: '24px' }}>
                <ShoppingOutlined />
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>Total Orders</div>
                <div style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>{stats.totalOrders.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card" style={{ borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#fff7ed', borderRadius: '12px', color: '#ea580c', fontSize: '24px' }}>
                <ClockCircleOutlined />
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>Pending</div>
                <div style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>{stats.pendingOrders.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card" style={{ borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '12px', color: '#16a34a', fontSize: '24px' }}>
                <CarOutlined />
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>Shipped</div>
                <div style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>{stats.shippedOrders.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card" style={{ borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '12px', color: '#dc2626', fontSize: '24px' }}>
                <CloseCircleOutlined />
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>Cancelled</div>
                <div style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>{stats.cancelledOrders.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* FILTER BAR CAO CẤP */}
      <Card bordered={false} style={{ borderRadius: '16px', marginBottom: '24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} bodyStyle={{ padding: '20px 24px' }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={8}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>SEARCH ORDER</div>
            <Input 
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} 
              placeholder="Search by Order ID or Customer..." 
              style={{ borderRadius: '8px', padding: '8px 12px', border: '1px solid #e5e7eb', background: '#f9fafb' }}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>STATUS</div>
            <Select 
                defaultValue="All Status" 
                style={{ width: '100%', height: '40px' }} 
                onChange={setStatusFilter} 
                className="filter-select"
            >
              <Option value="All Status">All Status</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Processing">Processing</Option>
              <Option value="Shipped">Shipped</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>DATE RANGE</div>
            <RangePicker 
              style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
              onChange={(dates) => setDateRange(dates)}
            />
          </Col>
          <Col xs={24} md={2} style={{ textAlign: 'right' }}>
            <Button type="primary" style={{ background: '#2563eb', height: '40px', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>&#9776;</span> Filter
            </Button>
          </Col>
        </Row>
      </Card>

      {/* TABLE */}
      <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showTotal: (total, range) => <span style={{ color: '#6b7280' }}>Showing <span style={{ color: '#111827', fontWeight: 'bold' }}>{range[0]}-{range[1]}</span> of <span style={{ color: '#111827', fontWeight: 'bold' }}>{total}</span> orders</span>,
            showSizeChanger: false,
            className: 'admin-order-pagination'
          }}
          onChange={handleTableChange}
          className="admin-order-table"
        />
      </Card>

      {/* CHI TIẾT ĐƠN HÀNG (DRAWER) */}
      <Drawer
        title={<span style={{ fontWeight: 'bold', fontSize: '18px' }}>Chi Tiết Đơn Hàng {selectedOrder?.orderCode}</span>}
        width={500}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: '24px', background: '#f9fafb' }}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Customer Info */}
            <Card bordered={false} size="small" style={{ borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <Title level={5} style={{ marginTop: 0, marginBottom: '16px', color: '#111827' }}>Thông tin Khách hàng</Title>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '14px' }}>
                <Text style={{ color: '#6b7280' }}>Họ Tên:</Text><Text strong>{selectedOrder.fullName}</Text>
                <Text style={{ color: '#6b7280' }}>Điện thoại:</Text><Text>{selectedOrder.phone}</Text>
                <Text style={{ color: '#6b7280' }}>Email:</Text><Text>{selectedOrder.email}</Text>
                <Text style={{ color: '#6b7280' }}>Địa chỉ:</Text><Text>{selectedOrder.shippingAddress}</Text>
              </div>
            </Card>

            {/* Order Items */}
            <Card bordered={false} size="small" style={{ borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <Title level={5} style={{ marginTop: 0, marginBottom: '16px', color: '#111827' }}>Sản phẩm đã mua ({selectedOrder.items.length})</Title>
              {selectedOrder.items.map(item => (
                <div key={item._id} style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                  {item.image ? <Avatar src={item.image} shape="square" size={64} style={{ borderRadius: '8px' }} /> : <div style={{ width: 64, height: 64, background: '#eee', borderRadius: '8px' }} />}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Text strong style={{ fontSize: '14px', lineHeight: '1.2', marginBottom: '4px' }}>{item.name}</Text>
                    <Text style={{ color: '#6b7280', fontSize: '12px' }}>{item.color} - {item.storage}</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <Text style={{ color: '#6b7280' }}>SL: {item.quantity}</Text>
                        <Text strong style={{ color: '#2563eb' }}>{item.price?.toLocaleString()}đ</Text>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                 <Text style={{ color: '#6b7280', fontSize: '16px' }}>Tổng cộng:</Text>
                 <Text strong style={{ fontSize: '20px', color: '#dc2626' }}>{selectedOrder.total?.toLocaleString()} đ</Text>
              </div>
            </Card>

            {/* Update Status Actions */}
            <Card bordered={false} size="small" style={{ borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', background: '#fff' }}>
                <Title level={5} style={{ marginTop: 0, marginBottom: '16px', color: '#111827' }}>Cập nhật Logic</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedOrder.status === 'waiting_approval' && (
                        <Button type="primary" block loading={updatingStatus} onClick={() => handleUpdateStatus('pending')} style={{ background: '#2563eb' }}>Duyệt đơn (Chuyển sang Đang đóng gói)</Button>
                    )}
                    {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                        <Button type="primary" block loading={updatingStatus} onClick={() => handleUpdateStatus('shipping')} style={{ background: '#4f46e5' }}>Giao cho ĐV Vận chuyển (Shipped)</Button>
                    )}
                    {selectedOrder.status === 'shipping' && (
                        <Button type="primary" block loading={updatingStatus} onClick={() => handleUpdateStatus('done')} style={{ background: '#059669' }}>Xác nhận Giao thành công (Completed)</Button>
                    )}
                    
                    {/* Hủy đơn áp dụng cho các trạng thái chưa giao */}
                    {['waiting_approval', 'pending', 'paid'].includes(selectedOrder.status) && (
                        <Button danger block loading={updatingStatus} onClick={() => handleUpdateStatus('cancelled')}>Hủy đơn hàng</Button>
                    )}
                </div>
            </Card>
          </div>
        )}
      </Drawer>

      <style>{`
        /* BẢNG CSS ĐIỀU CHỈNH GIAO DIỆN KHỚP VỚI MOCKUP */
        .admin-order-table .ant-table-thead > tr > th { 
            background: #fff; 
            color: #6b7280; 
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 0.05em;
            border-bottom: 2px solid #f3f4f6; 
            padding: 16px 24px;
        }
        .admin-order-table .ant-table-tbody > tr > td { 
            border-bottom: 1px solid #f3f4f6; 
            padding: 20px 24px;
        }
        .admin-order-table .ant-table-tbody > tr:hover > td {
            background-color: #f9fafb !important;
        }
        
        .filter-select .ant-select-selector { 
            border-radius: 8px !important; 
            height: 40px !important;
            align-items: center;
            border: 1px solid #e5e7eb !important;
        }
        
        .admin-order-pagination { 
            display: flex; 
            width: 100%; 
            border-top: 1px solid #f3f4f6; 
            padding: 16px 24px; 
            margin: 0 !important; 
            align-items: center;
        }
        .admin-order-pagination .ant-pagination-total-text { 
            margin-right: auto !important; 
        }
        .admin-order-pagination .ant-pagination-item {
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .admin-order-pagination .ant-pagination-item-active {
            background: #2563eb;
            border-color: #2563eb;
        }
        .admin-order-pagination .ant-pagination-item-active a {
            color: #fff !important;
        }
        
        /* Loại bỏ border của Card mặc định để mượt hơn */
        .ant-card-bordered { border-color: #f3f4f6; }
      `}</style>
    </div>
  );
};

export default AdminOrders;
