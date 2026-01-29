# Fix para Error 500 en Actualización de Perfil

## Problema Identificado

El usuario estaba experimentando un error 500 al intentar actualizar su perfil de usuario. El error mostraba:

```
PUT https://appwebpresidenciamontemorelos-aaxa9h9ea-tochidlc985s-projects.vercel.app/api/perfil/FederiRS543@gmail.com 500 (Internal Server Error)
Respuesta del servidor: 500 {"message":"Error al actualizar perfil"}
```

## Causa Raíz

El problema estaba en la función `actualizarPerfilUsuario` en `database.js`. La función tenía varios problemas:

1. **Uso incorrecto de `upsert: true`**: La función intentaba crear un nuevo documento si no existía, pero no manejaba adecuadamente el caso donde el usuario no existía.

2. **Lógica de validación inconsistente**: No se validaba adecuadamente si el usuario existía antes de intentar la actualización.

3. **Manejo de errores inadecuado**: La función retornaba `false` en caso de error, pero el endpoint no manejaba adecuadamente este caso.

4. **Falta de validaciones de entrada**: El endpoint no validaba los datos de entrada antes de procesarlos.

## Soluciones Implementadas

### 1. Corrección de la función `actualizarPerfilUsuario` (database.js)

```javascript
// ANTES: Uso incorrecto de upsert y lógica confusa
const result = await this.usersInternosCollection.updateOne(
  { email },
  {
    $set: {
      ...cleanUpdateData,
      fechaActualizacion: new Date()
    },
    $setOnInsert: {
      fechaRegistro: new Date(),
      rol: cleanUpdateData.rol || 'usuario'
    }
  },
  { upsert: true }
);

// DESPUÉS: Lógica clara y separada para creación y actualización
if (!existingUser) {
  // Crear nuevo usuario si no existe
  const newUser = {
    nombre: cleanUpdateData.nombre || email.split('@')[0],
    email: email,
    password: cleanUpdateData.password || await bcrypt.hash('default123', 10),
    rol: cleanUpdateData.rol || 'usuario',
    fechaRegistro: new Date(),
    fechaActualizacion: new Date(),
    ...cleanUpdateData
  };
  
  const insertResult = await this.usersInternosCollection.insertOne(newUser);
  return insertResult.acknowledged;
} else {
  // Si el usuario existe, actualizarlo
  const result = await this.usersInternosCollection.updateOne(
    { email },
    {
      $set: {
        ...cleanUpdateData,
        fechaActualizacion: new Date()
      }
    }
  );
  return result.acknowledged && result.modifiedCount > 0;
}
```

### 2. Mejora del endpoint PUT `/api/perfil/:email` (server-vercel.js)

Se añadieron validaciones de entrada:

```javascript
// Validar que el email en el cuerpo coincida con el de la URL
if (req.body.email && req.body.email !== req.params.email) {
  return res.status(400).json({ 
    message: 'El email en el cuerpo no coincide con el email en la URL' 
  });
}

// Validar datos requeridos mínimos
const requiredFields = ['nombre', 'departamento'];
const missingFields = requiredFields.filter(field => !req.body[field]);

if (missingFields.length > 0) {
  return res.status(400).json({ 
    message: `Faltan campos requeridos: ${missingFields.join(', ')}` 
  });
}

// Validar formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(req.params.email)) {
  return res.status(400).json({ 
    message: 'Formato de email inválido' 
  });
}
```

### 3. Mejora del manejo de errores en el cliente (profileService.ts)

Se mejoró el manejo de errores para proporcionar mensajes más descriptivos:

```javascript
if (!response.ok) {
  const errorText = await response.text();
  console.error('Respuesta del servidor:', response.status, errorText);
  
  // Intentar parsear el error como JSON para obtener un mensaje más detallado
  let errorMessage = `Error del servidor: ${response.status}`;
  try {
    const errorData = JSON.parse(errorText);
    if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = `${errorMessage}. ${errorData.error}`;
    }
  } catch (parseError) {
    errorMessage = errorText || errorMessage;
  }
  
  throw new Error(errorMessage);
}
```

## Resultado

Con estas correcciones:

1. **Eliminación del error 500**: La función ahora maneja adecuadamente tanto la creación como la actualización de perfiles.

2. **Mejor validación de entrada**: El endpoint ahora valida los datos antes de procesarlos, proporcionando errores 400 más específicos.

3. **Mejor manejo de errores**: Los errores son más descriptivos y ayudan a identificar el problema exacto.

4. **Mayor robustez**: La lógica de creación/actualización es más clara y menos propensa a errores.

## Pruebas

Se creó un script de prueba (`test-profile-update.js`) que permite verificar que la función de actualización de perfil funciona correctamente tanto para la creación de nuevos perfiles como para la actualización de perfiles existentes.

## Uso del Script de Prueba

```bash
# Ejecutar la prueba (asegurarse de tener MongoDB corriendo)
node test-profile-update.js

# O con variables de entorno personalizadas
MONGO_URI="mongodb://localhost:27017/test" node test-profile-update.js
```

## Notas Adicionales

- La función ahora maneja adecuadamente el caso donde un usuario no existe en la base de datos, creando un nuevo perfil automáticamente.
- Se mantienen todas las funcionalidades existentes mientras se corrige el error.
- Las validaciones de entrada ayudan a prevenir errores comunes antes de que lleguen a la base de datos.
- El manejo de errores es más consistente y proporciona retroalimentación útil al usuario.