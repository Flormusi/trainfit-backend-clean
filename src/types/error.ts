export interface CustomError extends Error {
  status?: number;
  code?: string;
  meta?: any;
}