import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Spin, message, Button, Empty, Space, Popconfirm } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import OrderSummary from '../../components/checkout/OrderSummary';

const { Title, Text } = Typography;

const CartPage = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const [discount, setDiscount] = useState(null);

    // 1. LẤY DỮ LIỆU GIỎ HÀNG TỪ BACKEND
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const res = await api.get('/cart', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setCartItems(res.data.data?.items || []);
            } catch (error) {
                console.error('Lỗi tải giỏ hàng:', error);
                message.error('Không thể tải dữ liệu giỏ hàng!');
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, []);

    // 2. TÍNH TỔNG TIỀN TRỰC TIẾP TỪ STATE (Cho mượt mà UI)
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // 3. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM
    const handleUpdateQuantity = async (itemId, currentQty, change) => {
        const newQty = currentQty + change;
        if (newQty < 1) return; // Không cho giảm xuống dưới 1, muốn xóa thì bấm nút rác

        setUpdatingItemId(itemId);
        try {
            const res = await api.put('/cart/update', { itemId, quantity: newQty }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Cập nhật lại state mượt mà không cần load lại trang
            setCartItems(res.data.data.items);
            
            // THÊM MỚI: Bắn tín hiệu để ClientLayout cập nhật lại số Badge trên Header
            window.dispatchEvent(new Event('CART_UPDATED'));
            
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể cập nhật số lượng. Có thể do hết hàng!');
        } finally {
            setUpdatingItemId(null);
        }
    };

    // 4. XÓA SẢN PHẨM KHỎI GIỎ
    const handleRemoveItem = async (itemId) => {
        setUpdatingItemId(itemId);
        try {
            const res = await api.delete(`/cart/${itemId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCartItems(res.data.data.items);
            message.success('Đã xóa sản phẩm khỏi giỏ hàng.');
            
            // THÊM MỚI: Bắn tín hiệu để ClientLayout cập nhật lại số Badge trên Header
            window.dispatchEvent(new Event('CART_UPDATED'));
            
        } catch (error) {
            console.error('Lỗi xóa sản phẩm:', error);
            message.error('Lỗi khi xóa sản phẩm!');
        } finally {
            setUpdatingItemId(null);
        }
    };

    // 5. CHUYỂN HƯỚNG SANG CHECKOUT
    const handleCheckout = () => {
        // Gửi tạm mảng cartItems qua state để trang Checkout có thể đọc được ngay
        navigate('/checkout', { state: { fromCart: true, cartItems } });
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', height: '100vh' }}><Spin size="large" /></div>;

    return (
        <div style={{ padding: '40px 0', color: '#e6edf3', maxWidth: '1200px', margin: '0 auto' }}>
            <style>
                {`
                    .qty-btn { 
                        background: transparent; border: none; color: #8b949e; cursor: pointer; 
                        display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
                        transition: all 0.2s;
                    }
                    .qty-btn:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,0.1); border-radius: 4px; }
                    .qty-btn:disabled { color: #4a5568; cursor: not-allowed; }
                    .delete-btn { color: #8b949e; transition: color 0.3s; cursor: pointer; }
                    .delete-btn:hover { color: #ff4d4f; }
                `}
            </style>

            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <Title level={1} style={{ color: '#fff', margin: 0 }}>Giỏ Hàng</Title>
                <Text style={{ color: '#8b949e', fontSize: '18px' }}>({totalItems} sản phẩm)</Text>
            </div>

            {cartItems.length > 0 ? (
                <Row gutter={[32, 32]}>
                    {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
                    <Col xs={24} lg={16}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {cartItems.map(item => (
                                <div key={item._id} style={{ 
                                    background: '#161e2e', padding: '24px', borderRadius: '16px', 
                                    border: '1px solid #30363d', display: 'flex', gap: '24px', position: 'relative',
                                    opacity: updatingItemId === item._id ? 0.6 : 1, transition: 'opacity 0.3s'
                                }}>
                                    {updatingItemId === item._id && (
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                            <Spin />
                                        </div>
                                    )}

                                    {/* Ảnh sản phẩm */}
                                    <div style={{ width: '120px', height: '120px', background: '#0d1117', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                        <img src={item.image || 'https://via.placeholder.com/120'} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>

                                    {/* Thông tin & Tương tác */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ paddingRight: '16px' }}>
                                                <Title level={4} style={{ margin: '0 0 8px 0', color: '#e6edf3' }}>{item.name}</Title>
                                                <Text style={{ color: '#8b949e', display: 'block' }}>
                                                    {item.storage ? `${item.storage}, ` : ''}{item.color}
                                                </Text>
                                            </div>
                                            
                                            {/* Nút Xóa */}
                                            <Popconfirm title="Bạn muốn xóa sản phẩm này?" onConfirm={() => handleRemoveItem(item._id)} okText="Xóa" cancelText="Hủy">
                                                <DeleteOutlined className="delete-btn" style={{ fontSize: '20px', padding: '4px' }} />
                                            </Popconfirm>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                                            <Text strong style={{ fontSize: '20px', color: '#fff' }}>{item.price.toLocaleString('vi-VN')} đ</Text>
                                            
                                            {/* Bộ điều khiển số lượng */}
                                            <div style={{ display: 'flex', alignItems: 'center', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d', padding: '4px' }}>
                                                <button className="qty-btn" onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)} disabled={item.quantity <= 1 || updatingItemId === item._id}>
                                                    <MinusOutlined style={{ fontSize: '12px' }} />
                                                </button>
                                                <Text strong style={{ color: '#fff', width: '32px', textAlign: 'center', display: 'inline-block' }}>{item.quantity}</Text>
                                                <button className="qty-btn" onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)} disabled={updatingItemId === item._id}>
                                                    <PlusOutlined style={{ fontSize: '12px' }} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Col>

                    {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
                    <Col xs={24} lg={8}>
                        <div style={{ position: 'sticky', top: '100px' }}>
                            <OrderSummary 
                                cartItems={cartItems} 
                                subtotal={subtotal} 
                                shippingFee={0}
                                discount={discount} 
                                setDiscount={setDiscount} 
                                isCartPage={true} 
                                onCheckout={handleCheckout} 
                            />
                        </div>
                    </Col>
                </Row>
            ) : (
                <div style={{ background: '#161e2e', padding: '80px 20px', borderRadius: '24px', border: '1px solid #30363d', textAlign: 'center' }}>
                    <Empty 
                        image={<ShoppingCartOutlined style={{ fontSize: '80px', color: '#30363d', marginBottom: '24px' }} />} 
                        description={<Title level={3} style={{ color: '#8b949e' }}>Giỏ hàng của bạn đang trống</Title>} 
                    />
                    <Text style={{ color: '#8b949e', display: 'block', marginBottom: '32px' }}>Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</Text>
                    <Button type="primary" size="large" shape="round" onClick={() => navigate('/products')} style={{ background: '#2162ed', fontWeight: 'bold', padding: '0 40px' }}>
                        TIẾP TỤC MUA SẮM
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CartPage;