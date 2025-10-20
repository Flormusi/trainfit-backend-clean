import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📂 Multer destination - uploadsDir:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📝 Multer filename generado:', filename);
    cb(null, filename);
  }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('🔍 Multer fileFilter - archivo recibido:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  if (file.mimetype.startsWith('image/')) {
    console.log('✅ Archivo aceptado por fileFilter');
    cb(null, true);
  } else {
    console.log('❌ Archivo rechazado por fileFilter - no es imagen');
    cb(new Error('Solo se permiten archivos de imagen'));
  }
};

// Configuración de multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: fileFilter
});

export default upload;