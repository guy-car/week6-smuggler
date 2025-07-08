import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import aiRoutes from './routes/ai';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate OpenAI API key
if (!process.env['OPENAI_API_KEY']) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * Setup function to mount AI routes on the main server
 * This allows the main game server to include AI functionality
 * without running a separate server process
 */
export function setupOpenAiRoute(app: express.Express): void {
  console.log('🤖 Setting up OpenAI routes...');
  
  // Mount AI routes under /api/ai
  app.use('/api/ai', aiRoutes);
  
  // Add AI-specific health check
  app.get('/api/ai/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'smuggler-ai-integration',
      openaiKey: process.env['OPENAI_API_KEY'] ? '✅ Loaded' : '❌ Missing',
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('✅ OpenAI routes mounted at /api/ai');
  console.log(`🔍 OpenAI API Key: ✅ Loaded and validated`);
}

// Legacy standalone server function (for development/testing)
export function startStandaloneAIServer(port = 3002): express.Express {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Setup AI routes
  setupOpenAiRoute(app);
  
  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Not found',
      path: req.originalUrl 
    });
  });
  
  // Start server
  app.listen(port, () => {
    console.log(`🤖 Standalone AI Server running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/api/ai/health`);
  });
  
  return app;
}

// If this file is run directly, start standalone server for testing
if (require.main === module) {
  startStandaloneAIServer();
} 