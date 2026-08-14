import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Forwards a rejected promise to `next` — Express 4 doesn't do this for async handlers on its own (Express 5 does), so an uncaught rejection here would otherwise crash the process instead of reaching app.ts's error handler. */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
}
