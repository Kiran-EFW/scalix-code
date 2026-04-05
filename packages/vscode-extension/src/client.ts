import { createClient } from '@scalix/sdk';
import { ScalixConfig, AgentResult, ExecutionContext } from './types';

let cachedClient: ReturnType<typeof createClient> | null = null;
let currentConfig: ScalixConfig | null = null;

export function getScalixClient(config: ScalixConfig) {
  // Reinitialize if config changed
  if (!cachedClient || JSON.stringify(currentConfig) !== JSON.stringify(config)) {
    cachedClient = createClient({
      baseUrl: config.apiUrl,
      apiKey: config.apiKey || undefined,
      timeout: config.timeout,
    });
    currentConfig = config;
  }

  return cachedClient;
}

export async function executeAgent(
  config: ScalixConfig,
  agentId: string,
  input: string,
  context: ExecutionContext
): Promise<AgentResult> {
  const client = getScalixClient(config);

  // Map agent ID to API format if needed
  const mappedAgentId = agentId.startsWith('scalix.') ? agentId.replace('scalix.', '') : agentId;

  try {
    const result = await client.execute({
      agentId: mappedAgentId,
      input,
      context: {
        projectPath: context.projectPath,
        filePath: context.filePath,
        selectedText: context.selectedText,
        language: context.language,
        openFiles: context.openFiles,
      },
    });

    return result as AgentResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to execute agent: ${errorMessage}`);
  }
}

export async function getAgents(config: ScalixConfig) {
  const client = getScalixClient(config);

  try {
    return await client.getAgents();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch agents: ${errorMessage}`);
  }
}

export async function checkServerHealth(config: ScalixConfig): Promise<boolean> {
  try {
    const client = getScalixClient(config);
    // Try a simple request to verify server is up
    await client.getAgents();
    return true;
  } catch {
    return false;
  }
}
