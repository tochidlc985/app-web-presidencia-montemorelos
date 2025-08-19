const fetch = require('node-fetch');

// URL del servidor backend
const SERVER_URL = 'http://localhost:4000';

// Función para probar una ruta específica
async function testRoute(route, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SERVER_URL}${route}`, options);

    console.log(`Ruta: ${method} ${route}`);
    console.log(`Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('Respuesta:', JSON.stringify(data, null, 2));
    } else {
      console.log('Error:', response.statusText);
    }

    console.log('-----------------------------------');
    return response.ok;
  } catch (error) {
    console.error(`Error al probar ${method} ${route}:`, error.message);
    console.log('-----------------------------------');
    return false;
  }
}

// Función principal para probar todas las rutas
async function testAllRoutes() {
  console.log('Probando conexión al servidor backend...');
  console.log('URL del servidor:', SERVER_URL);
  console.log('===================================');

  // Probar ruta raíz
  await testRoute('/');

  // Probar rutas de API
  await testRoute('/api/login', 'POST', { email: 'test@example.com', password: 'test123' });
  await testRoute('/api/register', 'POST', { nombre: 'Test', email: 'test@example.com', password: 'test123', rol: 'usuario' });
  await testRoute('/api/reportes');
  await testRoute('/api/estadisticas');

  console.log('Pruebas completadas');
}

// Ejecutar las pruebas
testAllRoutes().catch(console.error);