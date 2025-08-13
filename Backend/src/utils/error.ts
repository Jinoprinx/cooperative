
import { Response } from 'express';

export const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error);
  res.status(500).json({ message });
};
