import fetch from 'node-fetch';

const registerUser = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        rol: 'usuario'
      }),
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

registerUser();