/*
  Script de Diagnóstico - Verificar se o servidor está salvando dados no SQLite
  Execute no Console do navegador (F12 -> Console) quando estiver em http://localhost:3000
*/

async function testServerConnection() {
  console.log('🔍 Iniciando testes de conexão com servidor...\n');

  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch('http://10.30.10.140:3000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Servidor respondeu:', healthData);
    console.log('');

    // Teste 2: Carregar dados existentes
    console.log('2️⃣ Carregando dados existentes...');
    const loadResponse = await fetch('http://10.30.10.140:3000/api/data');
    const loadData = await loadResponse.json();
    console.log('✅ Dados carregados:', loadData);
    console.log('');

    // Teste 3: Criar novo registro
    console.log('3️⃣ Criando novo cliente de teste...');
    const testRecord = {
      type: 'client',
      client_name: 'CLIENTE TEST ' + Date.now(),
      created_at: new Date().toISOString(),
      title: '',
      content: '',
      client_id: '',
      client_id: '',
      file_name: '',
      file_data: '',
      photo_description: '',
      video_description: '',
      os_title: '',
      os_date: '',
      os_solicitante: '',
      os_description: '',
      os_video_file: '',
      os_video_name: '',
      os_archived: false,
      os_archived_by: '',
      os_archived_date: '',
      os_produced: false,
      os_produced_by: '',
      os_produced_date: '',
      os_material_separated: false,
      os_material_by: '',
      os_material_date: '',
      os_completed: false,
      os_completed_by: '',
      os_completed_date: '',
      os_finalized: false,
      os_finalized_by: '',
      os_finalized_date: '',
      os_finalized_video: '',
      os_finalized_video_name: ''
    };

    const createResponse = await fetch('http://10.30.10.140:3000/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRecord)
    });

    const createData = await createResponse.json();
    console.log('✅ Registro criado:', createData);
    console.log('');

    // Teste 4: Verificar se foi salvo
    console.log('4️⃣ Verificando se foi salvo...');
    const verifyResponse = await fetch('http://10.30.10.140:3000/api/data');
    const verifyData = await verifyResponse.json();
    console.log('✅ Total de registros no servidor:', verifyData.data.length);
    console.log('Registros:', verifyData.data);
    console.log('');

    console.log('🎉 Todos os testes completados!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar testes
testServerConnection();
