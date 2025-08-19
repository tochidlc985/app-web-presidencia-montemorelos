const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkMongoConnection() {
  console.log('Verificando conexión a MongoDB...');

  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('✅ Conexión a MongoDB establecida correctamente');

    // Verificar si la base de datos existe
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log(`✅ Base de datos encontrada con ${collections.length} colecciones`);

    await client.close();
    console.log('✅ Conexión cerrada correctamente');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.log('Por favor, asegúrate de que MongoDB esté instalado y ejecutándose');
    console.log('También verifica que la URI en el archivo .env.local sea correcta');
  }
}

checkMongoConnection();