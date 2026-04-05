/**
 * API Client Utilities
 */

import { createClient, Scalix CodeClient } from '@scalix/sdk';

export interface ClientConfig {
  host: string;
  port: string | number;
  debug?: boolean;
}

let cachedClient: Scalix CodeClient | null = null;
let cachedConfig: ClientConfig | null = null;

export function getClient(config: ClientConfig): Scalix CodeClient {
  // Return cached client if config hasn't changed
  if (cachedClient && JSON.stringify(cachedConfig) === JSON.stringify(config)) {
    return cachedClient;
  }

  const baseUrl = `http://${config.host}:${config.port}`;
  cachedClient = createClient({ baseUrl, timeout: 30000 });
  cachedConfig = config;

  return cachedClient;
}

export async function testConnection(config: ClientConfig): Promise<boolean> {
  try {
    const client = getClient(config);
    await client.health();
    return true;
  } catch {
    return false;
  }
}
