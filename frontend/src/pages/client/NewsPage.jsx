import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Input, Spin, Pagination, Empty, Tag } from 'antd';
import { SearchOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

const { Title, Text, Paragraph } = Typography;

const NewsPage = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    
    // Pagination state
    const [pagination, setPagination] = useState({ current: 1, pageSize: 9, total: 0 });

    const categories = ['Tất cả', 'Tin tức chung', 'Khuyến mãi', 'Công nghệ', 'Đánh giá', 'Mẹo vặt'];

    const fetchArticles = async (page = 1, category = '', search = '') => {
        setLoading(true);
        try {
            let url = `/articles?page=${page}&limit=${pagination.pageSize}`;
            if (category && category !== 'Tất cả') url += `&category=${category}`;
            if (search) url += `&search=${search}`;

            const res = await api.get(url);
            if (res.data.success) {
                setArticles(res.data.data);
                setPagination({
                    ...pagination,
                    current: res.data.pagination.page,
                    total: res.data.pagination.total
                });
            }
        } catch (error) {
            console.error('Lỗi tải tin tức:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles(1, activeCategory, searchTerm);
    }, [activeCategory]);

    const handleSearch = (value) => {
        setSearchTerm(value);
        fetchArticles(1, activeCategory, value);
    };

    const handlePageChange = (page) => {
        fetchArticles(page, activeCategory, searchTerm);
    };

    return (
        <div style={{ background: '#101622', minHeight: '100vh', padding: '40px 24px', paddingTop: '100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header & Search */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Title level={1} style={{ color: '#fff', fontSize: '40px', fontWeight: '900', marginBottom: '16px' }}>TECHNOVA BLOG</Title>
                    <Text style={{ color: '#9ca3af', fontSize: '18px', display: 'block', maxWidth: '600px', margin: '0 auto 32px auto' }}>
                        Cập nhật những tin tức công nghệ mới nhất, mẹo hay và mã giảm giá độc quyền chỉ có tại cửa hàng.
                    </Text>
                    
                    <Input.Search 
                        placeholder="Tìm kiếm bài viết..." 
                        allowClear 
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleSearch}
                        style={{ maxWidth: '500px', margin: '0 auto' }}
                    />
                </div>

                {/* Categories Tab */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
                    {categories.map((cat, index) => (
                        <div 
                            key={index}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '24px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                color: (activeCategory === cat || (!activeCategory && cat === 'Tất cả')) ? '#fff' : '#8b949e',
                                background: (activeCategory === cat || (!activeCategory && cat === 'Tất cả')) ? '#2162ed' : '#161e2e',
                                border: '1px solid',
                                borderColor: (activeCategory === cat || (!activeCategory && cat === 'Tất cả')) ? '#2563eb' : '#30363d',
                                transition: 'all 0.3s'
                            }}
                        >
                            {cat}
                        </div>
                    ))}
                </div>

                {/* Article Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
                ) : articles.length === 0 ? (
                    <Empty description={<span style={{ color: '#8b949e' }}>Không tìm thấy bài viết nào</span>} />
                ) : (
                    <>
                        <Row gutter={[24, 32]}>
                            {articles.map((article, index) => {
                                // Strip HTML tags tags for excerpt
                                const excerpt = article.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
                                // Cột đầu tiên (bài mới nhất) cho to ra
                                const isFeatured = index === 0 && pagination.current === 1 && !activeCategory && !searchTerm;

                                return (
                                    <Col xs={24} md={isFeatured ? 24 : 12} lg={isFeatured ? 24 : 8} key={article._id}>
                                        <Link to={`/news/${article.slug}`}>
                                            <Card
                                                hoverable
                                                style={{ 
                                                    background: '#161e2e', 
                                                    borderColor: '#30363d', 
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: isFeatured ? 'row' : 'column',
                                                    transition: 'transform 0.3s'
                                                }}
                                                bodyStyle={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}
                                                className="news-card"
                                                cover={
                                                    <div style={{ 
                                                        height: isFeatured ? '100%' : '200px', 
                                                        width: isFeatured ? '60%' : '100%',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <img 
                                                            alt={article.title} 
                                                            src={article.thumbnail} 
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '100%', 
                                                                objectFit: 'cover',
                                                                transition: 'transform 0.5s'
                                                            }} 
                                                        />
                                                    </div>
                                                }
                                            >
                                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Tag color="blue" style={{ borderRadius: '12px', padding: '2px 10px' }}>{article.category}</Tag>
                                                </div>
                                                
                                                <Title level={isFeatured ? 2 : 4} style={{ color: '#e6edf3', marginBottom: '12px', marginTop: 0 }}>
                                                    {article.title}
                                                </Title>
                                                
                                                <Paragraph style={{ color: '#8b949e', flex: 1 }}>
                                                    {excerpt}
                                                </Paragraph>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #30363d', paddingTop: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '13px' }}>
                                                        <CalendarOutlined /> {moment(article.createdAt).format('DD/MM/YYYY')}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b949e', fontSize: '13px' }}>
                                                        <EyeOutlined /> {article.views} Lượt xem
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </Col>
                                );
                            })}
                        </Row>

                        {/* Pagination */}
                        <div style={{ textAlign: 'center', marginTop: '48px' }}>
                            <Pagination 
                                current={pagination.current} 
                                total={pagination.total} 
                                pageSize={pagination.pageSize} 
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                style={{ background: '#161e2e', display: 'inline-block', padding: '8px 24px', borderRadius: '30px' }}
                            />
                        </div>
                    </>
                )}

            </div>
            <style>{`
                .news-card:hover {
                    border-color: #2162ed !important;
                    transform: translateY(-5px);
                }
                .news-card:hover img {
                    transform: scale(1.05);
                }
                .ant-pagination-item a { color: #8b949e !important; }
                .ant-pagination-item-active { background: #2162ed !important; border-color: #2162ed !important; }
                .ant-pagination-item-active a { color: #fff !important; }
                .ant-pagination-prev .ant-pagination-item-link, .ant-pagination-next .ant-pagination-item-link { color: #8b949e !important; }
                
                @media (max-width: 992px) {
                    .ant-card-cover { width: 100% !important; height: 250px !important; }
                    .news-card { flex-direction: column !important; }
                }
            `}</style>
        </div>
    );
};

export default NewsPage;
