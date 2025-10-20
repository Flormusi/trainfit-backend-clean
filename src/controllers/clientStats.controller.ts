import { Request, Response, RequestHandler } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

// ✅ Nuevo controlador de stats
export const getClientStats: RequestHandler = async (req, res) => {
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
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};