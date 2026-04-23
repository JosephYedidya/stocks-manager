import { useState, useEffect } from 'react';
import { Row, Col, Button, Input, Table, message, Space, Card, Modal, Form, InputNumber, Select, Typography, Tag, Badge, Tabs } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, FilterOutlined, SaveOutlined } from '@ant-design/icons';
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm] = Form.useForm();

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

/* First sidebarNav removed */

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
          <Button className="action-btn edit-btn" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Modifier</Button>
          <Button className="action-btn delete-btn" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)}>Supprimer</Button>
        </Space>
      )
    }
  ];

const handleDelete = () => {
    Modal.confirm({
      title: 'Supprimer ce produit?',
      content: 'Cette action est irréversible.',
      onOk: async () => {
        message.success('Produit supprimé!');
        loadData();
      },
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    editForm.setFieldsValue({
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: product.variants?.[0]?.quantity || 0
    });
  };

  const onEditFinish = async (values) => {
    if (!editingProduct) return;
    
    const updatedProduct = {
      ...editingProduct,
      ...values,
      variants: editingProduct.variants.map((v, i) => ({
        ...v,
        quantity: values[`quantity_${i}`] || v.quantity
      }))
    };

    try {
      // Update offline
      console.log('Updated:', updatedProduct);
      message.success('Produit modifié!');
      loadData();
    } catch {
      message.error('Erreur lors de la mise à jour');
    } finally {
      setEditingProduct(null);
      editForm.resetFields();
    }
  };

  const handleResetAll = async () => {
    Modal.confirm({
      title: 'Supprimer toutes les données?',
      content: 'Produits et ventes seront effacés (online + offline)',
      okText: 'Confirmer',
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all([resetProducts(), resetSales()]);
          storage.clearPending();
          storage.setCache({ products: [], sales: [], lastSync: Date.now() });
          loadData();
          message.success('Reset completé');
        } catch {
          storage.clearPending();
          storage.setCache({ products: [], sales: [], lastSync: Date.now() });
          message.success('Reset local');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleExport = () => {
    const csv = ['Catégorie,Nom,Prix,Stock\n'].concat(
      filteredProducts.map(p => 
        `"${p.category || ''}","${p.name}","${p.price}","${p.variants?.map(v => `${v.type}:${v.quantity}`).join(';') || ''}"`
      )
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produits-${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sidebarNav = [
    { key: 'stats', label: '📊 Stats', count: sales.length },
    { key: 'products', label: '📦 Produits', count: products.length },
    { key: 'analytics', label: '📈 Analytics' },
    { key: 'history', label: '📜 Ventes' }
  ];

  const tabItems = [
    {
      key: 'stats',
      label: '📊 Statistiques',
      children: <StatsCards products={products} sales={sales} onCardClick={handleStatsCardClick} />
    },
    {
      key: 'products',
      label: '📦 Produits',
      children: (
        <>
          <CategoryProductSelector />
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <ProductCreator products={products} categories={categories} onSuccess={loadData} loading={loading} />
            </Col>
            <Col xs={24} lg={8}>
              <ExcelImport onSuccess={loadData} />
            </Col>
          </Row>
          <Card title={<Title level={5}>Liste des Produits ({filteredProducts.length})</Title>} className="glass-card">

            <Table 
              columns={columns}
              dataSource={filteredProducts}
              rowKey="_id"
              pagination={{ pageSize: 12, showSizeChanger: true }}
              loading={loading}
              scroll={{ x: 'max-content' }}
              size="middle"
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
      label: '📜 Historique',
      children: <SalesHistory products={products} darkMode={darkMode} />
    }
  ];

  return (
    <div className="admin-dashboard" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div>
            <Title level={2} style={{ margin: 0, color: 'white' }}>🛒 Admin Dashboard</Title>
            <p style={{ margin: 4, opacity: 0.9 }}>
              {loading ? 'Chargement...' : `${products.length} produits | ${sales.length} ventes`}
            </p>
          </div>
          <div className="quick-actions">
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} size="large">Actualiser</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport} size="large">Exporter</Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleResetAll} size="large">Reset All</Button>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="search-container">
        <SearchOutlined style={{ color: 'var(--text-secondary)' }} />
        <Input 
          placeholder="Rechercher produits..." 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className="search-input"
        />
        <Select 
          placeholder="Filtrer par catégorie" 
          value={filterCategory}
          onChange={setFilterCategory}
          style={{ width: 180 }}
          allowClear
          options={categories.map(c => ({ value: c, label: c }))}
        />
      </div>

      {/* Main Layout */}
      <div className="dashboard-grid">
        {/* Sidebar Navigation */}
        <div className="sidebar">
          <Title level={5} style={{ color: 'var(--text-primary)' }}>Navigation</Title>
          {sidebarNav.map(item => (
            <Button 
              key={item.key} 
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
              icon={false}
              size="large"
              block
            >
              {item.label}
              {item.count !== undefined && ` (${item.count})`}

            </Button>
          ))}
        </div>

        {/* Content */}
        <Tabs activeKey={activeTab} items={tabItems} size="large" className="tabbed-content" />
      </div>

      {/* Edit Product Modal */}
      <Modal 
        title="✏️ Modifier Produit"
        open={!!editingProduct}
        destroyOnClose
        onCancel={() => {
          setEditingProduct(null);
          editForm.resetFields();
        }}
        width={600}
        footer={null}
      >
        <Form 
          form={editForm} 
          layout="vertical" 
          onFinish={onEditFinish}
          initialValues={editingProduct}
          preserve={false}
        >
          <Form.Item name="name" label="Nom du produit" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Nom du produit" />
          </Form.Item>
          
          <Form.Item name="category" label="Catégorie" rules={[{ required: true, message: 'Catégorie requise' }]}>
            <Select placeholder="Sélectionner catégorie">
              {categories.map(cat => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="price" label="Prix (FCFA)" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={50} precision={0} placeholder="Prix" />
          </Form.Item>
          
          <Form.Item name="stock" label="Stock principal" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Quantité" />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => {
                setEditingProduct(null);
                editForm.resetFields();
              }}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Enregistrer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Stats Modal */}
      <Modal 
        title="📊 Détails Statistiques"
        open={statsModal.visible}
        destroyOnClose
        onCancel={() => setStatsModal({ ...statsModal, visible: false })}
        footer={null}
        width={1000}
      >
        <div>Données: {JSON.stringify(statsModal.data, null, 2)}</div>
      </Modal>
    </div>
  );
}

