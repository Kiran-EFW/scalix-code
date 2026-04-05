/**
 * WebSocket Client Example
 *
 * Shows how to use WebSocket for real-time agent execution and streaming
 */

import WebSocket from 'ws';

async function main() {
  console.log('🚀 Scalix Code - WebSocket Client Example\n');

  const ws = new WebSocket('ws://localhost:3000');
  let connected = false;

  // Connection events
  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    connected = true;

    // Wait a moment then execute agent
    setTimeout(() => executeAgent(), 500);
  });

  ws.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString());
    handleMessage(message);
  });

  ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
    process.exit(0);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    process.exit(1);
  });

  // Send execute message
  function executeAgent() {
    console.log('🤖 Executing agent via WebSocket...\n');

    const message = {
      type: 'execute',
      requestId: 'exec-1',
      data: {
        agentId: 'my-agent',
        input: 'What is the current time?',
      },
    };

    ws.send(JSON.stringify(message));
  }

  // Handle incoming messages
  function handleMessage(message: any) {
    const { type, requestId, data, error, timestamp } = message;

    switch (type) {
      case 'connected':
        console.log('📡 Server says: Welcome!');
        console.log(`   Connection ID: ${data.connectionId}`);
        console.log();
        break;

      case 'execution_started':
        console.log('⚡ Execution started');
        console.log(`   Execution ID: ${data.executionId}`);
        console.log(`   Agent ID: ${data.agentId}`);
        console.log();
        break;

      case 'execution_completed':
        console.log('✅ Execution completed!');
        console.log(`   Status: ${data.status}`);
        console.log(`   Duration: ${data.duration}ms`);
        console.log(`   Iterations: ${data.iterations}`);
        console.log(`   Tool Calls: ${data.toolCalls}`);
        console.log(`   Output: ${data.output}`);
        console.log(`   Cost: $${data.cost.costUSD.toFixed(4)}`);
        console.log();

        // Close connection after completion
        console.log('🛑 Closing connection...');
        ws.close();
        break;

      case 'execution_error':
        console.error('❌ Execution error:', data.error);
        ws.close();
        break;

      case 'subscribed':
        console.log('📢 Subscribed to channel:', data.channel);
        break;

      case 'unsubscribed':
        console.log('📢 Unsubscribed from channel:', data.channel);
        break;

      case 'pong':
        console.log('🏓 Pong received');
        break;

      case 'error':
        console.error('❌ Server error:', error);
        break;

      default:
        console.log(`📨 Message [${type}]:`, data);
    }
  }
}

main().catch(console.error);
