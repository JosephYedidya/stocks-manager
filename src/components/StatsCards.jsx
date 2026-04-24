import { Card, Row, Col, Progress, Typography, Modal, Table, Tag } from 'antd';
import { ShoppingCartOutlined, TrophyOutlined, DollarOutlined, StockOutlined, PieChartOutlined, BarChartOutlined } from '@ant-design/icons';
import Chart from 'react-apexcharts';

const { Title, Text } = Typography;

export default function StatsCards({ products, sales, onCardClick }) {
  const safeSales = sales || [];
  const safeProducts = products || [];

// Enhanced data for modals (safe values)
  const revenueData = safeSales.slice(0, 10).map(sale => ({
    key: sale._id || 'N/A',
    product: sale.productName || 'Inconnu',
    qty: sale.quantity || 0,
    price: sale.productPrice || 0,
    total: (sale.quantity || 0) * (sale.productPrice || 0),
  }));

  const lowStockProducts = safeProducts.filter(p => 
    p.variants?.some(v => v.quantity <= 5)
  );

  const totalRevenue = safeSales.reduce((sum, sale) => {
    const price = sale.productPrice || 0;
    const qty = sale.quantity || 0;
    return sum + (price * qty);
  }, 0);

  const totalSales = safeSales.length;

  const stockValue = safeProducts.reduce((sum, product) => {
    if (!product.variants) return sum;
    return sum + product.variants.reduce((vSum, variant) => {
      if (!variant?.quantity || !product.price) return vSum;
      return vSum + (product.price * variant.quantity);
    }, 0);
  }, 0);

  const topProductCounts = safeSales.reduce((acc, sale) => {
    const productId = sale.productId || sale._id || 'unknown';
    const qty = sale.quantity || 1;
    acc[productId] = (acc[productId] || 0) + qty;
    return acc;
  }, {});

  const topProductId = Object.keys(topProductCounts).length > 0 
    ? Object.keys(topProductCounts).reduce((a, b) => topProductCounts[a] > topProductCounts[b] ? a : b)
    : null;
  const topProductName = topProductId 
    ? safeProducts.find(p => p._id === topProductId)?.name || topProductId || 'Aucun'
    : 'Aucun';
  const topProductQuantity = topProductId ? topProductCounts[topProductId] : 0;

  // Simple pie chart data for modals
  const topProductsPie = {
    options: {
      chart: { type: 'pie', height: 250 },
      labels: ['Top Product', 'Others'],
      colors: ['#f59e0b', '#d1d5db'],
    },
    series: [topProductQuantity, totalSales - topProductQuantity]
  };

  return (
    <div className="stats-cards-container">
      <Row gutter={[24, 24]}>
        {/* Revenue */}
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card 
            className="stats-card revenue-card glass-card"
            hoverable
            onClick={() => onCardClick('revenue', { totalRevenue, revenueData })}
          >
            <DollarOutlined className="card-icon" style={{ color: '#667eea' }} />
            <Title level={5} className="stats-title">Chiffre d'affaires</Title>
            <div className="stats-value">{totalRevenue.toLocaleString('fr-FR')} FCFA</div>
            <Text className="stats-subtitle">Total ventes</Text>
            <Progress 
              className="stats-progress" 
              percent={Math.min((totalRevenue / 5000000) * 100, 100)} 
              strokeColor="#667eea" 
              showInfo={false} 
            />
          </Card>
        </Col>

        {/* Sales */}
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card 
            className="stats-card sales-card glass-card"
            hoverable
            onClick={() => onCardClick('sales', { totalSales, salesData: safeSales.slice(0,10) })}
          >
            <ShoppingCartOutlined className="card-icon" style={{ color: '#10b981' }} />
            <Title level={5} className="stats-title">Ventes</Title>
            <div className="stats-value">{totalSales}</div>
            <Text className="stats-subtitle">Transactions</Text>
            <Progress 
              className="stats-progress" 
              percent={Math.min((totalSales / 100) * 100, 100)} 
              strokeColor="#10b981" 
              showInfo={false} 
            />
          </Card>
        </Col>

        {/* Stock */}
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card 
            className="stats-card stock-card glass-card"
            hoverable
            onClick={() => onCardClick('stock', { stockValue, lowStockProducts, allProducts: safeProducts })}
          >
            <StockOutlined className="card-icon" style={{ color: '#3b82f6' }} />
            <Title level={5} className="stats-title">Stock total</Title>
            <div className="stats-value">{stockValue.toLocaleString('fr-FR')} FCFA</div>
            <Text className="stats-subtitle">{lowStockProducts.length} bas stocks</Text>
            <Progress 
              className="stats-progress" 
              percent={Math.min((stockValue / 3000000) * 100, 100)} 
              strokeColor="#3b82f6" 
              showInfo={false} 
            />
          </Card>
        </Col>

        {/* Top Product */}
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card 
            className="stats-card top-product-card glass-card"
            hoverable
            onClick={() => onCardClick('topProduct', { topProductName, topProductQuantity, pieData: topProductsPie })}
          >
            <TrophyOutlined className="card-icon" style={{ color: '#f59e0b' }} />
            <Title level={5} className="stats-title">Top Produit</Title>
            <div className="stats-value">{topProductName}</div>
            <Text className="stats-subtitle">{topProductQuantity} unités</Text>
            <Progress 
              className="stats-progress" 
              percent={Math.min((topProductQuantity / 50) * 100, 100)} 
              strokeColor="#f59e0b" 
              showInfo={false} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
