import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Spin, message, Button, Space, Tag, Radio, Checkbox, Select, Divider, Empty } from 'antd';
import { 
    ShoppingCartOutlined, 
    FilterOutlined,
    CloseOutlined,
    FireOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

// TỪ ĐIỂN THƯƠNG HIỆU ĐỘNG (Dynamic Brands Dictionary)
const BRANDS_DICTIONARY = {
    All: ['Apple', 'Samsung', 'Xiaomi', 'Sony', 'Anker', 'Khác'],
    Phones: ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'vivo', 'Khác'],
    Audio: ['Sony', 'Apple', 'JBL', 'Marshall', 'Sennheiser', 'Khác'],
    Chargers: ['Anker', 'Baseus', 'Ugreen', 'Belkin', 'Apple', 'Khác'],
    Cases: ['Spigen', 'UAG', 'Nillkin', 'Apple', 'Samsung', 'Khác'],
    Others: ['Apple', 'Samsung', 'Xiaomi', 'Khác']
};

// TỪ ĐIỂN BỘ LỌC ĐỘNG (Dynamic Specs Dictionary)
const SPECS_DICTIONARY = {
    Phones: [
        { key: 'RAM', title: 'Dung lượng RAM', options: ['4GB', '8GB', '12GB', '16GB'] },
        { key: 'ROM', title: 'Bộ nhớ trong', options: ['128GB', '256GB', '512GB', '1TB'] }
    ],
    Audio: [
        { key: 'Kiểu dáng', title: 'Kiểu tai nghe', options: ['In-ear', 'Over-ear', 'TWS (Không dây)'] },
        { key: 'Tính năng', title: 'Tính năng đặc biệt', options: ['Chống ồn ANC', 'Microphone', 'Kháng nước'] }
    ],
    Cases: [
        { key: 'Chất liệu', title: 'Chất liệu', options: ['Silicone', 'Da', 'Nhựa cứng', 'Trong suốt'] }
    ]
};

// ================= HÀM HỖ TRỢ: CHUẨN HÓA CHUỖI SIÊU MẠNH (FUZZY MATCH) =================
const normalizeString = (str) => {
    if (!str) return '';
    return str.toString()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa toàn bộ dấu tiếng Việt
        .replace(/\s+/g, ''); // Xóa toàn bộ khoảng trắng
};

const isFuzzyMatch = (dbStr, filterStr) => {
    if (!dbStr || !filterStr) return false;
    const s1 = normalizeString(dbStr);
    const s2 = normalizeString(filterStr);
    // Khớp chính xác hoặc bao hàm nhau (VD: TWS và TWSKhongday)
    return s1 === s2 || s1.includes(s2) || s2.includes(s1);
};

const ProductsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // STATES LƯU TRỮ DỮ LIỆU
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // STATES CHO BỘ LỌC (FILTERS)
    const urlCategory = location.pathname.split('/')[2]; 
    const [category, setCategory] = useState(urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : 'All');
    
    const [selectedBrands, setSelectedBrands] = useState([]); 
    const [priceRange, setPriceRange] = useState('All');
    const [selectedSpecs, setSelectedSpecs] = useState({}); 
    const [sortOrder, setSortOrder] = useState('newest');

    // 1. GỌI API LẤY TOÀN BỘ SẢN PHẨM
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products');
                setProducts(response.data.data);
            } catch (error) {
                console.error('Error fetching products:', error);
                message.error('Lỗi tải dữ liệu kho hàng!');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Nếu URL thay đổi, cập nhật lại category state và reset bộ lọc
    useEffect(() => {
        if (urlCategory) {
            setCategory(urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1));
            setSelectedSpecs({});
            setSelectedBrands([]); 
        }
    }, [urlCategory]);

    // 2. LOGIC LỌC SẢN PHẨM (FILTER ENGINE)
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Lọc theo Category
        if (category !== 'All') {
            result = result.filter(p => p.type?.toLowerCase() === category.toLowerCase());
        }

        // Lọc theo Brand 
        if (selectedBrands.length > 0) {
            const currentTopBrands = BRANDS_DICTIONARY[category] || BRANDS_DICTIONARY['All'];
            const topBrandsListLower = currentTopBrands.filter(b => b !== 'Khác').map(b => normalizeString(b));
            const selectedLower = selectedBrands.map(b => normalizeString(b));

            result = result.filter(p => {
                const brand = normalizeString(p.brand);
                if (selectedLower.includes(brand)) return true;
                if (selectedLower.includes(normalizeString('Khác')) && !topBrandsListLower.includes(brand)) return true;
                return false;
            });
        }

        // Lọc theo Khoảng Giá
        if (priceRange !== 'All') {
            result = result.filter(p => {
                const price = p.salePrice || p.basePrice || 0;
                if (priceRange === 'under2') return price < 2000000;
                if (priceRange === '2to5') return price >= 2000000 && price <= 5000000;
                if (priceRange === '5to10') return price > 5000000 && price <= 10000000;
                if (priceRange === 'over10') return price > 10000000;
                return true;
            });
        }

        // ================= CỖ MÁY LỌC THÔNG SỐ (BẤT CHẤP LỖI NHẬP LIỆU) =================
        Object.keys(selectedSpecs).forEach(specKey => {
            const allowedValues = selectedSpecs[specKey]; // VD: ['256GB', '512GB']
            if (!allowedValues || allowedValues.length === 0) return;

            // Tìm Title của specKey hiện tại (VD: key là 'ROM', title là 'Bộ nhớ trong')
            let specTitle = specKey;
            SPECS_DICTIONARY[category]?.forEach(group => {
                if (group.key === specKey) specTitle = group.title;
            });

            result = result.filter(p => {
                // ƯU TIÊN 1: Quét trong mảng Variants (Dành cho RAM, ROM, Dung lượng lưu trong biến thể)
                const variantMatch = p.variants?.some(v => {
                    let isMatch = false;
                    const keyLower = normalizeString(specKey);
                    
                    // Nếu khách lọc ROM/Storage
                    if (keyLower === normalizeString('ROM') || keyLower === normalizeString('Storage') || keyLower === normalizeString('Dung lượng')) {
                        isMatch = allowedValues.some(val => isFuzzyMatch(v.storage, val));
                    }
                    // Nếu khách lọc RAM (phòng trường hợp biến thể có lưu RAM)
                    if (keyLower === normalizeString('RAM')) {
                        isMatch = allowedValues.some(val => isFuzzyMatch(v.ram, val));
                    }
                    return isMatch;
                });

                if (variantMatch) return true; // Biến thể khớp -> Nhận luôn sản phẩm này

                // ƯU TIÊN 2: Quét trong mảng Specs (Dành cho Kiểu dáng, Tính năng, Chất liệu...)
                const specMatch = p.specs?.some(s => {
                    // Kiểm tra xem người dùng lưu Database dưới tên là KEY (ROM) hay TITLE (Bộ nhớ trong)
                    const isKeyMatched = isFuzzyMatch(s.key, specKey) || isFuzzyMatch(s.key, specTitle);
                    if (!isKeyMatched) return false;
                    
                    // Nếu Key khớp, kiểm tra tiếp Value
                    return allowedValues.some(val => isFuzzyMatch(s.value, val));
                });

                return specMatch;
            });
        });

        // Sắp xếp (Sorting)
        const getEffectivePrice = (p) => p.salePrice || p.basePrice || 0;
        
        if (sortOrder === 'price_asc') result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        if (sortOrder === 'price_desc') result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        
        return result;
    }, [products, category, selectedBrands, priceRange, selectedSpecs, sortOrder]);

    // HÀM XỬ LÝ KHI CHECKBOX THÔNG SỐ THAY ĐỔI
    const handleSpecChange = (specKey, checkedValues) => {
        setSelectedSpecs(prev => ({
            ...prev,
            [specKey]: checkedValues
        }));
    };

    // HÀM XÓA BỘ LỌC
    const removeFilter = (type, value) => {
        if (type === 'category') {
            setCategory('All');
            navigate('/products');
        }
        if (type === 'brand') {
            setSelectedBrands(prev => prev.filter(b => b !== value));
        }
        if (type === 'price') setPriceRange('All');
        if (type === 'spec') {
            const [specKey, specVal] = value.split(':');
            setSelectedSpecs(prev => ({
                ...prev,
                [specKey]: prev[specKey].filter(v => v !== specVal)
            }));
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', height: '100vh' }}><Spin size="large" /></div>;

    const currentBrandOptions = BRANDS_DICTIONARY[category] || BRANDS_DICTIONARY['All'];

    return (
        <div style={{ padding: '40px 0', color: '#e6edf3' }}>
            
            <style>
                {`
                    .dark-radio-group .ant-radio-wrapper { color: #8b949e; font-size: 15px; margin-bottom: 12px; }
                    .dark-radio-group .ant-radio-wrapper-checked { color: #fff; font-weight: bold; }
                    .dark-checkbox-group .ant-checkbox-wrapper { color: #8b949e; margin-bottom: 8px; font-size: 14px; }
                    .dark-checkbox-group .ant-checkbox-wrapper-checked { color: #fff; }
                    .filter-title { color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 16px; letter-spacing: 0.5px; }
                    .active-filter-tag { background: rgba(33, 98, 237, 0.15); border: 1px solid #2162ed; color: #fff; border-radius: 16px; padding: 4px 12px; font-size: 14px; }
                `}
            </style>

            <div style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ color: '#fff', marginBottom: '8px' }}>Tất cả sản phẩm</Title>
                <Text style={{ color: '#8b949e', fontSize: '16px' }}>Khám phá bộ sưu tập công nghệ đỉnh cao của chúng tôi.</Text>
                
                <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <Text strong style={{ color: '#8b949e', marginRight: '8px' }}>Đang lọc:</Text>
                    
                    {category !== 'All' && (
                        <Tag closable onClose={() => removeFilter('category')} className="active-filter-tag">
                            Danh mục: {category === 'Phones' ? 'Điện thoại' : category === 'Audio' ? 'Tai nghe' : category === 'Chargers' ? 'Sạc & Cáp' : category === 'Cases' ? 'Ốp lưng' : 'Khác'}
                        </Tag>
                    )}
                    
                    {selectedBrands.map(brand => (
                        <Tag key={`brand-${brand}`} closable onClose={() => removeFilter('brand', brand)} className="active-filter-tag">
                            Hãng: {brand}
                        </Tag>
                    ))}

                    {priceRange !== 'All' && (
                        <Tag closable onClose={() => removeFilter('price')} className="active-filter-tag">
                            Giá: {priceRange === 'under2' ? 'Dưới 2 triệu' : priceRange === '2to5' ? '2 - 5 triệu' : priceRange === '5to10' ? '5 - 10 triệu' : 'Trên 10 triệu'}
                        </Tag>
                    )}

                    {Object.keys(selectedSpecs).map(specKey => 
                        selectedSpecs[specKey].map(val => (
                            <Tag key={`${specKey}-${val}`} closable onClose={() => removeFilter('spec', `${specKey}:${val}`)} className="active-filter-tag">
                                {specKey}: {val}
                            </Tag>
                        ))
                    )}

                    {(category !== 'All' || priceRange !== 'All' || selectedBrands.length > 0 || Object.values(selectedSpecs).some(arr => arr.length > 0)) && (
                        <Button type="link" onClick={() => { setCategory('All'); setPriceRange('All'); setSelectedBrands([]); setSelectedSpecs({}); navigate('/products'); }} style={{ color: '#ff4d4f' }}>
                            Xóa tất cả
                        </Button>
                    )}
                </div>
            </div>

            <Row gutter={[32, 32]}>
                {/* ================= SIDEBAR BỘ LỌC ================= */}
                <Col xs={24} lg={6}>
                    <div style={{ background: '#161e2e', padding: '24px', borderRadius: '16px', border: '1px solid #30363d', position: 'sticky', top: '100px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '8px' }}>
                            <FilterOutlined style={{ fontSize: '20px', color: '#fff' }} />
                            <Title level={4} style={{ color: '#fff', margin: 0 }}>Bộ Lọc</Title>
                        </div>

                        <div className="filter-title">DANH MỤC</div>
                        <Radio.Group onChange={e => { setCategory(e.target.value); setSelectedSpecs({}); setSelectedBrands([]); navigate(e.target.value === 'All' ? '/products' : `/category/${e.target.value.toLowerCase()}`); }} value={category} className="dark-radio-group" style={{ display: 'flex', flexDirection: 'column' }}>
                            <Radio value="All">Tất cả sản phẩm</Radio>
                            <Radio value="Phones">Điện thoại</Radio>
                            <Radio value="Audio">Tai nghe</Radio>
                            <Radio value="Chargers">Sạc & Cáp</Radio>
                            <Radio value="Cases">Ốp lưng</Radio>
                            <Radio value="Others">Phụ kiện khác</Radio>
                        </Radio.Group>

                        <Divider style={{ borderColor: '#30363d', margin: '24px 0' }} />

                        <div className="filter-title">THƯƠNG HIỆU</div>
                        <Checkbox.Group options={currentBrandOptions} value={selectedBrands} onChange={setSelectedBrands} className="dark-checkbox-group" style={{ display: 'flex', flexDirection: 'column' }} />

                        <Divider style={{ borderColor: '#30363d', margin: '24px 0' }} />

                        <div className="filter-title">KHOẢNG GIÁ</div>
                        <Radio.Group onChange={e => setPriceRange(e.target.value)} value={priceRange} className="dark-radio-group" style={{ display: 'flex', flexDirection: 'column' }}>
                            <Radio value="All">Tất cả mức giá</Radio>
                            <Radio value="under2">Dưới 2.000.000đ</Radio>
                            <Radio value="2to5">2.000.000đ - 5.000.000đ</Radio>
                            <Radio value="5to10">5.000.000đ - 10.000.000đ</Radio>
                            <Radio value="over10">Trên 10.000.000đ</Radio>
                        </Radio.Group>

                        {SPECS_DICTIONARY[category] && (
                            <>
                                <Divider style={{ borderColor: '#30363d', margin: '24px 0' }} />
                                {SPECS_DICTIONARY[category].map((specGroup) => (
                                    <div key={specGroup.key} style={{ marginBottom: '24px' }}>
                                        <div className="filter-title" style={{ textTransform: 'uppercase' }}>{specGroup.title}</div>
                                        <Checkbox.Group 
                                            options={specGroup.options} 
                                            value={selectedSpecs[specGroup.key] || []}
                                            onChange={(checkedValues) => handleSpecChange(specGroup.key, checkedValues)}
                                            className="dark-checkbox-group"
                                            style={{ display: 'flex', flexDirection: 'column' }}
                                        />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </Col>

                {/* ================= KHU VỰC HIỂN THỊ SẢN PHẨM ================= */}
                <Col xs={24} lg={18}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#161e2e', padding: '16px 24px', borderRadius: '12px', border: '1px solid #30363d' }}>
                        <Text style={{ color: '#fff', fontSize: '16px' }}>Tìm thấy <span style={{ color: '#2162ed', fontWeight: 'bold' }}>{filteredProducts.length}</span> sản phẩm</Text>
                        <Space>
                            <Text style={{ color: '#8b949e' }}>Sắp xếp theo:</Text>
                            <Select defaultValue="newest" style={{ width: 160 }} onChange={val => setSortOrder(val)} dropdownStyle={{ background: '#161e2e', color: '#fff' }}>
                                <Option value="newest">Mới nhất</Option>
                                <Option value="price_asc">Giá: Thấp đến Cao</Option>
                                <Option value="price_desc">Giá: Cao đến Thấp</Option>
                            </Select>
                        </Space>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <Row gutter={[24, 24]}>
                            {filteredProducts.map((product) => (
                                <Col xs={24} sm={12} lg={8} key={product._id}>
                                    <Card
                                        hoverable
                                        onClick={() => navigate(`/product/${product.slug}`)}
                                        style={{ background: '#161e2e', borderColor: '#30363d', borderRadius: '16px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
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
                                                    <Text strong style={{ fontSize: '20px', color: '#fff' }}>
                                                        {product.basePrice?.toLocaleString('vi-VN')} đ
                                                    </Text>
                                                )}
                                            </div>
                                            <Button type="primary" shape="round" icon={<ShoppingCartOutlined />} onClick={(e) => { e.stopPropagation(); message.success('Đã thêm vào giỏ!'); }}>
                                                Mua
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div style={{ background: '#161e2e', padding: '60px', borderRadius: '16px', border: '1px solid #30363d', textAlign: 'center' }}>
                            <Empty description={<span style={{ color: '#8b949e', fontSize: '16px' }}>Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.</span>} />
                            <Button type="primary" onClick={() => { setCategory('All'); setPriceRange('All'); setSelectedSpecs({}); setSelectedBrands([]); }} style={{ marginTop: '16px' }}>Xóa bộ lọc</Button>
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default ProductsPage;