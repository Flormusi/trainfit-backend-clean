import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

interface RotationEntry {
  timestamp: string;
  env: string;
  rotated_by: string;
  token_masked: string;
}

function parseLogLine(line: string): RotationEntry | null {
  // Example: 2025-10-14T00:00:00.000Z | env=development | rotated_by=user | token=abcd****wxyz
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 4) return null;
  const timestamp = parts[0];
  const env = parts[1]?.replace('env=', '') || '';
  const rotated_by = parts[2]?.replace('rotated_by=', '') || '';
  const token_masked = parts[3]?.replace('token=', '') || '';
  return { timestamp, env, rotated_by, token_masked };
}

export const getTokenRotations = (req: Request, res: Response) => {
  try {
    const logPath = path.join(__dirname, '../../ops/logs/token_rotation.log');
    if (!fs.existsSync(logPath)) {
      return res.status(200).json({ rotations: [], message: 'No hay registros de rotación aún.' });
    }

    const raw = fs.readFileSync(logPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const recent = lines.slice(-limit);
    const rotations = recent
      .map(parseLogLine)
      .filter((r): r is RotationEntry => r !== null)
      .reverse(); // más reciente primero

    return res.status(200).json({ rotations });
  } catch (err) {
    console.error('Error leyendo historial de rotaciones:', (err as Error).message);
    return res.status(500).json({ message: 'Error interno leyendo historial de rotaciones.' });
  }
};