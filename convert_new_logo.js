const fs = require('fs');
const path = require('path');

// Ruta al nuevo logo
const logoPath = path.join(__dirname, '../client/public/images/trainfit-logo-new.png');

try {
  // Leer el archivo de imagen
  const imageBuffer = fs.readFileSync(logoPath);
  
  // Convertir a base64
  const base64String = imageBuffer.toString('base64');
  
  // Crear el Data URL
  const dataUrl = `data:image/png;base64,${base64String}`;
  
  // Guardar en archivo
  fs.writeFileSync(path.join(__dirname, 'new_logo_base64.txt'), dataUrl);
  
  console.log('✅ Nuevo logo convertido a base64 exitosamente');
  console.log(`📏 Tamaño del archivo: ${imageBuffer.length} bytes`);
  console.log(`📝 Caracteres base64: ${base64String.length}`);
  console.log('💾 Data URL guardado en: new_logo_base64.txt');
  
} catch (error) {
  console.error('❌ Error al convertir el logo:', error.message);
}