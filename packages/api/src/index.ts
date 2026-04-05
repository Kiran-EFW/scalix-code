/**
 * Scalix CLAW API
 *
 * REST API server for agent orchestration
 */

import { createPlatform } from '@scalix/core';
import { startServer } from './server';

async function main() {
  // Create platform
  const platform = createPlatform({
    debug: process.env.DEBUG === 'true',
    maxAgents: parseInt(process.env.MAX_AGENTS || '1000'),
  });

  // Register built-in tools
  const toolRegistry = platform.getToolRegistry();
  await (toolRegistry as any).registerBuiltins();

  // Start API server
  const port = parseInt(process.env.PORT || '3000');
  const { app, httpServer, close } = await startServer(platform, {
    port,
    host: process.env.HOST || 'localhost',
    debug: process.env.DEBUG === 'true',
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down...');
    await close();
    await platform.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export { startServer } from './server';
export { ApiError, errorHandler } from './middleware/error-handler';
