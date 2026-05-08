import 'dotenv/config';
import { generateMissingEmbeddings } from '@/lib/generateEmbeddings';

const limit = process.env.EMBED_BATCH ? parseInt(process.env.EMBED_BATCH, 10) : undefined;

generateMissingEmbeddings(limit)
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
