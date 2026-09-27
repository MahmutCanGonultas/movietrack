import { getRequestListener } from '@hono/node-server';
import { app } from '@/app';

/**
 * Vercel Node.js function entry: a plain (req, res) listener around the Hono
 * app, which is all the old @hono/node-server/vercel adapter did. Bundled into
 * .vercel/output by scripts/build-vercel.mjs.
 */
export default getRequestListener(app.fetch);
