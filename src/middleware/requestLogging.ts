import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function requestLogging(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  const started = process.hrtime.bigint();
  res.setHeader('X-Request-ID', requestId);
  res.on('finish', () => {
    // Only the route template: URLs may contain invitation tokens or OAuth codes.
    const route = typeof req.route?.path === 'string' ? req.route.path : 'unmatched';
    console.info(JSON.stringify({
      requestId, method: req.method, route, status: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6)
    }));
  });
  next();
}
