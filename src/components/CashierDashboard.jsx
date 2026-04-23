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

  const bgColor = isDark ? '#1f2937' : '#fafbfc';
  const cardBg = isDark ? '#374151' : 'white';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const borderColor = isDark ? '#4b5563' : '#e5e7eb';
  const shadow = isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)';

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
      icon: <Tag style={{ color: isDark ? '#4ade80' : '#52c41a', fontSize: 24 }} />,
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
        <div style={{ fontWeight: 600, color: textColor }}>
          {name}
        </div>
      )
    },
    {
      title: 'Prix',
      dataIndex: 'price',
      key: 'price',
      render: price => (
        <Text strong style={{ color: isDark ? '#4ade80' : '#52c41a', fontSize: '16px' }}>
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
              style={{ fontSize: '12px', color: textColor }}
            >
              {v.type}: {v.quantity}
            </Tag>
          ))}
        </Space>
      )
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: bgColor,
      color: textColor,
      padding: '24px 24px 120px',
      position: 'relative'
    }}>
      {/* Main Status Bar - Bottom Center */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: cardBg,
        borderRadius: 16,
        padding: '12px 24px',
        boxShadow: shadow,
        border: `1px solid ${borderColor}`,
        minWidth: 300,
        textAlign: 'center'
      }}>
        <Space size="middle">
          <WifiOutlined style={{ fontSize: 20, color: isOnline ? '#10b981' : '#ef4444' }} />
          <Text strong style={{ fontSize: 16, color: textColor }}>
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
            <Text style={{ fontSize: 14, color: isDark ? '#d1d5db' : '#6b7280' }}>Tout à jour</Text>
          )}
        </Space>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 32, 
          paddingBottom: 24, 
          borderBottom: `1px solid ${borderColor}` 
        }}>
          <Title level={2} style={{ margin: 0, color: textColor }}>
            💰 Point de Vente Rapide
          </Title>
          <Text style={{ fontSize: 16, color: isDark ? '#d1d5db' : '#6b7280' }}>
            Interface optimisée pour les caissiers
          </Text>
        </div>

        {/* Stats Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          {statsCards.map((stat, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Card 
                hoverable
                style={{
                  borderRadius: 16,
                  border: `1px solid ${borderColor}`,
                  background: cardBg,
                  color: textColor,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 16, 
                    background: stat.color + (isDark ? '24' : '12'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    {stat.icon}
                  </div>
                  <Statistic
                    title={<span style={{ color: isDark ? '#d1d5db' : '#6b7280', fontSize: 14 }}>{stat.title}</span>}
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
          title={(
            <Space style={{ color: textColor }}>
              <ShoppingOutlined style={{ color: '#10b981', fontSize: 20 }} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>Nouvelle Vente</span>
            </Space>
          )}
          style={{
            borderRadius: 16,
            marginBottom: 24,
            border: `1px solid ${borderColor}`,
            background: cardBg,
            color: textColor,
            boxShadow: shadow
          }}
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
                valueStyle={{ color: '#10b981', fontSize: '24px' }}
              />
            </Col>
          </Row>
          <Divider style={{ margin: '32px 0', borderColor: borderColor }} />
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleSale}
              icon={<ShoppingOutlined />}
              style={{
                width: 320,
                height: 64,
                fontSize: 20,
                fontWeight: 600,
                background: isDark ? '#059669' : '#10b981',
                border: 'none',
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
                color: 'white'
              }}
            >
              💳 FINALISER LA VENTE
            </Button>
          </div>
        </Card>

        {showReceipt && (
          <Card 
            title="🧾 Reçu de Vente" 
            style={{ 
              marginBottom: 24, 
              borderRadius: 16,
              background: cardBg,
              color: textColor,
              border: `1px solid ${borderColor}`,
              boxShadow: shadow
            }}
          >
            <Receipt sale={currentSale} onClose={() => setShowReceipt(false)} />
          </Card>
        )}

        {/* Inventory Table */}
        <Card 
          title={(
            <Space style={{ color: textColor }}>
              📦 Inventaire
              <Tag style={{ color: textColor }}>{products.length} produits</Tag>
            </Space>
          )} 
          style={{ 
            borderRadius: 16, 
            background: cardBg,
            color: textColor,
            border: `1px solid ${borderColor}`,
            boxShadow: shadow 
          }}
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
                  style={{ marginTop: 16 }}
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

