import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Crear directorio para imágenes de perfil si no existe
const profileImagesDir = path.join(__dirname, '../../uploads/profile-images');
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  try {


    // Siempre usar Cloudinary (dev y producción)
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'trainfit/profile-images',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });
    
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image:");
    throw new Error('Error al subir imagen');
  }
};

export default cloudinary;