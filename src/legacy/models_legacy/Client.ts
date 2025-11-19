import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  goals?: string[];
  measurements?: {
    height?: number;
    weight?: number;
    bodyFat?: number;
  };
  healthInfo?: {
    medicalConditions?: string;
    medications?: string;
    injuries?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // Asegura que un usuario tenga un solo perfil
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    goals: {
      type: [String]
    },
    measurements: {
      height: Number,
      weight: Number,
      bodyFat: Number
    },
    healthInfo: {
      medicalConditions: String,
      medications: String,
      injuries: String
    }
  },
  { timestamps: true }
);

export default mongoose.model<IClient>('Client', ClientSchema);