import { Card, Typography, Divider, Tag, Space, Button, Row, Col, QRCode } from 'antd';
import { PrinterOutlined, CopyOutlined } from '@ant-design/icons';
import { useRef } from 'react';

const { Title, Text } = Typography;

const Receipt = ({ sale, onPrint, onClose }) => {
  const receiptRef = useRef();

  const total = sale.quantity * sale.productPrice;
  const date = new Date(sale.date).toLocaleString('fr-FR');

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Reçu de vente\n\nDate: ${date}\nProduit: ${sale.productName}\nType: ${sale.variantType}\nQuantité: ${sale.quantity}\nPrix unitaire: ${sale.productPrice} FCFA\nTOTAL: ${total} FCFA\nVendeur: ${sale.soldBy}`);
    alert('Reçu copié!');
  };

  return (
    <Card 
      title="🧾 Reçu de Vente" 
      ref={receiptRef}
      style={{ maxWidth: '400px', margin: '0 auto' }}
      extra={
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small">Imprimer</Button>
          <Button icon={<CopyOutlined />} onClick={handleCopy} size="small">Copier</Button>
          <Button onClick={onClose} size="small">Fermer</Button>
        </Space>
      }
    >
      <Row gutter={[0, 8]}>
        <Col span={24}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>E-COMMERCE UNCLE</Title>
            <Text type="secondary">Reçu # {sale._id?.slice(-6)}</Text>
          </div>
        </Col>
        <Col span={12}><Text strong>Date:</Text></Col>
        <Col span={12}><Text>{date}</Text></Col>
        <Col span={12}><Text strong>Produit:</Text></Col>
        <Col span={12}><Text>{sale.productName}</Text></Col>
        <Col span={12}><Text strong>Type:</Text></Col>
        <Col span={12}><Tag color="blue">{sale.variantType}</Tag></Col>
        <Col span={12}><Text strong>Qté:</Text></Col>
        <Col span={12}><Text strong>{sale.quantity}</Text></Col>
        <Col span={12}><Text strong>Prix U.:</Text></Col>
        <Col span={12}><Text strong>{sale.productPrice} FCFA</Text></Col>
        <Divider style={{ margin: '12px 0' }} />
        <Col span={24} style={{ textAlign: 'center' }}>
          <Title level={3} style={{ color: 'green', margin: 0 }}>{total} FCFA</Title>
        </Col>
        <Col span={24}>
          <Divider />
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            Vendeur: {sale.soldBy}
          </Text>
          <QRCode 
            value={`Vente ${sale._id} - ${total} FCFA`} 
            size={80} 
            style={{ display: 'block', margin: '16px auto' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default Receipt;
