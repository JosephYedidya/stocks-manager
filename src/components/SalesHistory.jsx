import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Empty, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getSalesOffline } from '../api/offlineClient.js';

const { Text } = Typography;

// Helper: treat 'N/A', empty string, null, undefined as invalid
const validStr = (v) => (v && v !== 'N/A' && String(v).trim() !== '') ? String(v).trim() : undefined;
const validNum = (v) => {
  const n = Number(v);
  return (!isNaN(n) && n > 0) ? n : undefined;
};

export default function SalesHistory({ products = [], darkMode }) {
  const isDark = darkMode === 'dark';
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const getProductId = (sale) => {
    if (sale.productId) return sale.productId;
    if (typeof sale.product === 'string') return sale.product;
    if (sale.product && typeof sale.product === 'object') return sale.product._id;
    return undefined;
  };

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalesOffline();
      console.log('[SalesHistory] raw sales count:', (res.data || []).length);
      console.log('[SalesHistory] products available:', products.length);

      const enrichedData = (res.data || []).map((sale, idx) => {
        const productId = getProductId(sale);
        const product = products.find(p => p._id === productId);

        // Server may return populated product object
        const serverProductName = typeof sale.product === 'object' ? sale.product?.name : undefined;
        const serverProductPrice = typeof sale.product === 'object' ? sale.product?.price : undefined;

        const resolvedName = validStr(sale.productName) || validStr(serverProductName) || validStr(product?.name);
        const resolvedPrice = validNum(sale.productPrice) || validNum(serverProductPrice) || validNum(product?.price) || 0;
        const resolvedVariant = validStr(sale.variantType) || validStr(product?.variants?.[0]?.type);

        if (idx < 3) {
          console.log('[SalesHistory] sale', sale._id?.slice(-6), {
            productId, productFound: !!product, resolvedName, resolvedPrice, resolvedVariant
          });
        }

        return {
          ...sale,
          productId: productId || sale.productId,
          productName: resolvedName,
          productPrice: resolvedPrice,
          variantType: resolvedVariant,
          quantity: Number(sale.quantity || 0)
        };
      });
      setSales(enrichedData);
    } catch (err) {
      console.log('Using cached sales (offline)', err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const textColor = isDark ? '#f9fafb' : '#111827';
  const cardBg = isDark ? '#374151' : 'white';
  const borderColor = isDark ? '#4b5563' : '#e5e7eb';
  const shadow = isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)';

  const columns = [
    {
      title: 'Produit',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      fixed: 'left',
      render: (name, record) => {
        const productId = record.productId || (typeof record.product === 'string' ? record.product : record.product?._id);
        const product = products.find(p => p._id === productId);
        const serverProductName = typeof record.product === 'object' ? record.product?.name : undefined;
        const displayName = validStr(name) || validStr(serverProductName) || validStr(product?.name) || 'N/A';
        return (
          <Text style={{ color: textColor, fontWeight: 500 }} ellipsis={{ tooltip: true }}>
            {displayName}
          </Text>
        );
      }
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'productPrice',
      key: 'price',
      width: 130,
      render: (price) => (
        <Tag color="blue" style={{ color: isDark ? '#93c5fd' : '#1890ff', background: isDark ? '#1e40af20' : '#3b82f680' }}>
          {price.toLocaleString('fr-FR')} FCFA
        </Tag>
      )
    },
    {
      title: 'Variante',
      dataIndex: 'variantType',
      key: 'variantType',
      width: 120,
      render: (variant) => (
        <Tag color="purple" style={{ color: textColor }}>
          {variant || 'Standard'}
        </Tag>
      )
    },
    {
      title: 'Qté',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
      render: (qty) => (
        <Tag color="green" style={{ color: 'white', fontWeight: 'bold' }}>
          {qty}
        </Tag>
      )
    },
    {
      title: 'Total',
      key: 'total',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const total = (Number(record.productPrice || 0) * Number(record.quantity || 0));
        return (
          <Text strong style={{ color: isDark ? '#4ade80' : '#52c41a', fontSize: 16 }}>
            {total.toLocaleString('fr-FR')} FCFA
          </Text>
        );
      }
    },
    {
      title: 'Caissier',
      dataIndex: 'soldBy',
      key: 'soldBy',
      width: 160,
      render: (seller) => (
        <Text style={{ color: isDark ? '#d1d5db' : '#6b7280' }} ellipsis={{ tooltip: true }}>
          {seller || 'N/A'}
        </Text>
      )
    },
    {
      title: 'Date',
      key: 'date',
      width: 170,
      render: (_, record) => {
        const date = new Date(record.date);
        return (
          <Text style={{ color: isDark ? '#d1d5db' : '#6b7280', fontSize: 13 }}>
            {date.toLocaleDateString('fr-FR', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        );
      }
    }
  ];

  return (
    <Card 
      title="📜 Historique des Ventes" 
      style={{ 
        marginTop: 24, 
        borderRadius: 16,
        background: cardBg,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        wdith: '100%',
        maxWidth: 1100,
        margin: '24px auto'
      }}
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadSales} 
          loading={loading}
          type="primary"
          size="small"
        >
          Actualiser
        </Button>
      }
    >
      {sales.length === 0 ? (
        <Empty 
          description="Aucune vente enregistrée. Faites votre première vente!" 
          style={{ margin: 40 }}
        />
      ) : (
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={sales}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: (total) => `Total ${total} vente${total > 1 ? 's' : ''}`,
              position: ['bottomCenter']
            }}
            scroll={{ x: 1200, y: 400 }}
            size="small"
            bordered={false}
            rowHoverable={true}
            sticky={true}
            tableLayout="fixed"
            style={{ fontSize: 14 }}
          />
        </div>
      )}
    </Card>
  );
}

