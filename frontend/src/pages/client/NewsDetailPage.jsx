import React, { useState, useEffect } from 'react';
import { Typography, Spin, Breadcrumb, Divider, Tag, Avatar } from 'antd';
import { HomeOutlined, UserOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');
const { Title, Text } = Typography;

const NewsDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await api.get(`/articles/${slug}`);
                if (res.data.success) {
                    setArticle(res.data.data);
                }
            } catch (error) {
                console.error('Lỗi tải bài viết:', error);
                navigate('/news'); // Quay lại trang danh sách nếu rớt link
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
        window.scrollTo(0, 0); // Cuộn lên đầu trang
    }, [slug, navigate]);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#101622' }}><Spin size="large" /></div>;
    }

    if (!article) return null;

    return (
        <div style={{ background: '#101622', minHeight: '100vh', padding: '120px 24px 60px 24px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                
                {/* Breadcrumb */}
                <Breadcrumb 
                    separator={<span style={{ color: '#8b949e' }}>/</span>}
                    style={{ marginBottom: '24px' }}
                >
                    <Breadcrumb.Item>
                        <Link to="/" style={{ color: '#8b949e' }}><HomeOutlined /> Trang chủ</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Link to="/news" style={{ color: '#8b949e' }}>Tin tức</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <span style={{ color: '#e6edf3' }}>{article.title}</span>
                    </Breadcrumb.Item>
                </Breadcrumb>

                {/* Article Header */}
                <div style={{ marginBottom: '32px' }}>
                    <Tag color="blue" style={{ marginBottom: '16px', padding: '4px 12px', fontSize: '14px', borderRadius: '16px' }}>{article.category}</Tag>
                    <Title level={1} style={{ color: '#fff', fontSize: '36px', fontWeight: '900', marginTop: 0, marginBottom: '24px', lineHeight: 1.3 }}>
                        {article.title}
                    </Title>
                    
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px', color: '#8b949e' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar src={article.author?.avatar || "https://i.pravatar.cc/150"} icon={<UserOutlined />} />
                            <Text style={{ color: '#e6edf3', fontWeight: 'bold' }}>{article.author?.name || 'Admin'}</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarOutlined /> {moment(article.createdAt).format('LL')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <EyeOutlined /> {article.views} Lượt xem
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                <div style={{ width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
                    <img 
                        src={article.thumbnail} 
                        alt={article.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                </div>

                {/* Article Content (Rendered HTML from Quill) */}
                <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }}></div>

                <Divider style={{ borderColor: '#30363d', margin: '60px 0' }} />
                
            </div>

            {/* Global Styles for Quill Content */}
            <style>{`
                .article-content {
                    color: #c9d1d9;
                    font-size: 18px;
                    line-height: 1.8;
                }
                .article-content h1, .article-content h2, .article-content h3 {
                    color: #e6edf3;
                    margin-top: 2em;
                    margin-bottom: 1em;
                    font-weight: 700;
                }
                .article-content p {
                    margin-bottom: 1.5em;
                }
                .article-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 2em 0;
                }
                .article-content a {
                    color: #58a6ff;
                    text-decoration: none;
                }
                .article-content a:hover {
                    text-decoration: underline;
                }
                .article-content blockquote {
                    border-left: 4px solid #30363d;
                    padding-left: 16px;
                    margin-left: 0;
                    color: #8b949e;
                    font-style: italic;
                }
                .article-content ul, .article-content ol {
                    padding-left: 20px;
                    margin-bottom: 1.5em;
                }
            `}</style>
        </div>
    );
};

export default NewsDetailPage;
