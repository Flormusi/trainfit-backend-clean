"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Crear directorio de uploads si no existe
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configuración de almacenamiento
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        console.log('📂 Multer destination - uploadsDir:', uploadsDir);
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname);
        console.log('📝 Multer filename generado:', filename);
        cb(null, filename);
    }
});
// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
    console.log('🔍 Multer fileFilter - archivo recibido:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
    });
    if (file.mimetype.startsWith('image/')) {
        console.log('✅ Archivo aceptado por fileFilter');
        cb(null, true);
    }
    else {
        console.log('❌ Archivo rechazado por fileFilter - no es imagen');
        cb(new Error('Solo se permiten archivos de imagen'));
    }
};
// Configuración de multer
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: fileFilter
});
exports.default = exports.upload;
