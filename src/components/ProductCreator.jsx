import { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Input, InputNumber, Button, Switch, Space, Typography, Divider, Modal } from 'antd';
import { CopyOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getProducts } from '../api/client';

const { Title } = Typography;

export default function ProductCreator({ products, categories, onSuccess, loading }) {
  const [mode, setMode] = useState('new'); // 'new' or 'copy'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    copyFrom: ''
  });

  useEffect(() => {
    if (mode === 'copy' && products.length > 0) {
      const categoryProds = products.filter(p => p.category === selectedCategory);
      setProductOptions(categoryProds.map(p => ({ label: p.name, value: p._id, product: p })));
    }
  }, [mode, selectedCategory, products]);

  const categoryOptions = categories.map(cat => ({ label: cat, value: cat }));

  const handleModeChange = (checked) => {
    setMode(checked ? 'copy' : 'new');
    setSelectedProduct(null);
    setFormData({ name: '', category: '', price: '', quantity: '', copyFrom: '' });
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleProductSelect = (value, option) => {
    const product = option.product;
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: product.variants[0]?.quantity || '',
      copyFrom: product._id
    });
  };

  const handleCreate = () => {
    // Simulate creation
console.log(mode === 'new' ? 'Nouveau produit créé!' : 'Produit copié!');
    onSuccess();
  };

  return (
    <Card>
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Row align="middle">
          <Col span={20}>
            <Title level={5}>Mode création</Title>
          </Col>
          <Col span={4}>
            <Space>
              <span>Nouveau</span>
              <Switch checked={mode === 'copy'} onChange={handleModeChange} />
              <span>Copier existant</span>
            </Space>
          </Col>
        </Row>

        <Select 
          placeholder="Catégorie" 
          options={categoryOptions}
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{ width: '100%' }}
        />

        {mode === 'copy' && (
          <Select 
            placeholder="Choisir produit à copier"
            options={productOptions}
            onChange={handleProductSelect}
            style={{ width: '100%' }}
            disabled={!selectedCategory}
          />
        )}

        {selectedProduct && (
          <Card size="small" style={{ borderColor: '#52c41a', borderLeftWidth: 5 }}>
            <Title level={5} style={{ marginBottom: 8, color: '#52c41a' }}>
              Copie de: {selectedProduct.name}
            </Title>
            <Space split={<Divider type="vertical" />}>
              <span>Prix: {selectedProduct.price} FCFA</span>
              <span>{selectedProduct.variants.map(v => `${v.type}(${v.quantity})`).join(', ')}</span>
            </Space>
          </Card>
        )}

        <Input 
          placeholder="Nom du produit"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        <InputNumber 
          placeholder="Prix FCFA" 
          value={formData.price}
          onChange={(value) => setFormData(prev => ({ ...prev, price: value }))}
          style={{ width: '100%' }}
        />
        <InputNumber 
          placeholder="Quantité initiale" 
          value={formData.quantity}
          onChange={(value) => setFormData(prev => ({ ...prev, quantity: value }))}
          style={{ width: '100%' }}
        />

        <Button 
          type="primary" 
          block 
          icon={<PlusOutlined />}
          onClick={handleCreate}
          loading={loading}
          style={{ backgroundColor: '#0E1EAC'}} 
        >
          {mode === 'new' ? 'Créer nouveau produit' : 'Copier ce produit'}
        </Button>
      </Space>
    </Card>
  );
}
