const fs = require('fs');
const path = require('path');

// Ruta al logo PNG
const logoPath = path.join(__dirname, '../client/public/images/logo-trainfit.png');

try {
  // Leer el archivo PNG
  const logoBuffer = fs.readFileSync(logoPath);
  
  // Convertir a base64
  const logoBase64 = logoBuffer.toString('base64');
  
  // Crear el data URL completo
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;
  
  console.log('🖼️  Logo convertido a base64 exitosamente!');
  console.log('📏 Tamaño del archivo:', logoBuffer.length, 'bytes');
  console.log('📏 Tamaño base64:', logoBase64.length, 'caracteres');
  console.log('\n🔗 Data URL (primeros 100 caracteres):');
  console.log(logoDataUrl.substring(0, 100) + '...');
  
  // Guardar en un archivo para usar en el email service
  const outputPath = path.join(__dirname, 'logo_base64.txt');
  fs.writeFileSync(outputPath, logoDataUrl);
  
  console.log('\n💾 Base64 guardado en:', outputPath);
  
} catch (error) {
  console.error('❌ Error al convertir el logo:', error.message);
  console.log('📁 Verificando si existe el archivo:', logoPath);
  console.log('📁 Existe:', fs.existsSync(logoPath));
}