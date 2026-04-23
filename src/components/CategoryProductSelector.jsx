import { useState, useEffect } from 'react';
import { Card, Select, Space, Button, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { getProductsOffline } from '../api/offlineClient.js';

const { Title, Text } = Typography;

export default function CategoryProductSelector({ onSelectProduct, darkMode }) {
  const isDark = darkMode === 'dark';
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getProductsOffline();
      setProducts(res.data);
      const uniqueCategories = [...new Set(res.data.map(p => p.category))].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      setLoading(false);
    }
  };

  const textColor = isDark ? '#f9fafb' : '#111827';
  const cardBg = isDark ? '#374151' : 'white';
  const borderColor = isDark ? '#4b5563' : '#e5e7eb';
  const shadow = isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)';

  const categoryOptions = categories.map(cat => ({ label: cat, value: cat }));

  const categoryProducts = products.filter(p => p.category === selectedCategory);
  const productOptions = categoryProducts.map(p => ({ label: p.name, value: p._id }));

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedProduct(null);
    onSelectProduct(null);
  };

  const handleProductChange = (value) => {
    const product = products.find(p => p._id === value);
    setSelectedProduct(product);
    onSelectProduct(product);
  };

  return (
    <Card 
      title={
        <Space>
          <span style={{ color: textColor }}>🔍 Sélection Produit</span>
        </Space>
      } 
      style={{ 
        marginBottom: 24, 
        background: cardBg,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        borderRadius: 16
      }}
    >
      <Space orientation="vertical" style={{ width: '100%' }} size="middle">
        <Select
          placeholder="Sélectionner une catégorie"
          options={categoryOptions}
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{ width: '100%' }}
          loading={loading}
          size="large"
        />
        <Select
          placeholder="Produits dans cette catégorie"
          options={productOptions}
          value={selectedProduct?._id || null}
          onChange={handleProductChange}
          style={{ width: '100%' }}
          disabled={!selectedCategory}
          loading={loading}
          size="large"
        />
        {selectedProduct && (
          <Card 
            size="small" 
            style={{ 
              borderColor: '#10b981', 
              borderLeftWidth: 5, 
              borderLeftColor: '#10b981',
              background: cardBg,
              color: textColor,
              borderRadius: 12,
              boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Title level={5} style={{ marginBottom: 8, color: '#10b981' }}>
              {selectedProduct.name}
            </Title>
            <Space size="small" style={{ color: textColor }}>
              <Text strong>Prix:</Text>
              <Text>{selectedProduct.price} FCFA</Text>
            </Space>
            <Space size="small" style={{ color: textColor }}>
              <Text strong>Catégorie:</Text>
              <Text>{selectedProduct.category}</Text>
            </Space>
            <Space size="small" style={{ color: textColor }}>
              <Text strong>Stock:</Text>
              <Text>{selectedProduct.variants.map(v => `${v.type}(${v.quantity})`).join(', ')}</Text>
            </Space>
            <Space size={8}>
              <Button 
                type="primary" 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => onSelectProduct(selectedProduct, 'edit')}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                Éditer
              </Button>
              <Button 
                size="small" 
                onClick={() => onSelectProduct(selectedProduct, 'copy')}
                ghost
              >
                Copier
              </Button>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
}

