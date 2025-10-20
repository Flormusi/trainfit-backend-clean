"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configurar Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Crear directorio para imágenes de perfil si no existe
const profileImagesDir = path_1.default.join(__dirname, '../../uploads/profile-images');
if (!fs_1.default.existsSync(profileImagesDir)) {
    fs_1.default.mkdirSync(profileImagesDir, { recursive: true });
}
const uploadToCloudinary = async (file) => {
    try {
        console.log('🖼️ Iniciando subida de imagen:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            NODE_ENV: process.env.NODE_ENV,
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
        });
        // Para desarrollo, usar almacenamiento local
        if (process.env.NODE_ENV !== 'production' || !process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'demo') {
            console.log('📁 Usando almacenamiento local');
            // Verificar que el archivo temporal existe
            if (!fs_1.default.existsSync(file.path)) {
                console.error('❌ Archivo temporal no encontrado:', file.path);
                throw new Error('Archivo temporal no encontrado');
            }
            // Generar nombre único para el archivo
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileExtension = path_1.default.extname(file.originalname);
            const newFileName = `profile-${uniqueSuffix}${fileExtension}`;
            const newFilePath = path_1.default.join(profileImagesDir, newFileName);
            console.log('📂 Moviendo archivo de:', file.path, 'a:', newFilePath);
            // Mover archivo a directorio de imágenes de perfil
            fs_1.default.renameSync(file.path, newFilePath);
            // Verificar que el archivo se movió correctamente
            if (!fs_1.default.existsSync(newFilePath)) {
                console.error('❌ Error: archivo no se movió correctamente');
                throw new Error('Error al mover archivo');
            }
            const imageUrl = `http://localhost:5002/uploads/profile-images/${newFileName}`;
            console.log('✅ Imagen guardada localmente:', imageUrl);
            // Retornar URL local
            return imageUrl;
        }
        // Para producción, usar Cloudinary
        const result = await cloudinary_1.v2.uploader.upload(file.path, {
            folder: 'trainfit/profile-images',
            resource_type: 'image',
            transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto' }
            ]
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Error al subir imagen');
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
exports.default = cloudinary_1.v2;
