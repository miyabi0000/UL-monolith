import { Request, Response } from 'express';

export const handleHealthCheck = (req: Request, res: Response) => {
  try {
    // Simple health check - in production, this would test LLM service connectivity
    res.json({
      success: true,
      data: {
        isHealthy: true,
        message: 'LLM service is operational',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },
      message: 'Health check completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};