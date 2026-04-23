import { useState, useEffect } from 'react';
import { Layout, Button, Card, Table, message } from 'antd';
import { getProducts } from '../api/client';

export default function SimpleAdminDashboard({ darkMode = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (error) {
      message.error('Erreur chargement produits');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Nom', dataIndex: 'name', key: 'name' },
    { title: 'Prix', dataIndex: 'price', key: 'price' },
    { title: 'Catégorie', dataIndex: 'category', key: 'category' },
  ];

  return (
    <Layout.Content style={{ padding: 24, background: darkMode ? '#141414' : '#f0f2f5' }}>
      <Card title="Produits">
        <Table columns={columns} dataSource={products} loading={loading} rowKey="_id" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={loadProducts}>
          Rafraîchir
        </Button>
      </Card>
    </Layout.Content>
  );
}
