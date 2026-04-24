import { useState, useEffect } from 'react';
import {
  Button,
  Select,
  InputNumber,
  Table,
  message,
  Card,
  Row,
  Col,
  Empty,
  Tabs,
  Typography,
  Divider,
  Space,
  Tag,
  Statistic,
  Spin
} from 'antd';
import {
  ShoppingOutlined,
  SyncOutlined,
  WifiOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import Receipt from './Receipt';
import SalesHistory from './SalesHistory';
import { getProductsOffline, recordSaleOffline, syncPending } from '../api/offlineClient.js';
import { useOffline } from '../context/OfflineContext.jsx';
import './CashierDashboard.css';

const { Title, Text } = Typography;

export default function CashierDashboard({ darkMode }) {
  const isDark = darkMode === 'dark';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentSale, setCurrentSale] = useState({});
  const [syncLoading, setSyncLoading] = useState(false);
  const { isOnline, pendingCount } = useOffline();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await getProductsOffline();
      setProducts(res.data || []);
      const uniqueCategories = [...new Set((res.data || []).map(p => p.category))].filter(Boolean);
      setCategories(uniqueCategories);
      if (uniqueCategories[0]) setSelectedCategory(uniqueCategories[0]);
    } catch {
      message.warning('Mode offline activé');
    }
  };

  const handleManualSync = async () => {
    if (!isOnline || pendingCount === 0) return;

    setSyncLoading(true);
    try {
      await syncPending();
      message.success(`✅ ${pendingCount} transactions synchronisées!`);
      loadProducts();
    } catch {
      message.error('❌ Synchronisation échouée');
    } finally {
      setSyncLoading(false);
    }
  };

  const categoryProducts = products.filter(p => p.category === selectedCategory);
  const currentProduct = products.find(p => p._id === selectedProduct);
  const variantOptions = currentProduct?.variants
    ?.filter(v => v.quantity > 0)
    .map(v => ({ label: `${v.type} (${v.quantity})`, value: v.type })) || [];

  const totalPrice = (currentProduct?.price || 0) * quantity;
  const handleSale = async () => {
    if (!selectedProduct || !selectedVariant || quantity < 1) return message.error('Sélection complète requise');

    setLoading(true);
    try {
      const saleData = {
        productId: selectedProduct,
        productName: currentProduct.name,
        productPrice: currentProduct.price,
        variantType: selectedVariant,
        quantity,
        soldBy: localStorage.getItem('userEmail')
      };

      await recordSaleOffline(saleData);
      message.success('✅ Vente enregistrée!');

      setCurrentSale(saleData);
      setShowReceipt(true);
      setQuantity(1);
      setSelectedVariant('');
    } catch {
      message.error('Erreur vente');
    } finally {
      setLoading(false);
    }
  };

  // Stat card configs (colors remain dynamic)
  const statsCards = [
    {
      title: 'Produits',
      value: products.length,
      icon: <DatabaseOutlined style={{ color: isDark ? '#60a5fa' : '#1890ff', fontSize: 24 }} />,
      color: isDark ? '#60a5fa' : '#1890ff'
    },
    {
      title: 'Catégories',
      value: categories.length,
      icon: <Tag style={{ color: isDark ? '#4ade80' : '#52c41a', fontSize: 24, background: 'none', border: 'none' }} />,
      color: isDark ? '#4ade80' : '#52c41a'
    },
    {
      title: 'Stock Faible',
      value: products.filter(p => p.variants?.some(v => v.quantity <= 5)).length,
      icon: <ShoppingCartOutlined style={{ color: isDark ? '#fbbf24' : '#faad14', fontSize: 24 }} />,
      color: isDark ? '#fbbf24' : '#faad14'
    },
    {
      title: 'Stock Total',
      value: products.reduce((sum, p) => sum + (p.variants?.reduce((v, vv) => v + vv.quantity, 0) || 0), 0),
      icon: <ShoppingOutlined style={{ color: isDark ? '#f472b6' : '#eb2f96', fontSize: 24 }} />,
      color: isDark ? '#f472b6' : '#eb2f96'
    }
  ];

  const productColumns = [
    {
      title: 'Produit',
      dataIndex: 'name',
      key: 'name',
      render: name => (
        <div style={{ fontWeight: 600 }}>
          {name}
        </div>
      )
    },
    {
      title: 'Prix',
      dataIndex: 'price',
      key: 'price',
      render: price => (
        <Text strong style={{ fontSize: '16px' }}>
          {price.toLocaleString()} FCFA
        </Text>
      )
    },
    {
      title: 'Stock',
      dataIndex: 'variants',
      key: 'variants',
      render: variants => (
        <Space size="small">
          {variants.map(v => (
            <Tag
              key={v.type}
              color={v.quantity > 0 ? 'success' : 'error'}
              style={{ fontSize: '12px' }}
            >
              {v.type}: {v.quantity}
            </Tag>
          ))}
        </Space>
      )
    }
  ];

  return (
    <div
      className="cashier-dashboard"
      data-theme={isDark ? 'dark' : 'light'}
    >
      {/* Status Bar - Bottom Center */}
      <div className="status-bar">
        <Space size="middle">
          <WifiOutlined style={{ fontSize: 20, color: isOnline ? '#10b981' : '#ef4444' }} />
          <Text strong style={{ fontSize: 16 }}>
            {isOnline ? 'Connecté' : 'Hors ligne'}
          </Text>
          {pendingCount > 0 ? (
            <Space.Compact>
              <Spin size="small" spinning={syncLoading} />
              <Button
                type="primary"
                size="small"
                loading={syncLoading}
                onClick={handleManualSync}
                style={{ borderRadius: 8 }}
              >
                Sync ({pendingCount})
              </Button>
            </Space.Compact>
          ) : (
            <Text style={{ fontSize: 14 }}>Tout à jour</Text>
          )}
        </Space>
      </div>

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <Title level={2} style={{ margin: 0 }}>
            💰 Point de Vente Rapide
          </Title>
          <p>Interface optimisée pour les caissiers</p>
        </div>

        {/* Stats Cards */}
        <Row gutter={[20, 20]} className="stats-grid">
          {statsCards.map((stat, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Card
                hoverable
                className="stat-card"
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    className="stat-icon-wrapper"
                    style={{ background: stat.color + (isDark ? '24' : '12') }}
                  >
                    {stat.icon}
                  </div>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    valueStyle={{ color: stat.color, fontSize: isDark ? '22px' : '24px' }}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Sale Form */}
        <Card
          title={
            <Space>
              <ShoppingOutlined style={{ color: '#10b981', fontSize: 20 }} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>Nouvelle Vente</span>
            </Space>
          }
          className="sale-form-card"
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Select
                placeholder="Sélectionner catégorie"
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categories.map(cat => ({ label: cat, value: cat }))}
                style={{ width: '100%' }}
                size="large"
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Choisir produit"
                value={selectedProduct}
                onChange={setSelectedProduct}
                options={categoryProducts.map(p => ({ label: p.name, value: p._id }))}
                disabled={!selectedCategory}
                style={{ width: '100%' }}
                size="large"
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Variante"
                value={selectedVariant}
                onChange={setSelectedVariant}
                options={variantOptions}
                disabled={!selectedProduct}
                style={{ width: '100%' }}
                size="large"
              />
            </Col>
            <Col span={4}>
              <InputNumber
                min={1}
                value={quantity}
                onChange={setQuantity}
                placeholder="Qté"
                style={{ width: '100%' }}
                size="large"
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Montant Total"
                value={totalPrice}
                precision={0}
                prefix="FCFA"
                className="sale-total-display"
                valueStyle={{ color: '#10b981', fontSize: '24px' }}
              />
            </Col>
          </Row>
          <Divider className="sale-form-divider" />
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleSale}
              icon={<ShoppingOutlined />}
              className="finalize-btn"
              style={{
                background: isDark ? '#059669' : '#10b981',
              }}
            >
              💳 FINALISER LA VENTE
            </Button>
          </div>
        </Card>

        {showReceipt && (
          <Card
            title="🧾 Reçu de Vente"
            className="receipt-card"
          >
            <Receipt sale={currentSale} onClose={() => setShowReceipt(false)} />
          </Card>
        )}

        {/* Inventory Table */}
        <Card
          title={
            <Space>
              📦 Inventaire
              <Tag>{products.length} produits</Tag>
            </Space>
          }
          className="inventory-card"
        >
          <Tabs
            activeKey={selectedCategory}
            onChange={setSelectedCategory}
            type="card"
            size="large"
            items={categories.map(cat => ({
              key: cat,
              label: <Space><Tag color="blue">{categoryProducts.length}</Tag>{cat}</Space>,
              children: categoryProducts.length ? (
                <Table
                  columns={productColumns}
                  dataSource={categoryProducts}
                  rowKey="_id"
                  pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                  size="middle"
                  className="product-table"
                  rowHoverable
                />
              ) : (
                <Empty description={`Aucun produit dans "${cat}"`} />
              )
            }))}
          />
        </Card>

        <SalesHistory products={products} darkMode={darkMode} />
      </div>
    </div>
  );
}
