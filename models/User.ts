import mongoose, { Schema, Document } from 'mongoose';

// Define y exporta el tipo Role
export type Role = 'trainer' | 'client' | 'admin';

// Define la interfaz para el documento de Usuario
export interface IUser extends Document { 
  email: string;
  password: string; // La interfaz IUser todavía necesita la contraseña para el modelo
  role: Role; // Usa el tipo Role
  // ... otros campos que puedas necesitar
}

// NUEVA INTERFAZ para el objeto de usuario simplificado
export interface IUserProfile {
  _id: string; // o mongoose.Types.ObjectId si prefieres
  email: string;
  role: Role; // Usa el tipo Role
  // Agrega aquí cualquier otra propiedad de IUser que quieras exponer en req.user
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Por favor ingrese un correo válido']
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['trainer', 'client', 'admin'], // Mongoose enum sigue siendo útil para validación en BD
    default: 'client'
  },
  // Define otros campos aquí
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);