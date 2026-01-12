import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Middleware to add a unique request ID to each request.
 * This ID can be used for request tracing across logs and services.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Use existing request ID from header if provided, otherwise generate new one
    const requestId = (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string) || uuidv4();

    // Set request ID on request object for access in handlers
    (req as any).requestId = requestId;

    // Set response header so client can correlate responses
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
