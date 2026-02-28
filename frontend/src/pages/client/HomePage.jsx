import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Spin, message, Button, Space, Tag } from 'antd';
import { 
    MobileOutlined, 
    AudioOutlined, 
    ThunderboltOutlined, 
    SafetyOutlined,
    ShoppingCartOutlined,
    RightOutlined,
    PlayCircleOutlined,
    FireOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const HomePage = () => {
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [flashSaleData, setFlashSaleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    
    const navigate = useNavigate();

    // HÀM TÍNH TOÁN THỜI GIAN CÒN LẠI THỰC TẾ
    const calculateTimeLeft = (endDate) => {
        const difference = +new Date(endDate) - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    // 1. FETCH DỮ LIỆU SẢN PHẨM & FLASH SALE
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, flashRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/promotions/active-flashsale').catch(() => ({ data: null }))
                ]);
                
                const allProducts = prodRes.data.data;
                const filteredTrending = allProducts.filter(p => 
                    p.tags && p.tags.some(tag => ['hot', 'trend', 'trending'].includes(tag.toLowerCase()))
                );
                setTrendingProducts(filteredTrending.length > 0 ? filteredTrending.slice(0, 8) : allProducts.slice(0, 4));

                if (flashRes.data?.data) {
                    const promo = flashRes.data.data;
                    setFlashSaleData(promo);
                    setTimeLeft(calculateTimeLeft(promo.endDate));
                }
            } catch (error) {
                console.error('Error fetching home data:', error);
                message.error('Lỗi khi tải dữ liệu trang chủ!');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. LOGIC ĐỒNG HỒ ĐẾM NGƯỢC
    useEffect(() => {
        if (!flashSaleData) return;
        
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(flashSaleData.endDate));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [flashSaleData]);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', height: '100vh' }}><Spin size="large" /></div>;

    const formatTime = (time) => time < 10 ? `0${time}` : time;

    const categories = [
        { name: 'Điện thoại', icon: <MobileOutlined />, path: '/category/phones' },
        { name: 'Tai nghe', icon: <AudioOutlined />, path: '/category/audio' },
        { name: 'Củ sạc & Cáp', icon: <ThunderboltOutlined />, path: '/category/chargers' },
        { name: 'Ốp lưng', icon: <SafetyOutlined />, path: '/category/cases' },
    ];

    // ================= XỬ LÝ DỮ LIỆU HIỂN THỊ FLASH SALE =================
    let flashProduct = null;
    let originalPrice = 0;
    let flashSalePrice = 0;

    if (flashSaleData && flashSaleData.products && flashSaleData.products.length > 0) {
        flashProduct = flashSaleData.products[0];
        originalPrice = flashProduct.basePrice || 0;
        
        if (flashSaleData.discountPercent > 0) {
            flashSalePrice = originalPrice - (originalPrice * flashSaleData.discountPercent / 100);
        } else if (flashSaleData.discountedPrice > 0) {
            flashSalePrice = originalPrice - flashSaleData.discountedPrice;
        }
        if (flashSalePrice < 0) flashSalePrice = 0;
    }

    return (
        <div style={{ paddingBottom: '50px' }}>
            <style>
                {`
                    @keyframes float {
                        0% { transform: translateY(0px) rotate(-5deg); filter: drop-shadow(0px 20px 30px rgba(33, 98, 237, 0.4)); }
                        50% { transform: translateY(-20px) rotate(-2deg); filter: drop-shadow(0px 30px 40px rgba(33, 98, 237, 0.6)); }
                        100% { transform: translateY(0px) rotate(-5deg); filter: drop-shadow(0px 20px 30px rgba(33, 98, 237, 0.4)); }
                    }
                    .floating-hero { animation: float 4s ease-in-out infinite; }
                    .flash-sale-box {
                        background: #111a2c;
                        border: 1px solid #1f2937;
                        border-radius: 12px;
                        padding: 15px 20px;
                        text-align: center;
                        min-width: 80px;
                    }
                `}
            </style>

            {/* ================= 1. HERO SECTION ================= */}
            <Row align="middle" gutter={[40, 40]} style={{ minHeight: '60vh', padding: '40px 0' }}>
                <Col xs={24} lg={12}>
                    <Space direction="vertical" size="large">
                        <div style={{ color: '#2162ed', fontWeight: 'bold', border: '1px solid #2162ed', padding: '4px 12px', borderRadius: '20px', display: 'inline-block' }}>
                            🔥 Mới ra mắt: iPhone 16 Pro Max
                        </div>
                        <Title style={{ fontSize: '4rem', margin: 0, lineHeight: 1.2, color: '#fff' }}>
                            Kỷ Nguyên <br /> <span style={{ color: '#2162ed' }}>Công Nghệ Mới.</span>
                        </Title>
                        <Paragraph style={{ fontSize: '1.2rem', color: '#8b949e', maxWidth: '500px' }}>
                            Trải nghiệm sức mạnh đỉnh cao với chip A18 Pro, khung viền Titan siêu nhẹ và hệ thống AI thông minh nhất từ trước đến nay.
                        </Paragraph>
                        <Space size="middle">
                            <Button type="primary" size="large" onClick={() => navigate('/products')} style={{ padding: '0 30px', height: '50px', borderRadius: '8px', fontSize: '16px' }}>
                                Khám phá ngay <RightOutlined />
                            </Button>
                            <Button size="large" type="text" style={{ padding: '0 30px', height: '50px', fontSize: '16px', color: '#e6edf3' }} icon={<PlayCircleOutlined />}>
                                Xem video
                            </Button>
                        </Space>
                    </Space>
                </Col>
                <Col xs={24} lg={12} style={{ textAlign: 'center' }}>
                    <img 
                        src="https://pngimg.com/d/iphone_14_PNG19.png" 
                        alt="iPhone Pro Max" 
                        className="floating-hero"
                        style={{ maxWidth: '80%' }}
                    />
                </Col>
            </Row>

            {/* ================= 2. CATEGORIES SECTION ================= */}
            <div style={{ margin: '60px 0' }}>
                <Title level={3} style={{ marginBottom: '30px', color: '#fff' }}>Danh Mục Sản Phẩm</Title>
                <Row gutter={[16, 16]}>
                    {categories.map((cat, index) => (
                        <Col xs={12} sm={8} md={6} key={index}>
                            <Card 
                                hoverable 
                                onClick={() => navigate(cat.path)} 
                                style={{ textAlign: 'center', background: '#161e2e', borderColor: '#30363d', borderRadius: '16px', cursor: 'pointer' }}
                            >
                                <div style={{ fontSize: '32px', color: '#2162ed', marginBottom: '10px' }}>{cat.icon}</div>
                                <Text strong style={{ color: '#e6edf3' }}>{cat.name}</Text>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* ================= 3. FLASH SALE BANNER ================= */}
            {flashSaleData && flashProduct && (
                <div style={{ margin: '80px 0' }}>
                    <div style={{ 
                        background: '#0a101d', borderRadius: '24px', padding: '60px',
                        border: '1px solid #1f2937', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <Row align="middle" gutter={[60, 40]}>
                            <Col xs={24} lg={12}>
                                <Tag style={{ background: '#3a1c24', color: '#ff4d4f', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', marginBottom: '24px' }}>
                                    <FireOutlined /> {flashSaleData.title.toUpperCase()}
                                </Tag>
                                <Title style={{ fontSize: '3.5rem', color: '#fff', margin: '0 0 20px 0', lineHeight: 1.1 }}>
                                    {flashProduct.name.substring(0, 30)}...
                                </Title>
                                <Paragraph style={{ fontSize: '1.2rem', color: '#8b949e', marginBottom: '40px', maxWidth: '450px' }}>
                                    {flashSaleData.description || "Cơ hội sở hữu siêu phẩm với mức giá không tưởng. Nhanh tay kẻo lỡ!"}
                                </Paragraph>

                                <Space size="large" align="center">
                                    {timeLeft.days > 0 && (
                                        <>
                                            <div className="flash-sale-box">
                                                <div style={{ color: '#2162ed', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>{formatTime(timeLeft.days)}</div>
                                                <div style={{ color: '#8b949e', fontSize: '10px', marginTop: '4px', letterSpacing: '1px' }}>DAYS</div>
                                            </div>
                                            <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>:</div>
                                        </>
                                    )}
                                    <div className="flash-sale-box">
                                        <div style={{ color: '#2162ed', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>{formatTime(timeLeft.hours)}</div>
                                        <div style={{ color: '#8b949e', fontSize: '10px', marginTop: '4px', letterSpacing: '1px' }}>HOURS</div>
                                    </div>
                                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>:</div>
                                    <div className="flash-sale-box">
                                        <div style={{ color: '#2162ed', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>{formatTime(timeLeft.minutes)}</div>
                                        <div style={{ color: '#8b949e', fontSize: '10px', marginTop: '4px', letterSpacing: '1px' }}>MINS</div>
                                    </div>
                                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>:</div>
                                    <div className="flash-sale-box">
                                        <div style={{ color: '#2162ed', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>{formatTime(timeLeft.seconds)}</div>
                                        <div style={{ color: '#8b949e', fontSize: '10px', marginTop: '4px', letterSpacing: '1px' }}>SECS</div>
                                    </div>
                                </Space>
                            </Col>

                            <Col xs={24} lg={12} style={{ position: 'relative' }}>
                                <div style={{ background: 'radial-gradient(circle, #1a253c 0%, #0a101d 70%)', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
                                    <img 
                                        src={flashProduct.images?.[0] || flashProduct.variants?.[0]?.image} 
                                        alt={flashProduct.name} 
                                        style={{ width: '100%', maxWidth: '400px', transform: 'scale(1.1)', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.6))', objectFit: 'contain', height: '350px' }}
                                    />
                                </div>

                                <div style={{ 
                                    position: 'absolute', bottom: '20px', left: '20px', 
                                    background: 'rgba(26, 35, 58, 0.85)', backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                                        <span style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>
                                            {flashSalePrice.toLocaleString('vi-VN')}đ
                                        </span>
                                        {originalPrice > flashSalePrice && (
                                            <span style={{ color: '#8b949e', fontSize: '18px', textDecoration: 'line-through', lineHeight: 1.2 }}>
                                                {originalPrice.toLocaleString('vi-VN')}đ
                                            </span>
                                        )}
                                    </div>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        block 
                                        style={{ height: '45px', borderRadius: '8px', fontSize: '16px', fontWeight: '500' }}
                                        onClick={() => navigate(`/product/${flashProduct.slug}`)}
                                    >
                                        Mua ngay kẻo lỡ
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            )}

            {/* ================= 4. TRENDING SECTION ================= */}
            <div style={{ paddingTop: '20px' }}>
                <Title level={3} style={{ marginBottom: '30px', color: '#fff' }}>Xu Hướng Hiện Tại</Title>
                <Row gutter={[24, 24]}>
                    {trendingProducts.map((product) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
                            <Card
                                hoverable
                                onClick={() => navigate(`/product/${product.slug}`)}
                                style={{ background: '#161e2e', borderColor: '#30363d', borderRadius: '16px', overflow: 'hidden' }}
                                cover={
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                        <Space style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                                            <Tag color="red" style={{ borderRadius: '4px', border: 'none', margin: 0 }}>
                                                <FireOutlined /> Trending
                                            </Tag>
                                            {/* HIỂN THỊ TAG GIẢM GIÁ NẾU CÓ */}
                                            {product.salePrice > 0 && product.activePromotion?.discountPercent > 0 && (
                                                <Tag color="magenta" style={{ borderRadius: '4px', border: 'none', margin: 0 }}>
                                                    -{product.activePromotion.discountPercent}%
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
                                <Title level={5} style={{ margin: 0, color: '#e6edf3' }} ellipsis={{ rows: 1 }}>{product.name}</Title>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {product.variants?.[0]?.storage ? `${product.variants[0].storage} - ` : ''} 
                                    {product.variants?.[0]?.color || product.brand}
                                </Text>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                                    {/* LOGIC HIỂN THỊ GIÁ SALE & GIÁ GỐC */}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {product.salePrice > 0 ? (
                                            <>
                                                <Text strong style={{ fontSize: '18px', color: '#ff4d4f', lineHeight: 1.2 }}>
                                                    {product.salePrice.toLocaleString('vi-VN')} đ
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: '13px', textDecoration: 'line-through' }}>
                                                    {product.basePrice?.toLocaleString('vi-VN')} đ
                                                </Text>
                                            </>
                                        ) : (
                                            <Text strong style={{ fontSize: '18px', color: '#2162ed' }}>
                                                {product.basePrice?.toLocaleString('vi-VN')} đ
                                            </Text>
                                        )}
                                    </div>

                                    <Button 
                                        type="primary" 
                                        shape="round" 
                                        icon={<ShoppingCartOutlined />}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            message.success('Đã thêm vào giỏ!'); 
                                        }}
                                    >
                                        Mua
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};

export default HomePage;