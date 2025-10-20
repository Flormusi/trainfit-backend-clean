"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientStats = void 0;
// ✅ Nuevo controlador de stats
const getClientStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = {
            completedWorkouts: 10,
            totalHoursTrained: 25,
            totalCaloriesBurned: 5000
        };
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getClientStats = getClientStats;
