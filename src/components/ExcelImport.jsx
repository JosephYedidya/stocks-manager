import { useState } from 'react';
import { Upload, Table, Button, message, Space, Typography, Modal } from 'antd';
import * as XLSX from 'xlsx';
import { addProductOffline } from '../api/offlineClient.js';
import { UploadOutlined } from '@ant-design/icons';
import { useOffline } from '../context/OfflineContext.jsx';

const { Title } = Typography;

export default function ExcelImport({ onSuccess }) {
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fullFileData, setFullFileData] = useState(null);
  const { isOnline } = useOffline();

  const handleFileDrop = (file) => {
    console.log('📁 File dropped:', file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let json;
        
        try {
          json = XLSX.utils.sheet_to_json(worksheet);
        } catch {
          json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        }
        
        console.log('📋 Raw:', json.slice(0, 3));
        
        let objectData = [];
        if (Array.isArray(json[0])) {
          objectData = json.slice(1).map(row => {
            if (!row || row.length < 2) return null;
            return {
              name: row[0]?.toString().trim() || '',
              price: parseFloat(row[1]) || 0,
              category: row[2]?.toString().trim() || 'Uncategorized',
              quantity: parseInt(row[3]) || 1,
              variant: row[4]?.toString().trim() || 'Standard'
            };
          });
        } else {
          objectData = json.map(row => ({
            name: row['Nom du Produit'] || row.name || row['Nom'] || '',
            price: parseFloat(row['Prix Unitaire'] || row.price || row['Prix']) || 0,
            category: row.Catégorie || row['Catégorie'] || row.category || 'Uncategorized',
            quantity: parseInt(row['Stock Initial'] || row.quantity || row['Quantité']) || 1,
            variant: row.variant || row.type || 'Standard'
          }));
        }
        
        objectData = objectData.filter(p => p.name && p.name.trim());
        
        console.log('✅ Parsed:', objectData.length, 'products');
        
        const preview = objectData.slice(0, 10);
        setPreviewData(preview);
        setFullFileData(objectData);
        setModalVisible(true);
        
        message.success(`✅ ${objectData.length} produits trouvés`);
      } catch (err) {
        console.error('Parse error:', err);
        message.error('Format Excel invalide');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const columns = [
    { title: 'Nom', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Prix', dataIndex: 'price', key: 'price', width: 100, render: price => price ? `${price} FCFA` : 'N/A' },
    { title: 'Catégorie', dataIndex: 'category', key: 'category', width: 150 },
    { title: 'Quantité', dataIndex: 'quantity', key: 'quantity', width: 100 },
  ];

  const importExcel = async () => {
    if (!fullFileData?.length) return message.error('Aucune donnée');
    
    setLoading(true);
    let success = 0, skipped = 0;
    
    for (const product of fullFileData) {
      if (!product.name.trim() || product.price <= 0) {
        skipped++;
        continue;
      }
      
      try {
        await addProductOffline({
          name: product.name.trim(),
          price: product.price,
          category: product.category || 'Uncategorized',
          variants: [{ type: product.variant || 'Standard', quantity: product.quantity || 1 }]
        });
        success++;
      } catch {
        skipped++;
      }
    }
    
    const status = isOnline ? 'Online' : 'Offline Queue';
    message.success(`${success} ajoutés, ${skipped} ignorés - ${status}`);
    onSuccess?.();
    setModalVisible(false);
    setPreviewData([]);
    setFullFileData(null);
    setLoading(false);
  };

  return (
    <>
      <Upload.Dragger
        accept=".xlsx,.xls"
        customRequest={({ file }) => handleFileDrop(file)}
        multiple={false}
        showUploadList={false}
        height={200}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" size="middle" style={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
          <UploadOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <Title level={4}>Drag & Drop Excel</Title>
          <p>Glissez votre fichier Excel (name, price, category, quantity)</p>
        </Space>
      </Upload.Dragger>
      
      <Modal
        title="Preview Excel"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Annuler
          </Button>,
          <Button key="import" type="primary" onClick={importExcel} loading={loading}>
            Importer {fullFileData?.length || 0} produits
          </Button>
        ]}
        width={1000}
        destroyOnClose
      >
        <Table 
          dataSource={previewData} 
          columns={columns} 
          pagination={false} 
          size="small" 
          rowKey="name"
          scroll={{ y: 400 }}
        />
      </Modal>
    </>
  );
}

