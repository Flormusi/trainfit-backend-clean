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
const ProgressSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    weight: {
        type: Number,
        min: [0, 'Weight cannot be negative']
    },
    bodyFat: {
        type: Number,
        min: [0, 'Body fat percentage cannot be negative'],
        max: [100, 'Body fat percentage cannot exceed 100%']
    },
    measurements: {
        chest: {
            type: Number,
            min: [0, 'Measurement cannot be negative']
        },
        waist: {
            type: Number,
            min: [0, 'Measurement cannot be negative']
        },
        hips: {
            type: Number,
            min: [0, 'Measurement cannot be negative']
        },
        thighs: {
            type: Number,
            min: [0, 'Measurement cannot be negative']
        },
        arms: {
            type: Number,
            min: [0, 'Measurement cannot be negative']
        },
        shoulders: {
            type: Number,
            min: [0, 'Measurement cannot be negative']
        }
    },
    photos: [String],
    notes: String
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Progress', ProgressSchema);
