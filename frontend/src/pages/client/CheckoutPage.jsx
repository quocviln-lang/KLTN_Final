import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Steps, Button, message, Form, Spin } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderSummary from '../../components/checkout/OrderSummary';
import ShippingStep from '../../components/checkout/ShippingStep';
import PaymentStep from '../../components/checkout/PaymentStep';
import ReviewStep from '../../components/checkout/ReviewStep';
import api from '../../services/api'; // <-- Thêm import API

const { Title, Text } = Typography;

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [currentStep, setCurrentStep] = useState(0); 
    const [cartItems, setCartItems] = useState([]);
    const [loadingCart, setLoadingCart] = useState(true); // <-- Thêm state loading để chờ fetch data
    
    const [form] = Form.useForm();
    const [shippingDetails, setShippingDetails] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('cod');
    
    const [selectedServices, setSelectedServices] = useState([]);
    const [discount, setDiscount] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // ================= LOGIC LẤY DỮ LIỆU GIỎ HÀNG THÔNG MINH =================
    useEffect(() => {
        const fetchCheckoutData = async () => {
            // 1. Trường hợp bấm "Mua Ngay" từ trang chi tiết
            if (location.state?.buyNowItem) {
                setCartItems([location.state.buyNowItem]);
                setLoadingCart(false);
                return;
            }
            
            // 2. Trường hợp đi từ CartPage sang (đã truyền sẵn data qua state)
            if (location.state?.fromCart && location.state?.cartItems) {
                if (location.state.cartItems.length > 0) {
                    setCartItems(location.state.cartItems);
                } else {
                    message.warning('Giỏ hàng của bạn đang trống!');
                    navigate('/cart');
                }
                setLoadingCart(false);
                return;
            }

            // 3. Trường hợp F5 lại trang Checkout hoặc vào trực tiếp link -> Fetch từ API Backend
            try {
                const res = await api.get('/cart', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const items = res.data.data?.items || [];
                
                if (items.length > 0) {
                    setCartItems(items);
                } else {
                    message.warning('Giỏ hàng của bạn đang trống!');
                    navigate('/cart');
                }
            } catch (error) {
                console.error("Lỗi lấy giỏ hàng:", error);
                message.error('Không thể tải thông tin đơn hàng!');
                navigate('/cart');
            } finally {
                setLoadingCart(false);
            }
        };

        fetchCheckoutData();
    }, [location, navigate]);

    const productSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const finalSubtotal = productSubtotal + servicesTotal;
    
    const shippingFee = currentStep === 0 ? 0 : 30000; 

    const handleNext = async () => {
        if (currentStep === 0) {
            try {
                const values = await form.validateFields();
                setShippingDetails(values);
                setCurrentStep(1); 
            } catch (errorInfo) {
                console.error("Error validating shipping form:", errorInfo);
                message.error('Vui lòng điền đầy đủ thông tin giao hàng!');
            }
        } else if (currentStep === 1) {
            setCurrentStep(2); 
        }
    };

    const handleBack = () => {
        if (currentStep === 0) {
            navigate(-1); 
        } else {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleEditStep = (stepIndex) => {
        setCurrentStep(stepIndex);
    };

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        try {
            const token = localStorage.getItem('token');
            const totalToPay = finalSubtotal + shippingFee + (finalSubtotal * 0.08) - (discount?.discountAmount || 0);
            
            const orderPayload = {
                items: cartItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    color: item.color,
                    storage: item.storage,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                })),
                shippingInfo: shippingDetails,
                paymentMethod: paymentMethod,
                services: selectedServices,
                discountCode: discount?.code,
                totalAmount: totalToPay
            };

            // Gọi API thật lên BE
            const response = await api.post('/orders', orderPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Đặt hàng thành công! Cảm ơn bạn.');
            
            // Xóa rỗng Redux / Event báo hiệu reset Cart ở thanh điều hướng nếu có
            window.dispatchEvent(new Event('CART_UPDATED'));

            // Truyền cục data đã lưu thành công ở BE sang trang Success để hiển thị
            const savedOrder = response.data.data;
            navigate('/checkout/success', { 
                state: { 
                    orderData: {
                        orderId: savedOrder.orderCode,
                        createdAt: savedOrder.createdAt,
                        paymentMethod: savedOrder.paymentMethod,
                        shippingAddress: `${savedOrder.shippingAddress}, ${savedOrder.province}`,
                        items: savedOrder.items,
                        totalPaid: savedOrder.total
                    } 
                }
            }); 
            
        } catch (error) {
            console.error("Error placing order:", error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Hiển thị vòng xoay nếu đang tải dữ liệu giỏ hàng để tránh lỗi giao diện
    if (loadingCart) {
        return <div style={{ textAlign: 'center', padding: '100px', height: '100vh' }}><Spin size="large" /></div>;
    }

    return (
        <div style={{ padding: '40px 0', color: '#e6edf3', maxWidth: '1200px', margin: '0 auto' }}>
            <style>
                {`
                    .dark-checkout-form .ant-form-item-label > label { color: #8b949e; }
                    .dark-checkout-form .ant-input, .dark-checkout-form .ant-select-selector {
                        background-color: #0d1117 !important; border-color: #30363d !important; color: #fff !important;
                    }
                    .dark-checkout-form .ant-input::placeholder { color: #4a5568; }
                    .dark-checkout-form .ant-form-item-has-error .ant-input { border-color: #ff4d4f !important; }
                    .dark-checkout-form .ant-form-item-explain-error { color: #ff4d4f; margin-top: 4px; }
                    
                    .dark-steps .ant-steps-item-title { color: #8b949e !important; }
                    .dark-steps .ant-steps-item-process .ant-steps-item-title { color: #fff !important; font-weight: bold; }
                    .dark-steps .ant-steps-item-process .ant-steps-item-icon { background: #2162ed; border-color: #2162ed; }
                    .dark-steps .ant-steps-item-finish .ant-steps-item-icon { background: #2162ed; border-color: #2162ed; color: #fff; }
                `}
            </style>

            <Row justify="space-between" align="bottom" style={{ marginBottom: '40px' }}>
                <Col>
                    <Title level={1} style={{ color: '#fff', margin: 0 }}>Thanh toán</Title>
                    <Text style={{ color: '#8b949e', fontSize: '16px' }}>{currentStep === 2 ? "Kiểm tra lại thông tin trước khi đặt hàng." : "Hoàn tất mua sắm một cách an toàn."}</Text>
                </Col>
                <Col xs={24} md={12} lg={10} style={{ marginTop: '20px' }}>
                    <Steps 
                        current={currentStep} 
                        className="dark-steps"
                        items={[{ title: 'Giao hàng' }, { title: 'Thanh toán' }, { title: 'Kiểm tra' }]} 
                    />
                </Col>
            </Row>

            <Row gutter={[32, 32]}>
                <Col xs={24} lg={16}>
                    {currentStep === 0 && <ShippingStep form={form} onNext={handleNext} selectedServices={selectedServices} setSelectedServices={setSelectedServices} />}
                    {currentStep === 1 && <PaymentStep paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />}
                    {currentStep === 2 && <ReviewStep shippingDetails={shippingDetails} paymentMethod={paymentMethod} onEditStep={handleEditStep} />}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                        <Button type="text" style={{ color: '#8b949e', fontSize: '16px' }} icon={<ArrowLeftOutlined />} onClick={handleBack}>
                            {currentStep === 0 ? 'Quay lại' : currentStep === 1 ? 'Về Giao hàng' : 'Về Thanh toán'}
                        </Button>
                        
                        {currentStep < 2 ? (
                            <Button type="primary" size="large" onClick={handleNext} style={{ background: '#2162ed', borderRadius: '24px', padding: '0 32px', fontWeight: 'bold' }}>
                                {currentStep === 0 ? 'Tiếp tục Thanh toán' : 'Kiểm tra Đơn hàng'}
                            </Button>
                        ) : (
                            <Button type="primary" size="large" onClick={handlePlaceOrder} loading={isPlacingOrder} icon={<CheckCircleOutlined />} style={{ background: '#52c41a', border: 'none', borderRadius: '24px', padding: '0 32px', fontWeight: 'bold' }}>
                                {isPlacingOrder ? 'Đang xử lý...' : 'Đặt Hàng Ngay'}
                            </Button>
                        )}
                    </div>
                </Col>

                <Col xs={24} lg={8}>
                    {/* KHÔNG CÓ NÚT "TIẾN HÀNH THANH TOÁN" VÌ isCartPage mặc định là false */}
                    <OrderSummary cartItems={cartItems} subtotal={finalSubtotal} shippingFee={shippingFee} discount={discount} setDiscount={setDiscount} />
                </Col>
            </Row>
        </div>
    );
};

export default CheckoutPage;