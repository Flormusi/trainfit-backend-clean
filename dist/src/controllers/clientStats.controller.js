"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientStats = void 0;
// ✅ Nuevo controlador de stats
const getClientStats = async (req, res) => {
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
};
exports.getClientStats = getClientStats;
