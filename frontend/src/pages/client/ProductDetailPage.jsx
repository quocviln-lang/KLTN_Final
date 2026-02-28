import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Row, Col, Typography, Button, Space, Tag, Divider, Breadcrumb, 
    Spin, message, Card, Tabs, Descriptions, Rate, Input, Upload, List, Avatar, Tooltip, Modal, Popconfirm 
} from 'antd';
import { 
    ShoppingCartOutlined, CheckCircleFilled, StarFilled, HomeOutlined, 
    FireOutlined, UploadOutlined, LikeOutlined, LikeFilled, DislikeOutlined, DislikeFilled, 
    UserOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment'; 

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProductDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    // ================= STATES: THÔNG TIN SẢN PHẨM =================
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [mainImage, setMainImage] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');

    // States quản lý hiệu ứng Loading khi mua hàng
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);

    // ================= STATES: ĐÁNH GIÁ (REVIEWS) =================
    const [reviews, setReviews] = useState([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewFileList, setReviewFileList] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    // ================= STATES: SỬA ĐÁNH GIÁ =================
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState('');
    const [editFileList, setEditFileList] = useState([]);
    const [updatingReview, setUpdatingReview] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    // ================= LẤY DỮ LIỆU TỪ BACKEND =================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const prodRes = await api.get('/products');
                const allProducts = prodRes.data.data;
                const foundProduct = allProducts.find(p => p.slug === slug);
                
                if (!foundProduct) {
                    message.error('Không tìm thấy sản phẩm!');
                    return navigate('/products');
                }

                setProduct(foundProduct);
                setMainImage(foundProduct.images?.[0] || foundProduct.variants?.[0]?.image || '');
                if (foundProduct.variants && foundProduct.variants.length > 0) {
                    setSelectedColor(foundProduct.variants[0].color || '');
                    setSelectedStorage(foundProduct.variants[0].storage || '');
                }

                const currentTags = foundProduct.tags || [];
                const related = allProducts
                    .filter(p => p._id !== foundProduct._id)
                    .map(p => ({ ...p, matchCount: (p.tags || []).filter(t => currentTags.includes(t)).length }))
                    .filter(p => p.matchCount > 0)
                    .sort((a, b) => b.matchCount - a.matchCount)
                    .slice(0, 4);
                setRelatedProducts(related);

                const revRes = await api.get(`/reviews/product/${foundProduct._id}`);
                setReviews(revRes.data.data || []);

            } catch (error) {
                console.error(error);
                message.error('Lỗi khi tải dữ liệu!');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug, navigate]);

    // ================= LOGIC CHỌN BIẾN THỂ =================
    const availableColors = useMemo(() => [...new Set(product?.variants?.map(v => v.color).filter(Boolean) || [])], [product]);
    const availableStorages = useMemo(() => [...new Set(product?.variants?.map(v => v.storage).filter(Boolean) || [])], [product]);
    
    const currentVariant = useMemo(() => {
        return product?.variants?.find(v => v.color === selectedColor && v.storage === selectedStorage) || null;
    }, [product, selectedColor, selectedStorage]);

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        const variantWithColor = product.variants.find(v => v.color === color && v.image);
        if (variantWithColor) setMainImage(variantWithColor.image);
    };

    // ================= LOGIC TÍNH GIÁ ĐỘNG =================
    const { originalPrice, finalPrice, hasDiscount } = useMemo(() => {
        if (!product) return { originalPrice: 0, finalPrice: 0, hasDiscount: false };
        
        const origPrice = currentVariant?.price || product.basePrice || 0;
        let finPrice = origPrice;
        let isDiscounted = false;

        if (product.activePromotion) {
            isDiscounted = true;
            if (product.activePromotion.discountPercent > 0) {
                finPrice = origPrice - (origPrice * product.activePromotion.discountPercent / 100);
            } else if (product.activePromotion.discountedPrice > 0) {
                finPrice = origPrice - product.activePromotion.discountedPrice;
            }
            if (finPrice < 0) finPrice = 0;
        }

        return { originalPrice: origPrice, finalPrice: finPrice, hasDiscount: isDiscounted };
    }, [product, currentVariant]);


    // ================= LOGIC REVIEW =================
    const hasReviewed = useMemo(() => {
        if (!currentUser || !reviews.length) return false;
        return reviews.some(r => r.userId === currentUser._id || r.userId?._id === currentUser._id);
    }, [reviews, currentUser]);

    const handleReviewUpload = async ({ file, onSuccess, onError }) => {
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            onSuccess({ url: res.data.url });
        } catch (err) {
            onError({ err });
            message.error("Tải ảnh thất bại!");
        }
    };

    const submitReview = async () => {
        if (!reviewComment.trim()) return message.warning('Vui lòng nhập nội dung đánh giá!');
        setSubmittingReview(true);
        try {
            const imageUrls = reviewFileList.map(f => f.url || f.response?.url).filter(Boolean);
            const payload = { productId: product._id, rating: reviewRating, comment: reviewComment, images: imageUrls };

            const res = await api.post('/reviews', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

            message.success('Cảm ơn bạn đã đánh giá!');
            setReviews([res.data.data, ...reviews]);
            setReviewComment('');
            setReviewFileList([]);
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi gửi đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleToggleReaction = async (reviewId, action) => {
        if (!currentUser) return message.warning('Vui lòng đăng nhập để thao tác!');
        try {
            const res = await api.put(`/reviews/${reviewId}/${action}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setReviews(reviews.map(r => r._id === reviewId ? res.data.data : r));
        } catch (error) {
            console.error('Error toggling reaction:', error);
            message.error('Thao tác thất bại!');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await api.delete(`/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            message.success('Đã xóa đánh giá của bạn!');
            setReviews(reviews.filter(r => r._id !== reviewId));
        } catch (error) {
            console.error('Error deleting review:', error);
            message.error('Xóa đánh giá thất bại!');
        }
    };

    const openEditModal = (review) => {
        setEditingReview(review);
        setEditRating(review.rating);
        setEditComment(review.comment);
        if (review.images && review.images.length > 0) {
            setEditFileList(review.images.map((url, index) => ({ uid: `-preview-${index}`, name: `image-${index}.png`, status: 'done', url })));
        } else {
            setEditFileList([]);
        }
        setIsEditModalVisible(true);
    };

    const submitEditReview = async () => {
        if (!editComment.trim()) return message.warning('Vui lòng nhập nội dung đánh giá!');
        setUpdatingReview(true);
        try {
            const imageUrls = editFileList.map(f => f.url || f.response?.url).filter(Boolean);
            const payload = { rating: editRating, comment: editComment, images: imageUrls };

            const res = await api.put(`/reviews/${editingReview._id}`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

            message.success('Cập nhật đánh giá thành công!');
            setReviews(reviews.map(r => r._id === editingReview._id ? res.data.data : r));
            setIsEditModalVisible(false);
        } catch (error) {
            console.error('Error updating review:', error);
            message.error('Lỗi khi cập nhật đánh giá');
        } finally {
            setUpdatingReview(false);
        }
    };

    // ================= LOGIC MUA HÀNG (ĐÃ GẮN SỰ KIỆN CART_UPDATED) =================
    const handleAction = async (isBuyNow = false) => {
        if (!currentUser) {
            message.warning('Vui lòng đăng nhập để thực hiện!');
            return navigate('/login');
        }

        const checkoutPayload = {
            productId: product._id,
            variantId: currentVariant?._id,
            name: product.name,
            image: mainImage,
            color: selectedColor,
            storage: selectedStorage,
            price: finalPrice, 
            quantity: 1
        };

        const apiPayload = {
            productId: product._id,
            variantId: currentVariant?._id,
            quantity: 1
        };

        if (isBuyNow) {
            setIsBuyingNow(true);
            setTimeout(() => {
                navigate('/checkout', { state: { buyNowItem: checkoutPayload } });
                setIsBuyingNow(false);
            }, 500);
        } else {
            setIsAddingToCart(true);
            try {
                await api.post('/cart/add', apiPayload, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                message.success('Đã thêm sản phẩm vào giỏ hàng!');
                
                // THÊM MỚI: Bắn tín hiệu để thanh Header cập nhật lại số lượng ngay lập tức
                window.dispatchEvent(new Event('CART_UPDATED'));
                
            } catch (error) {
                console.error('Error adding to cart:', error);
                message.error(error.response?.data?.message || 'Thêm vào giỏ hàng thất bại!');
            } finally {
                setIsAddingToCart(false);
            }
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', height: '100vh' }}><Spin size="large" /></div>;
    if (!product) return null;

    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 5.0;

    const tabItems = [
        {
            key: 'description',
            label: 'Mô tả chi tiết',
            children: <div style={{ color: '#8b949e', lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap', padding: '24px 0' }}>{product.description || 'Đang cập nhật bài viết mô tả cho sản phẩm này...'}</div>
        },
        {
            key: 'specs',
            label: 'Thông số kỹ thuật',
            children: (
                <div style={{ padding: '24px 0', maxWidth: '800px' }}>
                    <Descriptions bordered column={1} size="middle" labelStyle={{ background: '#161e2e', color: '#e6edf3', width: '30%', fontWeight: 'bold', borderColor: '#30363d' }} contentStyle={{ background: '#0d1117', color: '#8b949e', borderColor: '#30363d' }}>
                        {product.specs?.length > 0 ? product.specs.map(spec => (
                            <Descriptions.Item key={spec._id || spec.key} label={spec.key}>{spec.value}</Descriptions.Item>
                        )) : <Descriptions.Item label="Thông báo">Đang cập nhật...</Descriptions.Item>}
                    </Descriptions>
                </div>
            )
        },
        {
            key: 'reviews',
            label: `Đánh giá (${reviews.length})`,
            children: (
                <div style={{ padding: '24px 0' }}>
                    <div style={{ background: '#161e2e', padding: '24px', borderRadius: '16px', border: '1px solid #30363d', marginBottom: '40px' }}>
                        {!currentUser ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <Text style={{ color: '#8b949e', fontSize: '16px' }}>Vui lòng đăng nhập để gửi đánh giá của bạn.</Text><br/>
                                <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: '16px' }}>Đăng nhập ngay</Button>
                            </div>
                        ) : hasReviewed ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <CheckCircleFilled style={{ color: '#52c41a', fontSize: '24px', marginBottom: '12px' }} /><br/>
                                <Text style={{ color: '#e6edf3', fontSize: '16px' }}>Bạn đã đánh giá sản phẩm này rồi. Cảm ơn bạn!</Text>
                            </div>
                        ) : (
                            <>
                                <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>Gửi đánh giá của bạn</Title>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div>
                                        <Text style={{ color: '#8b949e', marginRight: '16px' }}>Chất lượng sản phẩm:</Text>
                                        <Rate value={reviewRating} onChange={setReviewRating} style={{ color: '#faad14' }} />
                                    </div>
                                    <TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm (Tối thiểu 10 ký tự)..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} style={{ background: '#0d1117', color: '#fff', borderColor: '#30363d' }} />
                                    <Upload listType="picture-card" fileList={reviewFileList} onChange={({ fileList }) => setReviewFileList(fileList)} customRequest={handleReviewUpload} accept="image/*">
                                        {reviewFileList.length >= 3 ? null : <div><UploadOutlined /><div style={{ marginTop: 8 }}>Thêm ảnh</div></div>}
                                    </Upload>
                                    <Button type="primary" loading={submittingReview} onClick={submitReview} style={{ width: '150px' }}>Gửi Đánh Giá</Button>
                                </Space>
                            </>
                        )}
                    </div>

                    <List
                        itemLayout="vertical"
                        dataSource={reviews}
                        locale={{ emptyText: <span style={{ color: '#8b949e' }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</span> }}
                        renderItem={item => {
                            const isLiked = currentUser && item.likedBy?.includes(currentUser._id);
                            const isDisliked = currentUser && item.dislikedBy?.includes(currentUser._id);
                            const isOwner = currentUser && (item.userId === currentUser._id || item.userId?._id === currentUser._id);

                            return (
                                <List.Item style={{ borderBottom: '1px solid #1f2937', padding: '24px 0' }}>
                                    <Row wrap={false} gutter={16}>
                                        <Col flex="50px"><Avatar src={item.userAvatar} icon={<UserOutlined />} size="large" /></Col>
                                        <Col flex="auto">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <Space direction="vertical" size={0}>
                                                    <Text strong style={{ color: '#e6edf3', fontSize: '15px' }}>{item.userName}</Text>
                                                    <Rate disabled defaultValue={item.rating} style={{ fontSize: '12px', color: '#faad14' }} />
                                                </Space>
                                                <Space>
                                                    <Text style={{ color: '#8b949e', fontSize: '12px', marginRight: isOwner ? '16px' : '0' }}>
                                                        {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                                    </Text>
                                                    {isOwner && (
                                                        <>
                                                            <Tooltip title="Sửa đánh giá"><Button type="text" icon={<EditOutlined />} style={{ color: '#2162ed' }} onClick={() => openEditModal(item)} /></Tooltip>
                                                            <Popconfirm title="Bạn có chắc chắn muốn xóa đánh giá này?" onConfirm={() => handleDeleteReview(item._id)} okText="Xóa" cancelText="Hủy">
                                                                <Tooltip title="Xóa đánh giá"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
                                                            </Popconfirm>
                                                        </>
                                                    )}
                                                </Space>
                                            </div>
                                            <div style={{ color: '#e6edf3', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>{item.comment}</div>
                                            {item.images && item.images.length > 0 && (
                                                <Space style={{ marginBottom: '16px' }}>
                                                    {item.images.map((img, idx) => (<img key={idx} src={img} alt="review-img" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #30363d' }} />))}
                                                </Space>
                                            )}
                                            <Space size="large" style={{ color: '#8b949e' }}>
                                                <Tooltip title="Hữu ích"><span style={{ cursor: 'pointer', color: isLiked ? '#2162ed' : '#8b949e' }} onClick={() => handleToggleReaction(item._id, 'like')}>{isLiked ? <LikeFilled /> : <LikeOutlined />} <span style={{ marginLeft: 4 }}>{item.likedBy?.length || 0}</span></span></Tooltip>
                                                <Tooltip title="Không hữu ích"><span style={{ cursor: 'pointer', color: isDisliked ? '#ff4d4f' : '#8b949e' }} onClick={() => handleToggleReaction(item._id, 'dislike')}>{isDisliked ? <DislikeFilled /> : <DislikeOutlined />} <span style={{ marginLeft: 4 }}>{item.dislikedBy?.length || 0}</span></span></Tooltip>
                                            </Space>
                                            {item.adminReply && (
                                                <div style={{ background: '#161e2e', padding: '16px', borderRadius: '8px', marginTop: '16px', borderLeft: '4px solid #2162ed' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}><CheckCircleFilled style={{ color: '#2162ed', marginRight: '8px' }} /><Text strong style={{ color: '#2162ed' }}>TechNova Phản Hồi</Text></div>
                                                    <Text style={{ color: '#e6edf3' }}>{item.adminReply}</Text>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </List.Item>
                            );
                        }}
                    />
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '20px 0 60px 0', color: '#e6edf3' }}>
            <style>
                {`
                    .thumbnail-img { border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
                    .thumbnail-img:hover { border-color: #4a5568; }
                    .thumbnail-img.active { border-color: #2162ed; }
                    .variant-btn { background: #161e2e; border: 1px solid #30363d; color: #8b949e; border-radius: 8px; padding: 8px 16px; cursor: pointer; transition: all 0.3s; }
                    .variant-btn:hover { border-color: #2162ed; color: #fff; }
                    .variant-btn.active { background: rgba(33, 98, 237, 0.1); border-color: #2162ed; color: #fff; font-weight: bold; }
                    .dark-tabs .ant-tabs-tab { color: #8b949e; font-size: 16px; padding: 12px 0; margin-right: 40px; }
                    .dark-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #2162ed !important; font-weight: bold; }
                    .dark-tabs .ant-tabs-ink-bar { background: #2162ed; height: 3px; }
                    .dark-tabs .ant-tabs-nav::before { border-bottom: 1px solid #1f2937; }
                `}
            </style>

            <Breadcrumb style={{ marginBottom: '24px' }} items={[{ title: <Link to="/" style={{ color: '#8b949e' }}><HomeOutlined /> Trang chủ</Link> }, { title: <Link to="/products" style={{ color: '#8b949e' }}>Sản phẩm</Link> }, { title: <span style={{ color: '#e6edf3' }}>{product.name}</span> }]} />

            <div style={{ background: '#0d1117', padding: '40px', borderRadius: '24px', border: '1px solid #1f2937', marginBottom: '40px' }}>
                <Row gutter={[48, 48]}>
                    <Col xs={24} md={10}>
                        <div style={{ background: '#161e2e', borderRadius: '16px', padding: '40px', textAlign: 'center', marginBottom: '16px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            <img src={mainImage || 'https://via.placeholder.com/400x400?text=No+Image'} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        {product.images?.length > 0 && (
                            <Row gutter={[12, 12]}>
                                {product.images.map((img, idx) => (
                                    <Col span={6} key={idx}><div className={`thumbnail-img ${mainImage === img ? 'active' : ''}`} onClick={() => setMainImage(img)} style={{ background: '#161e2e', padding: '10px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><img src={img} alt={`thumb-${idx}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div></Col>
                                ))}
                            </Row>
                        )}
                    </Col>

                    <Col xs={24} md={14}>
                        <Tag color={product.type?.toLowerCase() === 'phones' ? 'blue' : 'orange'} style={{ marginBottom: '12px', border: 'none' }}>
                            {product.type === 'Phones' ? 'Điện thoại' : product.type === 'Audio' ? 'Tai nghe' : product.type === 'Chargers' ? 'Sạc & Cáp' : product.type === 'Cases' ? 'Ốp lưng' : 'Khác'}
                        </Tag>
                        <Title level={2} style={{ color: '#fff', margin: '0 0 16px 0' }}>{product.name}</Title>
                        <Space style={{ marginBottom: '24px' }}><Rate disabled allowHalf value={parseFloat(avgRating)} style={{ color: '#faad14', fontSize: '16px' }} /><Text style={{ color: '#8b949e' }}>{avgRating} ({reviews.length} đánh giá)</Text></Space>
                        
                        <div style={{ marginBottom: '24px' }}>
                            {hasDiscount ? (
                                <Space align="baseline" size="middle">
                                    <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff4d4f', lineHeight: 1 }}>
                                        {finalPrice.toLocaleString('vi-VN')} đ
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '20px', textDecoration: 'line-through' }}>
                                        {originalPrice.toLocaleString('vi-VN')} đ
                                    </Text>
                                    <Tag color="magenta" style={{ fontSize: '14px', padding: '4px 8px', borderRadius: '8px', border: 'none' }}>
                                        -{product.activePromotion.discountPercent > 0 ? `${product.activePromotion.discountPercent}%` : `${product.activePromotion.discountedPrice.toLocaleString()}đ`}
                                    </Tag>
                                </Space>
                            ) : (
                                <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>
                                    {finalPrice.toLocaleString('vi-VN')} đ
                                </Text>
                            )}
                        </div>

                        {product.highlights?.length > 0 && (
                            <div style={{ marginBottom: '32px' }}><Space direction="vertical" size="middle">{product.highlights.map((hl, idx) => (<Space key={idx} align="start"><CheckCircleFilled style={{ color: '#2162ed', fontSize: '18px', marginTop: '4px' }} /><Text style={{ color: '#e6edf3', fontSize: '15px' }}>{hl}</Text></Space>))}</Space></div>
                        )}
                        <Divider style={{ borderColor: '#1f2937' }} />
                        {availableStorages.length > 0 && (
                            <div style={{ marginBottom: '24px' }}><Text strong style={{ color: '#fff', display: 'block', marginBottom: '12px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Dung lượng / Kích cỡ</Text><Space wrap>{availableStorages.map(storage => (<button key={storage} className={`variant-btn ${selectedStorage === storage ? 'active' : ''}`} onClick={() => setSelectedStorage(storage)}>{storage}</button>))}</Space></div>
                        )}
                        {availableColors.length > 0 && (
                            <div style={{ marginBottom: '32px' }}><Text strong style={{ color: '#fff', display: 'block', marginBottom: '12px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Màu sắc</Text><Space wrap>{availableColors.map(color => (<button key={color} className={`variant-btn ${selectedColor === color ? 'active' : ''}`} onClick={() => handleColorSelect(color)}>{color}</button>))}</Space></div>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button 
                                type="primary" 
                                size="large" 
                                icon={<ThunderboltOutlined />} 
                                loading={isBuyingNow} 
                                style={{ height: '56px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', flex: 1, background: '#2162ed' }} 
                                disabled={currentVariant?.quantity === 0} 
                                onClick={() => handleAction(true)}
                            >
                                {currentVariant?.quantity === 0 ? 'Tạm hết hàng' : 'MUA NGAY'}
                            </Button>
                            <Button 
                                ghost 
                                size="large" 
                                icon={<ShoppingCartOutlined />} 
                                loading={isAddingToCart} 
                                style={{ height: '56px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', flex: 1, color: '#2162ed', borderColor: '#2162ed' }} 
                                disabled={currentVariant?.quantity === 0} 
                                onClick={() => handleAction(false)}
                            >
                                THÊM VÀO GIỎ
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
            
            <div style={{ background: '#0d1117', padding: '40px', borderRadius: '24px', border: '1px solid #1f2937', marginBottom: '60px' }}>
                <Tabs defaultActiveKey="reviews" items={tabItems} className="dark-tabs" />
            </div>

            <Modal title="Sửa đánh giá của bạn" open={isEditModalVisible} onOk={submitEditReview} onCancel={() => setIsEditModalVisible(false)} confirmLoading={updatingReview} okText="Cập nhật" cancelText="Hủy">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div><Text strong>Chất lượng sản phẩm:</Text><br/><Rate value={editRating} onChange={setEditRating} style={{ color: '#faad14' }} /></div>
                    <div><Text strong>Nội dung:</Text><TextArea rows={4} value={editComment} onChange={(e) => setEditComment(e.target.value)} /></div>
                    <div><Text strong>Hình ảnh đính kèm:</Text><Upload listType="picture-card" fileList={editFileList} onChange={({ fileList }) => setEditFileList(fileList)} customRequest={handleReviewUpload} accept="image/*">{editFileList.length >= 3 ? null : <div><UploadOutlined /><div style={{ marginTop: 8 }}>Thêm ảnh</div></div>}</Upload></div>
                </Space>
            </Modal>

            {relatedProducts.length > 0 && (
                <div>
                    <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>Có thể bạn sẽ thích</Title>
                    <Row gutter={[24, 24]}>
                        {relatedProducts.map((p) => {
                            const origRelPrice = p.basePrice || 0;
                            const saleRelPrice = p.salePrice || 0;
                            const hasRelDiscount = saleRelPrice > 0 && saleRelPrice < origRelPrice;

                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={p._id}>
                                    <Card hoverable onClick={() => navigate(`/product/${p.slug}`)} style={{ background: '#161e2e', borderColor: '#30363d', borderRadius: '16px', overflow: 'hidden' }} cover={<div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                        <Space style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                                            {p.tags?.includes('hot') && <Tag color="red" style={{ borderRadius: '4px', border: 'none', margin: 0 }}><FireOutlined /> Hot</Tag>}
                                            {hasRelDiscount && p.activePromotion?.discountPercent > 0 && (
                                                <Tag color="magenta" style={{ borderRadius: '4px', border: 'none', margin: 0 }}>-{p.activePromotion.discountPercent}%</Tag>
                                            )}
                                        </Space>
                                        <img alt={p.name} src={p.variants?.[0]?.image || p.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image'} style={{ width: '100%', height: '220px', objectFit: 'contain' }} />
                                    </div>}>
                                        <Title level={5} style={{ margin: 0, color: '#e6edf3' }} ellipsis={{ rows: 1 }}>{p.name}</Title>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{p.variants?.[0]?.storage ? `${p.variants[0].storage} - ` : ''} {p.variants?.[0]?.color || p.brand}</Text>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {hasRelDiscount ? (
                                                    <>
                                                        <Text strong style={{ fontSize: '18px', color: '#ff4d4f', lineHeight: 1.2 }}>{saleRelPrice.toLocaleString('vi-VN')} đ</Text>
                                                        <Text type="secondary" style={{ fontSize: '13px', textDecoration: 'line-through' }}>{origRelPrice.toLocaleString('vi-VN')} đ</Text>
                                                    </>
                                                ) : (
                                                    <Text strong style={{ fontSize: '18px', color: '#2162ed' }}>{origRelPrice.toLocaleString('vi-VN')} đ</Text>
                                                )}
                                            </div>

                                            <Button type="primary" shape="round" icon={<ShoppingCartOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/product/${p.slug}`); }}>Xem</Button>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </div>
            )}
        </div>
    );
};

export default ProductDetailPage;