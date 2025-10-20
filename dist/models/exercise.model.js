"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ExerciseSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    muscleGroups: {
        type: [String],
        required: [true, 'Please add at least one muscle group'],
        enum: [
            'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
            'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core',
            'full body', 'cardio'
        ]
    },
    equipment: {
        type: String,
        required: [true, 'Please add equipment type'],
        enum: [
            'bodyweight', 'dumbbell', 'barbell', 'kettlebell', 'resistance band',
            'machine', 'cable', 'medicine ball', 'stability ball', 'other'
        ]
    },
    difficulty: {
        type: String,
        required: [true, 'Please add difficulty level'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    instructions: {
        type: [String],
        default: []
    },
    videoUrl: {
        type: String,
        // Remove or update the regex to be more permissive
        // match: [
        //   /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
        //   'Please use a valid YouTube URL'
        // ]
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Update the creator field to be optional if it exists
    creator: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
}, {
    timestamps: true
});
// Set creator field to match createdBy for compatibility
ExerciseSchema.pre('save', function (next) {
    if (this.isModified('createdBy')) {
        this.creator = this.createdBy;
    }
    next();
});
exports.default = mongoose_1.default.model('Exercise', ExerciseSchema);
