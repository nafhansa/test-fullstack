import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  try {
    const { method, originalUrl, params, query, body, headers } = req;
    // Log a concise summary
    console.log(`RBAC REQUEST -> ${method} ${originalUrl} params=${JSON.stringify(params)} query=${JSON.stringify(query)}`);
    // Log headers of interest
    const interestingHeaders: Record<string, any> = {
      'x-internal-key': headers['x-internal-key'] || headers['X-Internal-Key'] || null,
      authorization: headers['authorization'] || null,
      host: headers['host'] || null,
    };
    console.log('RBAC HEADERS ->', JSON.stringify(interestingHeaders));
    // Log body lightly (avoid huge payloads)
    if (body && Object.keys(body).length > 0) {
      try {
        const safeBody = JSON.stringify(body).slice(0, 1000);
        console.log('RBAC BODY ->', safeBody);
      } catch (e) {
        console.log('RBAC BODY -> <unserializable>');
      }
    }
  } catch (e) {
    // ignore logging failures
    console.error('requestLogger error', e);
  }

  next();
}
