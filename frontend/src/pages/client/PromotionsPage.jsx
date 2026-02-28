import React, { useState, useEffect } from 'react';
import { Typography, Button, Spin, Empty, message, Card, Row, Col, Modal, Tag } from 'antd';
import { 
    GiftOutlined, 
    FireOutlined, 
    RocketOutlined, 
    ShoppingCartOutlined, 
    DollarCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';

const { Title, Text } = Typography;

const PromotionsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [flashSale, setFlashSale] = useState(null);
    const [promotions, setPromotions] = useState([]);
    
    // Game States
    const [userSpins, setUserSpins] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [wonPrizeData, setWonPrizeData] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Tính thời gian cho Countdown Flash Sale
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            // Lấy Flash Sale nếu có
            try {
                const flashRes = await api.get('/promotions/active-flashsale');
                if (flashRes.data.success) {
                    setFlashSale(flashRes.data.data);
                }
            } catch {
                // Ignore if no flash sale
            }

            // Lấy Danh sách chiến dịch khác (Hot Deals)
            try {
                // Sửa thành route public
                const promoRes = await api.get('/promotions/active');
                if (promoRes.data.success) {
                    setPromotions(promoRes.data.data.filter(p => !p.isFlashSale));
                }
            } catch {
                // Ignore
            }

            // Lấy số lượt quay của User hiện tại qua API profile
            const token = localStorage.getItem('token');
            if (token) {
                const userRes = await api.get('/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.data.success) {
                    setUserSpins(userRes.data.data.spinCount || 0);
                }
            }

        } catch (error) {
            console.error('Lỗi khi tải trang khuyến mãi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    // Hiệu ứng Countdown
    useEffect(() => {
        if (!flashSale) return;
        const endDate = new Date(flashSale.endDate).getTime();
        
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endDate - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            } else {
                setTimeLeft({
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [flashSale]);

    // 6 Vùng thưởng của Vòng quay tương ứng với Backend:
    // 0: Giảm 10%, 1: Hụt, 2: Giảm 50K, 3: +1 Lượt, 4: hụt, 5: Giảm 100K
    const segments = [
        { label: 'Giảm 10%', color: '#dc2626' }, // index 0 (Đỏ)
        { label: 'Hụt rồi', color: '#1f2937' },  // index 1 (Xám đen)
        { label: 'Giảm 50K', color: '#2563eb' }, // index 2 (Xanh biếc)
        { label: '+1 Lượt', color: '#059669' },  // index 3 (Xanh lục)
        { label: 'Hihi', color: '#1f2937' },     // index 4 (Xám đen)
        { label: 'Giảm 100K', color: '#d97706' }, // index 5 (Cam)
    ];

    const handleSpinClick = async () => {
        if (isSpinning) return;
        
        const token = localStorage.getItem('token');
        if (!token) {
            message.warning('Bạn cần đăng nhập để tham gia vòng quay!');
            navigate('/login');
            return;
        }

        if (userSpins <= 0) {
            message.warning('Bạn đã hết lượt quay! Hãy đặt hàng để nhận thêm.');
            return;
        }

        setIsSpinning(true);

        try {
            // Gọi API quay thưởng
            const res = await api.post('/promotions/spin', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const prize = res.data.data.wonPrize;
                const remainSpins = res.data.data.remainingSpins;
                const index = prize.index;

                // Tính toán góc xoay:
                // Một góc xoay là 60 độ. Kim lúc nãy CSS tôi đặt trục đỉnh (0 độ)
                // Offset ngẫu nhiên để không bị chỉ vào vạch (từ 10 đến 50 độ trong một góc 60 độ)
                const randomOffset = Math.floor(Math.random() * 40) + 10;
                
                // Múi 0: 0-60, Múi 1: 60-120
                // Tuy nhiên do chia theo chiều kim đồng hồ CSS conic-gradient
                const targetSliceDegree = index * 60; 
                
                // Để kim chỉ vào giữa slice index -> vòng quay phải lui lại (360 - độ)
                const baseRotation = 360 - targetSliceDegree - randomOffset;
                
                // Cần thêm nhiều vòng quay (VD: 8 vòng = 2880 độ) để lấy trớn
                const extraSpins = 360 * 8;
                
                // Target tổng luôn dương và cộng dồn vào góc cũ để CSS quay tới chứ không trượt ngược
                const newRotation = rotation + extraSpins + baseRotation - (rotation % 360);

                setRotation(newRotation);
                
                // Trì hoãn 5 giây bằng với animation spin transition
                setTimeout(() => {
                    setWonPrizeData(prize);
                    setUserSpins(remainSpins);
                    setIsSpinning(false);
                    setIsModalVisible(true);
                }, 5000);
            }
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra, không thể quay!');
            setIsSpinning(false);
        }
    };

    if (loading) {
        return <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;
    }

    return (
        <div style={{ background: '#101622', minHeight: '100vh', paddingBottom: '60px' }}>
            {/* HERO FLASH SALE BANNER */}
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '60px 40px', position: 'relative', overflow: 'hidden' }}>
                {/* Abstract blur shapes */}
                <div style={{ position: 'absolute', top: '-10%', right: '10%', width: '300px', height: '300px', background: '#ec4899', filter: 'blur(100px)', opacity: 0.3, borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-20%', left: '20%', width: '400px', height: '400px', background: '#3b82f6', filter: 'blur(120px)', opacity: 0.2, borderRadius: '50%' }}></div>
                
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, position: 'relative' }}>
                    <div style={{ maxWidth: '600px' }}>
                        <div style={{ background: '#dc2626', color: '#fff', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px', marginBottom: '24px' }}>
                            <FireOutlined /> SỰ KIỆN NỔI BẬT THÁNG
                        </div>
                        <Title style={{ color: '#fff', fontSize: '48px', fontWeight: '900', margin: '0 0 16px 0', lineHeight: 1.1 }}>
                           {flashSale ? flashSale.title : 'TECH SUPER SALE!'}
                        </Title>
                        <Text style={{ color: '#9ca3af', fontSize: '18px', display: 'block', marginBottom: '32px' }}>
                           {flashSale ? flashSale.description : 'Săn sale công nghệ giảm giá kịch sàn đến 50%. Duy nhất trong hôm nay, đừng bỏ lỡ!'}
                        </Text>
                        
                        {/* COUNTDOWN */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '16px', textAlign: 'center', minWidth: '90px' }}>
                                <div style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{String(timeLeft.hours).padStart(2, '0')}</div>
                                <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>GIỜ</div>
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '32px' }}>:</div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '16px', textAlign: 'center', minWidth: '90px' }}>
                                <div style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{String(timeLeft.minutes).padStart(2, '0')}</div>
                                <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>PHÚT</div>
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '32px' }}>:</div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '16px', textAlign: 'center', minWidth: '90px' }}>
                                <div style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{String(timeLeft.seconds).padStart(2, '0')}</div>
                                <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>GIÂY</div>
                            </div>
                        </div>
                    </div>
                    {/* Sản phẩm Flash Sale thay vì Icon */}
                    <div style={{ position: 'relative', width: '320px' }}>
                        {flashSale?.products && flashSale.products.length > 0 ? (
                            <ProductCard 
                                product={{
                                    ...flashSale.products[0],
                                    discountPercent: flashSale.discountPercent,
                                    discountedPriceValue: flashSale.discountPercent > 0 
                                      ? flashSale.products[0].basePrice * (100 - flashSale.discountPercent) / 100
                                      : flashSale.products[0].basePrice - flashSale.discountedPrice
                                }} 
                            />
                        ) : (
                            <RocketOutlined style={{ fontSize: '250px', color: '#fff', opacity: 0.9, animation: 'float 3s ease-in-out infinite' }} />
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ maxWidth: '1400px', margin: '60px auto 0 auto', padding: '0 24px' }}>
                
                {/* ===== VÒNG QUAY MAY MẮN ===== */}
                <div style={{ background: '#161e2e', borderRadius: '24px', padding: '40px', border: '1px solid #30363d', display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '60px' }}>
                    
                    {/* VÒNG QUAY UI */}
                    <div style={{ flexShrink: 0, position: 'relative', width: '360px', height: '360px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         {/* Mũi tên chỉ vòng quay đứng yên ở trên cùng */}
                         <div style={{ position: 'absolute', top: '-25px', zIndex: 20, width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '35px solid #2162ed', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}></div>
                         
                         {/* Vòng quay chính */}
                         <div className="wheel-container" style={{ transform: `rotate(${rotation}deg)` }}>
                             {/* Các đường chia ô và text */}
                             {segments.map((seg, i) => {
                                 // Góc của mỗi ô = 60 độ. Text nên ở giữa ô => i * 60 + 30
                                 const rotateValue = (i * 60) + 30; 
                                 return (
                                    <div key={i} className="wheel-label" style={{ 
                                        position: 'absolute', 
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        transform: `rotate(${rotateValue}deg)` 
                                    }}>
                                        <span style={{ 
                                            position: 'absolute',
                                            left: '50%',
                                            transform: 'translateX(-50%)', // Căn giữa chính xác
                                            top: '20px', // Đẩy xuống một chút từ viền
                                            fontWeight: 'bold', 
                                            fontSize: '15px', 
                                            color: '#fff', 
                                            textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                                            width: '90px',
                                            textAlign: 'center'
                                        }}>
                                            {seg.label}
                                        </span>
                                    </div>
                                 );
                             })}
                         </div>
                         
                         {/* Tâm vòng quay đứng yên */}
                         <div className="wheel-center">
                            <GiftOutlined style={{ fontSize: '24px', color: '#2563eb' }} />
                         </div>
                    </div>

                    {/* VÒNG QUAY INFO */}
                    <div style={{ flex: 1 }}>
                        <Title level={2} style={{ color: '#fff', margin: '0 0 16px 0' }}>CYBER SPIN - Săn Quà Khủng</Title>
                        <Text style={{ color: '#9ca3af', fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                            Tham gia vòng quay may mắn để nhận các Voucher mua sắm siêu giá trị.
                            Càng quay nhiều, cơ hội trúng quà khủng (Giảm 200K) càng cao!
                        </Text>
                        
                        <div style={{ background: '#0d1117', border: '1px solid #30363d', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '32px' }}>
                            <Text style={{ color: '#8b949e', fontSize: '14px', marginRight: '16px' }}>Số lượt quay hiện tại:</Text>
                            <span style={{ background: '#2162ed', color: '#fff', padding: '4px 16px', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold' }}>{userSpins}</span>
                            <Text style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginTop: '8px' }}>Gợi ý: Đặt thêm 1 đơn hàng để nhận 1 lượt quay nhé!</Text>
                            
                            <Button 
                                type="dashed" 
                                size="small" 
                                onClick={async () => {
                                    const token = localStorage.getItem('token');
                                    if(!token) return message.warning('Vui lòng đăng nhập!');
                                    try {
                                        const res = await api.post('/promotions/add-spins', {}, { headers: { Authorization: `Bearer ${token}` }});
                                        if (res.data.success) {
                                            setUserSpins(res.data.spinCount);
                                            message.success('+10 Lượt quay thành công!');
                                        }
                                    } catch { message.error('Lỗi khi thêm lượt quay test'); }
                                }}
                                style={{ marginTop: '12px', background: 'transparent', color: '#10b981', borderColor: '#10b981' }}
                            >
                                Hack +10 Lượt (Dành cho Tester)
                            </Button>
                        </div>
                        
                        <div>
                            <Button 
                                type="primary" 
                                size="large" 
                                onClick={handleSpinClick} 
                                loading={isSpinning}
                                style={{ background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)', border: 'none', height: '56px', padding: '0 48px', borderRadius: '28px', fontSize: '18px', fontWeight: 'bold' }}
                            >
                                QUAY NGAY MÀ KHÔNG CẦN NGHĨ
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ===== HOT DEALS DƯỚI ===== */}
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Title level={3} style={{ color: '#fff', margin: 0 }}><DollarCircleOutlined /> HOT DEALS ĐANG DIỄN RA</Title>
                </div>

                {promotions.filter(p => p.type === 'discount').length === 0 ? (
                    <Empty description={<span style={{ color: '#8b949e' }}>Hiện không có HOT DEALS giảm giá sản phẩm nào</span>} style={{ padding: '40px 0', background: '#161e2e', borderRadius: '16px', border: '1px solid #30363d' }} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {promotions.filter(p => p.type === 'discount').map(promo => (
                            <div key={promo._id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>{promo.title}</Title>
                                        <Text style={{ color: '#8b949e' }}>{promo.description}</Text>
                                    </div>
                                    <Tag color="magenta" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '16px' }}>
                                        {promo.discountPercent > 0 ? `Giảm ${promo.discountPercent}%` : `Giảm ${promo.discountedPrice.toLocaleString()}đ`}
                                    </Tag>
                                </div>
                                <Row gutter={[24, 24]}>
                                    {promo.products && promo.products.map(product => {
                                        const finalPrice = promo.discountPercent > 0 
                                            ? product.basePrice * (100 - promo.discountPercent) / 100
                                            : product.basePrice - promo.discountedPrice;
                                            
                                        return (
                                            <Col xs={24} md={12} lg={8} key={product._id}>
                                                <ProductCard 
                                                    product={{
                                                        ...product,
                                                        discountPercent: promo.discountPercent,
                                                        discountedPriceValue: finalPrice > 0 ? finalPrice : 0
                                                    }} 
                                                />
                                            </Col>
                                        );
                                    })}
                                    {(!promo.products || promo.products.length === 0) && (
                                        <Col span={24}>
                                            <Text style={{ color: '#8b949e', fontStyle: 'italic' }}>Chiến dịch này chưa được gán sản phẩm nào.</Text>
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL TRÚNG THƯỞNG */}
            <Modal
                open={isModalVisible}
                footer={null}
                onCancel={() => setIsModalVisible(false)}
                centered
                bodyStyle={{ padding: '40px', textAlign: 'center', background: '#161e2e', borderRadius: '24px', border: '1px solid #30363d' }}
                closeIcon={<CloseCircleOutlined style={{ color: '#fff', fontSize: '20px' }} />}
            >
                {wonPrizeData?.type === 'pct' || wonPrizeData?.type === 'fixed' ? (
                    <div>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                        <Title level={3} style={{ color: '#10b981', margin: '0 0 8px 0' }}>CHÚC MỪNG BẠN!</Title>
                        <Text style={{ color: '#e6edf3', fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                            Bạn vừa trúng thưởng Voucher: <strong style={{color: '#fff', fontSize: '18px'}}>{wonPrizeData?.name}</strong>
                        </Text>
                        <div style={{ background: '#0d1117', border: '1px dashed #2162ed', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
                            <Text style={{ color: '#8b949e', display: 'block', marginBottom: '8px' }}>Mã Voucher dành riêng cho bạn:</Text>
                            <Text strong style={{ color: '#2563eb', fontSize: '24px', letterSpacing: '2px' }}>{wonPrizeData?.code}</Text>
                        </div>
                        <div style={{ marginTop: '24px' }}>
                            <Button type="primary" size="large" onClick={() => {
                                navigator.clipboard.writeText(wonPrizeData?.code);
                                message.success('Đã copy mã!');
                                setIsModalVisible(false);
                            }} style={{ background: '#2162ed', borderRadius: '24px', width: '100%', border: 'none' }}>
                                COPY VÀ QUAY LẠI MUA SẮM
                            </Button>
                        </div>
                    </div>
                ) : wonPrizeData?.type === 'spin' ? (
                    <div>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎁</div>
                        <Title level={3} style={{ color: '#10b981', margin: '0 0 8px 0' }}>THÊM QUÀ TẶNG!</Title>
                        <Text style={{ color: '#e6edf3', fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                            Tuyệt vời! Bạn vừa nhận được <strong style={{color: '#fff', fontSize: '18px'}}>Thêm 1 Lượt Quay</strong> miễn phí.
                        </Text>
                        <Button type="primary" size="large" onClick={() => setIsModalVisible(false)} style={{ background: '#2162ed', border: 'none', borderRadius: '24px', width: '100%' }}>
                            TIẾP TỤC QUAY NGAY
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'grayscale(1)' }}>🥺</div>
                        <Title level={3} style={{ color: '#f59e0b', margin: '0 0 8px 0' }}>Trượt mất rồi!</Title>
                        <Text style={{ color: '#e6edf3', fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                            {wonPrizeData?.name || 'Chúc bạn may mắn lần sau'}. Rất tiếc nha!
                        </Text>
                        <Button type="primary" size="large" onClick={() => setIsModalVisible(false)} style={{ background: '#4b5563', border: 'none', borderRadius: '24px', width: '100%' }}>
                            Đóng
                        </Button>
                    </div>
                )}
            </Modal>

            <style>{`
                /* ANIMATION CSS CHO BANNER VÀ WHEEL */
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                
                /* Vẽ các lát cắt vòng quay bằng vòng lặp conic-gradient */
                .wheel-container {
                    width: 340px;
                    height: 340px;
                    border-radius: 50%;
                    border: 8px solid #1f2937;
                    box-shadow: 0 0 0 4px #2162ed, 0 10px 25px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                    transition: transform 5s cubic-bezier(0.1, 0.9, 0.2, 1);
                    background: conic-gradient(
                        #dc2626 0deg 60deg,
                        #1f2937 60deg 120deg,
                        #2563eb 120deg 180deg,
                        #059669 180deg 240deg,
                        #1f2937 240deg 300deg,
                        #d97706 300deg 360deg
                    );
                }
                
                /* Text Label quay dọc */
                .wheel-label {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    left: 0;
                    top: 0;
                    display: flex;
                    align-items: center;
                    transform-origin: center center;
                }

                .wheel-center {
                    position: absolute;
                    width: 60px;
                    height: 60px;
                    background: #fff;
                    border-radius: 50%;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 5;
                    border: 4px solid #1f2937;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .promo-card {
                    transition: transform 0.2s, border-color 0.2s;
                }
                .promo-card:hover {
                    border-color: #2162ed !important;
                    transform: translateY(-5px);
                }
            `}</style>
        </div>
    );
};

export default PromotionsPage;
