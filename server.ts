import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateGeminiCareRecommendations } from './server/geminiCareService.ts';
import type { AiCareRequestContext } from './src/types/aiCare.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    const rawKey = process.env.GEMINI_API_KEY?.trim();
    const geminiConfigured = Boolean(rawKey && rawKey !== 'MY_GEMINI_API_KEY');
    res.json({ ok: true, geminiConfigured });
  });

  app.post('/api/care/recommendations', async (req, res) => {
    const body = req.body as { context?: AiCareRequestContext; variationSeed?: unknown } | undefined;
    const context = body?.context;
    const variationSeed =
      typeof body?.variationSeed === 'number' && Number.isFinite(body.variationSeed)
        ? body.variationSeed
        : 0;

    if (
      !context ||
      typeof context !== 'object' ||
      (context.mode !== 'presentation' && context.mode !== 'normal') ||
      !context.recipient ||
      !context.partner
    ) {
      res.status(400).json({
        ok: false,
        errorCode: 'invalid_response',
        message: 'Invalid AI Care request context.',
      });
      return;
    }

    const result = await generateGeminiCareRecommendations(context, variationSeed);
    if (!result.ok) {
      res.status(result.statusCode).json({
        ok: false,
        errorCode: result.errorCode,
        message: result.message,
      });
      return;
    }

    res.json({
      ok: true,
      source: result.source,
      model: result.model,
      generatedAtISO: result.generatedAtISO,
      data: result.data,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DualCharge server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DualCharge server:', err);
  process.exit(1);
});
