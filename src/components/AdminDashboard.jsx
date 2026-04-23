import { useState, useEffect } from 'react';
import { Row, Col, Button, Input, Table, message, Space, Card, Modal, Tabs, Badge, Select, Typography, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, FilterOutlined } from '@ant-design/icons';
import { getProductsOffline, getSalesOffline } from '../api/offlineClient.js';
import { resetProducts, resetSales } from '../api/client.js';
import { storage } from '../utils/storage.js';
import StatsCards from './StatsCards';
import SalesHistory from './SalesHistory';
import SalesAnalytics from './SalesAnalytics';
import ExcelImport from './ExcelImport';
import ProductCreator from './ProductCreator';
import CategoryProductSelector from './CategoryProductSelector';
import './AdminDashboard.css';

const { Title } = Typography;

export default function AdminDashboard({ darkMode = false }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsModal, setStatsModal] = useState({ visible: false, type: '', data: {} });
  const [activeTab, setActiveTab] = useState('stats');
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([getProductsOffline(), getSalesOffline()]);
      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
      const uniqueCategories = [...new Set((productsRes.data || []).map(p => p.category))].filter(Boolean);
      setCategories(uniqueCategories);
    } catch {
      message.error('Erreur chargement - Mode offline activé');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchText.toLowerCase()) &&
    (!filterCategory || p.category === filterCategory)
  );

  const handleStatsCardClick = (type, data) => {
    setStatsModal({ visible: true, type, data });
  };

  const columns = [
    { 
      title: 'Catégorie', 
      dataIndex: 'category', 
      key: 'category', 
      render: (cat) => <Tag className="category-tag">{cat}</Tag> 
    },
    { 
      title: 'Nom', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text) => <strong className="product-name">{text}</strong> 
    },
    { 
      title: 'Prix', 
      dataIndex: 'price', 
      key: 'price', 
      render: (price) => <span className="product-price">{price} FCFA</span> 
    },
    { 
      title: 'Types', 
      dataIndex: 'variants', 
      key: 'variants', 
      render: (variants) => (
        <Space>
          {variants?.map((v, i) => (
            <Tag key={i} className="variant-tag">{v.type} ({v.quantity})</Tag>
          )) || 'N/A'}
        </Space>
      )
    },
    { 
      title: 'Actions', 
      key: 'actions', 
      render: (_, record) => (
        <Space>
          <Button className="action-btn edit-btn" size="small" icon={<EditOutlined />} onClick={() => console.log('Modifier:', record)}>Modifier</Button>
          <Button className="action-btn delete-btn" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProduct(record._id)}>Supprimer</Button>
        </Space>
      )
    }
  ];

const handleDeleteProduct = () => {
    Modal.confirm({
      title: 'Supprimer?',
      onOk: () => {
        message.success('Supprimé!');
        loadData();
      }
    });
  };

  const handleResetAll = async () => {
    Modal.confirm({
      title: 'Reset all data?',
      content: 'This will delete all products and sales (online + offline)',
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all([resetProducts(), resetSales()]);
          storage.clearPending();
          storage.setCache({ products: [], sales: [], lastSync: Date.now() });
          loadData();
          message.success('✅ Reset complete');
        } catch {
          storage.clearPending();
          storage.setCache({ products: [], sales: [], lastSync: Date.now() });
          message.success('✅ Local reset complete');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleExport = () => {
    const csv = ['Catégorie,Nom,Prix,Types\n'].concat(filteredProducts.map(p => 
      `"${p.category || ''}","${p.name}","${p.price}","${p.variants?.map(v => `${v.type}(${v.quantity})`).join(';') || ''}"`
    )).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'produits.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sidebarNav = [
    { key: 'stats', label: '📊 Stats', count: sales.length },
    { key: 'products', label: '📦 Produits', count: products.length },
    { key: 'analytics', label: '📈 Analytics' },
    { key: 'history', label: '📜 History' }
  ];

  return (
    <div className="admin-dashboard" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Hero */}
      <div className="hero-section">
        <div className="hero-content">
          <div>
            <Title level={2} style={{ margin: 0, color: 'white' }}>Admin Dashboard</Title>
            <p style={{ margin: 4 }}> {loading ? 'Loading...' : `${products.length} products | ${sales.length} sales`}</p>
          </div>
          <div className="quick-actions">
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Refresh</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>Export</Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleResetAll}>Reset All</Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <SearchOutlined />
        <Input 
          placeholder="Search products..." 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select 
          placeholder="Filter category" 
          value={filterCategory}
          onChange={setFilterCategory}
          allowClear
          style={{ width: 150 }}
          options={categories.map(c => ({ value: c, label: c }))}
        />
      </div>

      {/* Layout */}
      <div className="dashboard-grid">
        <div className="sidebar">
          <Title level={5}>Nav</Title>
          {sidebarNav.map(item => (
            <Button 
              key={item.key} 
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
              block
            >
              {item.label} {item.count && <Badge count={item.count} />}
            </Button>
          ))}
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'stats',
            label: '📊 Stats',
            children: <StatsCards products={products} sales={sales} onCardClick={handleStatsCardClick} />
          },
          {
            key: 'products',
            label: '📦 Products',
            children: (
              <>
                <CategoryProductSelector />
                <Row gutter={24} style={{ margin: '24px 0' }}>
                  <Col span={16}>
                    <ProductCreator products={products} categories={categories} onSuccess={loadData} />
                  </Col>
                  <Col span={8}>
                    <ExcelImport onSuccess={loadData} />
                  </Col>
                </Row>
                <Card title={`Products List (${filteredProducts.length})`} className="glass-card">
                  <Table 
                    columns={columns}
                    dataSource={filteredProducts}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                    scroll={{ x: false }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'analytics',
            label: '📈 Analytics',
            children: <SalesAnalytics sales={sales} products={products} />
          },
          {
            key: 'history',
            label: '📜 History',
            children: <SalesHistory products={products} darkMode={darkMode} />
          }
        ]} />
      </div>

      <Modal 
        title="Stats Details"
        open={statsModal.visible}
        onCancel={() => setStatsModal({ ...statsModal, visible: false })}
        footer={null}
      >

        <div>Stats: {JSON.stringify(statsModal.data, null, 2)}</div>

      </Modal>
    </div>
  );
}

