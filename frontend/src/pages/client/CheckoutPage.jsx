import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Steps, Button, message, Form } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderSummary from '../../components/checkout/OrderSummary';
import ShippingStep from '../../components/checkout/ShippingStep';
import PaymentStep from '../../components/checkout/PaymentStep';
import ReviewStep from '../../components/checkout/ReviewStep';

const { Title, Text } = Typography;

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [currentStep, setCurrentStep] = useState(0); 
    const [cartItems, setCartItems] = useState([]);
    
    const [form] = Form.useForm();
    const [shippingDetails, setShippingDetails] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('cod'); // Chuyển COD làm mặc định
    
    const [selectedServices, setSelectedServices] = useState([]);
    const [discount, setDiscount] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    useEffect(() => {
        if (location.state?.buyNowItem) {
            setCartItems([location.state?.buyNowItem]);
        } else {
            const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (savedCart.length > 0) {
                setCartItems(savedCart);
            } else {
                message.warning('Giỏ hàng trống!');
                navigate('/products');
            }
        }
    }, [location, navigate]);

    const productSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const finalSubtotal = productSubtotal + servicesTotal;
    
    // Đổi phí ship sang VNĐ
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
            const orderPayload = {
                items: cartItems,
                shippingInfo: shippingDetails,
                paymentMethod: paymentMethod,
                services: selectedServices,
                discountCode: discount?.code,
                totalAmount: finalSubtotal + shippingFee + (finalSubtotal * 0.08) - (discount?.discountAmount || 0)
            };

            console.log("Dữ liệu gửi lên Server:", orderPayload);
            await new Promise(resolve => setTimeout(resolve, 1500));

            message.success('Đặt hàng thành công! Cảm ơn bạn.');
            localStorage.removeItem('cart');
            navigate('/'); 
        } catch (error) {
            console.error("Error placing order:", error);
            message.error('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
        } finally {
            setIsPlacingOrder(false);
        }
    };

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
                    <OrderSummary cartItems={cartItems} subtotal={finalSubtotal} shippingFee={shippingFee} discount={discount} setDiscount={setDiscount} />
                </Col>
            </Row>
        </div>
    );
};

export default CheckoutPage;