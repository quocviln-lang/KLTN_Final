import React, { useState } from 'react';
import { Card, Typography, Space, Tag, Button, message } from 'antd';
import { ShoppingCartOutlined, FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const [addingToCart, setAddingToCart] = useState(false);

    const handleAddToCart = async (e) => {
        e.stopPropagation(); // Ngăn nhấp vào ảnh chuyển trang
        
        const token = localStorage.getItem('token');
        if (!token) {
            message.warning('Vui lòng đăng nhập để bắt đầu mua sắm!');
            navigate('/login');
            return;
        }

        setAddingToCart(true);
        try {
            const defaultVariant = product.variants?.[0];
            await api.post('/cart/add', {
                productId: product._id,
                variantId: defaultVariant?._id,
                quantity: 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success(`Đã thêm ${product.name} vào giỏ hàng!`);
            window.dispatchEvent(new Event('CART_UPDATED'));
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng');
        } finally {
            setAddingToCart(false);
        }
    };

    return (
        <Card
            hoverable
            onClick={() => navigate(`/product/${product.slug}`)}
            style={{ 
                background: '#161e2e', 
                borderColor: '#30363d', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column' 
            }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            cover={
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                    <Space style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, flexWrap: 'wrap' }}>
                        {product.tags?.includes('hot') && <Tag color="red" style={{ borderRadius: '4px', border: 'none', margin: 0 }}><FireOutlined /> Hot</Tag>}
                        {product.tags?.includes('new') && <Tag color="blue" style={{ borderRadius: '4px', border: 'none', margin: 0 }}>New</Tag>}
                        {product.salePrice > 0 && product.activePromotion?.discountPercent > 0 && (
                            <Tag color="magenta" style={{ borderRadius: '4px', border: 'none', margin: 0 }}>
                                -{product.activePromotion.discountPercent}%
                            </Tag>
                        )}
                        {/* Hỗ trợ tag từ Promotion Array */}
                        {product.discountPercent > 0 && (
                            <Tag color="magenta" style={{ borderRadius: '4px', border: 'none', margin: 0 }}>
                                -{product.discountPercent}%
                            </Tag>
                        )}
                    </Space>
                    
                    <img 
                        alt={product.name} 
                        src={product.variants?.[0]?.image || product.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image'} 
                        style={{ width: '100%', height: '220px', objectFit: 'contain' }}
                    />
                </div>
            }
        >
            <Title level={5} style={{ margin: 0, color: '#e6edf3' }} ellipsis={{ rows: 2 }}>{product.name}</Title>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                {product.variants?.[0]?.storage ? `${product.variants[0].storage} - ` : ''} 
                {product.variants?.[0]?.color || product.brand}
            </Text>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {product.salePrice > 0 || product.discountedPriceValue > 0 ? (
                        <>
                            <Text strong style={{ fontSize: '18px', color: '#ff4d4f', lineHeight: 1.2 }}>
                                {(product.discountedPriceValue || product.salePrice).toLocaleString('vi-VN')} đ
                            </Text>
                            <Text type="secondary" style={{ fontSize: '13px', textDecoration: 'line-through' }}>
                                {product.basePrice?.toLocaleString('vi-VN')} đ
                            </Text>
                        </>
                    ) : (
                        <Text strong style={{ fontSize: '20px', color: '#fff' }}>
                            {product.basePrice?.toLocaleString('vi-VN')} đ
                        </Text>
                    )}
                </div>
                <Button 
                    type="primary" 
                    shape="round" 
                    icon={<ShoppingCartOutlined />} 
                    loading={addingToCart}
                    onClick={handleAddToCart}
                >
                    Mua
                </Button>
            </div>
        </Card>
    );
};

export default ProductCard;
