const fs = require('fs');
const path = require('path');

// Ruta al logo correcto en client/public/images
const logoPath = path.join(__dirname, '..', 'client', 'public', 'images', 'logo-trainfit.png');
const outputPath = path.join(__dirname, 'correct_logo_base64.txt');

try {
    // Leer el archivo PNG
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Convertir a base64
    const base64String = logoBuffer.toString('base64');
    
    // Crear el data URL
    const dataUrl = `data:image/png;base64,${base64String}`;
    
    // Guardar en archivo
    fs.writeFileSync(outputPath, dataUrl);
    
    console.log('✅ Logo convertido exitosamente!');
    console.log(`📁 Archivo original: ${logoPath}`);
    console.log(`💾 Tamaño del archivo: ${logoBuffer.length} bytes`);
    console.log(`📝 Caracteres base64: ${base64String.length}`);
    console.log(`💾 Data URL guardado en: ${outputPath}`);
    
} catch (error) {
    console.error('❌ Error al convertir el logo:', error.message);
}