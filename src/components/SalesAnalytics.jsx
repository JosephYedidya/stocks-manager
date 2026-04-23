import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Typography, Select } from 'antd';
import Chart from 'react-apexcharts';
import { CalendarOutlined, PieChartOutlined, BarChartOutlined, AreaChartOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function SalesAnalytics({ sales = [], products = [] }) {
  const [timeRange, setTimeRange] = useState('30d');

  const analyticsData = useMemo(() => {
    if (!sales?.length || !products?.length) {
      return { 
        dailyData: [], 
        topProducts: [], 
        categories: [], 
        revenueData: [] 
      };
    }

    // Helper
    const getProductInfo = (productId) => {
      const product = products.find(p => p._id === productId);
      return {
        name: product?.name || 'Unknown',
        category: product?.category || 'Uncategorized',
        price: product?.price || 0
      };
    };

    // Daily sales
    const dailySales = {};
    sales.forEach(sale => {
      const date = new Date(sale.date).toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + 1;
    });
    const dailyData = Object.keys(dailySales).sort().map(date => [new Date(date).getTime(), dailySales[date]]);

    // Top products
    const productSales = {};
    sales.forEach(sale => {
      const info = getProductInfo(sale.productId);
      productSales[info.name] = (productSales[info.name] || 0) + sale.quantity;
    });
    const topProductsData = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);
    const topProducts = topProductsData.map(([name]) => name);
    const topProductsSeries = topProductsData.map(([, qty]) => qty);

    // Categories
    const categorySales = {};
    sales.forEach(sale => {
      const info = getProductInfo(sale.productId);
      categorySales[info.category] = (categorySales[info.category] || 0) + 1;
    });
    const categories = Object.keys(categorySales).sort();
    const categoriesSeries = categories.map(cat => categorySales[cat]);

    // Revenue (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const revenueData = sales
      .filter(sale => new Date(sale.date) > thirtyDaysAgo)
      .reduce((acc, sale) => {
        const date = new Date(sale.date).toISOString().split('T')[0];
        const revenue = getProductInfo(sale.productId).price * sale.quantity;
        acc[date] = (acc[date] || 0) + revenue;
        return acc;
      }, {});
    const revenueDates = Object.keys(revenueData).sort();
    const revenueTrendData = revenueDates.map(date => [new Date(date).getTime(), revenueData[date]]);

    return { 
      dailyData, 
      topProducts, 
      topProductsSeries, 
      categories, 
      categoriesSeries, 
      revenueTrendData 
    };
  }, [sales, products]);

  const charts = [
    {
      title: 'Ventes quotidiennes',
      icon: <CalendarOutlined />,
      options: {
        chart: { type: 'line', height: 300 },
        stroke: { curve: 'smooth' },
        xaxis: { type: 'datetime' },
        yaxis: { title: { text: 'Ventes' } },
        title: { text: 'Tendances quotidiennes', align: 'center' }
      },
      series: [{ name: 'Ventes', data: analyticsData.dailyData }]
    },
    {
      title: 'Top produits',
      icon: <PieChartOutlined />,
      options: {
        chart: { type: 'pie', height: 300 },
        labels: analyticsData.topProducts,
        legend: { position: 'bottom' }
      },
      series: [analyticsData.topProductsSeries]
    },
    {
      title: 'Ventes par catégorie',
      icon: <BarChartOutlined />,
      options: {
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { columnWidth: '50%' } },
        xaxis: { categories: analyticsData.categories },
        yaxis: { title: { text: 'Nombre de ventes' } }
      },
      series: [{ name: 'Ventes', data: analyticsData.categoriesSeries }]
    },
    {
      title: 'Chiffre d\'affaires (30j)',
      icon: <AreaChartOutlined />,
      options: {
        chart: { type: 'area', height: 300 },
        stroke: { curve: 'smooth' },
        xaxis: { type: 'datetime' },
        yaxis: { title: { text: 'FCFA' } },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.7, opacityTo: 0.3 } }
      },
      series: [{ name: 'Revenu', data: analyticsData.revenueTrendData }]
    }
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3}>📊 Analytics Ventes</Title>
        <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
          <Select.Option value="30d">30 jours</Select.Option>
          <Select.Option value="all">Tout</Select.Option>
        </Select>
      </div>
      <Row gutter={24}>
        {charts.map((chart, index) => (
          chart.series?.[0]?.data?.length > 0 && (
            <Col xs={24} lg={12} xl={12} key={index}>
              <Card className="glass-card" style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  {chart.icon}
                  <Title level={5} style={{ margin: 0 }}>{chart.title}</Title>
                </div>
                <Chart 
                  options={chart.options} 
                  series={chart.series} 
                  type={chart.options.chart.type}
                  height={300}
                />
              </Card>
            </Col>
          )
        ))}
        {charts.every(chart => !chart.series?.[0]?.data?.length) && (
          <Col span={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                📊 Aucune donnée de vente pour afficher les graphiques
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}

