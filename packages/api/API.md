# Scalix CLAW REST API

Complete REST API for agent orchestration with real-time WebSocket streaming.

## Base URL

```
http://localhost:3000/api
```

## Health Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

### Ready Check
```
GET /ready
```

Response (when healthy):
```json
{
  "status": "healthy",
  "agents": 5,
  "tools": 3,
  "storage": true
}
```

---

## Agent Management

### Create Agent
```
POST /api/agents
Content-Type: application/json

{
  "id": "my-agent",
  "name": "My Agent",
  "description": "An example agent",
  "model": {
    "provider": "anthropic",
    "model": "claude-3-sonnet-20240229"
  },
  "tools": ["echo", "get_current_time"],
  "systemPrompt": "You are a helpful assistant",
  "maxIterations": 10,
  "timeout": 30000
}
```

Response (201):
```json
{
  "id": "my-agent",
  "name": "My Agent",
  "description": "An example agent",
  "model": { "provider": "anthropic", "model": "claude-3-sonnet-20240229" },
  "tools": ["echo", "get_current_time"],
  "systemPrompt": "You are a helpful assistant",
  "createdAt": "2026-04-05T00:00:00.000Z"
}
```

### List Agents
```
GET /api/agents
```

Response:
```json
{
  "agents": [
    {
      "id": "my-agent",
      "name": "My Agent",
      "description": "An example agent",
      "model": { "provider": "anthropic", "model": "claude-3-sonnet-20240229" },
      "tools": ["echo", "get_current_time"]
    }
  ],
  "total": 1
}
```

### Get Agent Details
```
GET /api/agents/:agentId
```

Response:
```json
{
  "id": "my-agent",
  "name": "My Agent",
  "description": "An example agent",
  "model": { "provider": "anthropic", "model": "claude-3-sonnet-20240229" },
  "tools": ["echo", "get_current_time"],
  "systemPrompt": "You are a helpful assistant",
  "maxIterations": 10,
  "timeout": 30000
}
```

### Update Agent
```
PUT /api/agents/:agentId
Content-Type: application/json

{
  "name": "Updated Agent Name",
  "tools": ["echo", "get_current_time", "random_number"],
  "maxIterations": 15
}
```

Response:
```json
{
  "id": "my-agent",
  "name": "Updated Agent Name",
  "description": "An example agent",
  "message": "Agent updated successfully"
}
```

### Delete Agent
```
DELETE /api/agents/:agentId
```

Response:
```json
{
  "id": "my-agent",
  "message": "Agent deleted successfully"
}
```

---

## Execution

### Execute Agent
```
POST /api/executions
Content-Type: application/json

{
  "agentId": "my-agent",
  "input": "What time is it?",
  "context": {
    "userId": "user-123",
    "sessionId": "session-456"
  }
}
```

Response:
```json
{
  "executionId": "exec-789",
  "agentId": "my-agent",
  "status": "completed",
  "output": "It is currently 3:45 PM.",
  "duration": 1250,
  "iterations": 2,
  "toolCalls": [
    {
      "toolName": "get_current_time",
      "arguments": {}
    }
  ],
  "cost": {
    "inputTokens": 150,
    "outputTokens": 50,
    "costUSD": 0.0025
  },
  "startTime": "2026-04-05T00:00:00.000Z",
  "endTime": "2026-04-05T00:00:01.250Z"
}
```

### Get Execution History
```
GET /api/executions/:agentId?limit=10&offset=0
```

Response:
```json
{
  "agentId": "my-agent",
  "total": 5,
  "limit": 10,
  "offset": 0,
  "executions": [
    {
      "executionId": "exec-789",
      "status": "completed",
      "duration": 1250,
      "iterations": 2,
      "toolCalls": 1,
      "cost": { "inputTokens": 150, "outputTokens": 50, "costUSD": 0.0025 }
    }
  ]
}
```

### Get Execution Details
```
GET /api/executions/:agentId/:executionId
```

Response:
```json
{
  "executionId": "exec-789",
  "agentId": "my-agent",
  "status": "completed",
  "output": "It is currently 3:45 PM.",
  "error": null,
  "duration": 1250,
  "iterations": 2,
  "toolCalls": [
    {
      "toolName": "get_current_time",
      "arguments": {},
      "result": "2026-04-05T15:45:00.000Z"
    }
  ],
  "cost": { "inputTokens": 150, "outputTokens": 50, "costUSD": 0.0025 },
  "trace": [
    {
      "name": "Agent Execution",
      "duration": 1250,
      "events": [
        { "name": "LLM Call" },
        { "name": "Tool Execution" }
      ]
    }
  ]
}
```

---

## Observability

### Get Traces
```
GET /api/observability/traces?limit=50&offset=0
```

Response:
```json
{
  "total": 25,
  "limit": 50,
  "offset": 0,
  "traces": [
    {
      "traceId": "trace-123",
      "spans": 5,
      "duration": 1250,
      "status": "success"
    }
  ]
}
```

### Get Trace Details
```
GET /api/observability/traces/:traceId
```

Response:
```json
{
  "traceId": "trace-123",
  "spans": [
    {
      "spanId": "span-1",
      "name": "Agent Execution",
      "parentId": null,
      "startTime": "2026-04-05T00:00:00.000Z",
      "duration": 1250,
      "status": "success",
      "attributes": { "agentId": "my-agent" },
      "events": [
        { "name": "LLM Call", "timestamp": "2026-04-05T00:00:00.100Z" },
        { "name": "Tool Execution", "timestamp": "2026-04-05T00:00:00.500Z" }
      ]
    }
  ],
  "duration": 1250,
  "status": "success"
}
```

### Get Logs
```
GET /api/observability/logs?level=INFO&limit=50&offset=0
```

Response:
```json
{
  "total": 100,
  "limit": 50,
  "offset": 0,
  "logs": [
    {
      "timestamp": "2026-04-05T00:00:00.000Z",
      "level": "INFO",
      "message": "Agent created: my-agent",
      "context": { "agentId": "my-agent" },
      "error": null
    }
  ]
}
```

### Get Metrics
```
GET /api/observability/metrics?metric=agent_execution_duration_ms
```

Response:
```json
{
  "total": 5,
  "metrics": [
    {
      "name": "agent_execution_duration_ms",
      "type": "histogram",
      "value": 1250,
      "labels": { "agentId": "my-agent", "status": "completed" },
      "timestamp": "2026-04-05T00:00:00.000Z"
    }
  ]
}
```

### Get Metrics (Prometheus Format)
```
GET /api/observability/metrics/prometheus
```

Response (text/plain):
```
# HELP agent_execution_duration_ms Agent execution duration in milliseconds
# TYPE agent_execution_duration_ms histogram
agent_execution_duration_ms_bucket{agentId="my-agent",status="completed",le="100"} 0
agent_execution_duration_ms_bucket{agentId="my-agent",status="completed",le="1000"} 1
agent_execution_duration_ms_bucket{agentId="my-agent",status="completed",le="+Inf"} 1
agent_execution_duration_ms_sum{agentId="my-agent",status="completed"} 1250
agent_execution_duration_ms_count{agentId="my-agent",status="completed"} 1
```

### Get Platform Statistics
```
GET /api/observability/stats
```

Response:
```json
{
  "health": {
    "status": "healthy",
    "agents": 1,
    "tools": 3,
    "storage": true
  },
  "stats": {
    "agents": 1,
    "tools": 3,
    "traces": 25,
    "metrics": 150,
    "logs": 500
  },
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

---

## WebSocket API

Connect to WebSocket:
```
ws://localhost:3000
```

### Message Format

All messages follow this structure:
```json
{
  "type": "message_type",
  "requestId": "optional-request-id",
  "data": {},
  "error": "error-message",
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

### Subscribe to Channel

```json
{
  "type": "subscribe",
  "requestId": "req-123",
  "data": {
    "channel": "traces"
  }
}
```

Response:
```json
{
  "type": "subscribed",
  "requestId": "req-123",
  "data": { "channel": "traces" },
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

### Unsubscribe from Channel

```json
{
  "type": "unsubscribe",
  "requestId": "req-124",
  "data": {
    "channel": "traces"
  }
}
```

### Execute Agent (Streaming)

```json
{
  "type": "execute",
  "requestId": "exec-req-1",
  "data": {
    "agentId": "my-agent",
    "input": "What time is it?"
  }
}
```

Response (execution started):
```json
{
  "type": "execution_started",
  "requestId": "exec-req-1",
  "data": {
    "executionId": "exec-789",
    "agentId": "my-agent"
  },
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

Response (execution completed):
```json
{
  "type": "execution_completed",
  "requestId": "exec-req-1",
  "data": {
    "executionId": "exec-789",
    "agentId": "my-agent",
    "status": "completed",
    "output": "It is currently 3:45 PM.",
    "duration": 1250,
    "iterations": 2,
    "toolCalls": 1,
    "cost": { "inputTokens": 150, "outputTokens": 50, "costUSD": 0.0025 }
  },
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

### Ping/Pong (Keep-Alive)

```json
{
  "type": "ping",
  "requestId": "ping-1"
}
```

Response:
```json
{
  "type": "pong",
  "requestId": "ping-1",
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation Error",
  "code": "VALIDATION_ERROR",
  "requestId": "req-123",
  "details": [
    {
      "path": "input",
      "message": "String must contain at least 1 character(s)",
      "code": "too_small"
    }
  ]
}
```

### Not Found (404)
```json
{
  "error": "Agent not found",
  "code": "AGENT_NOT_FOUND",
  "requestId": "req-123",
  "details": { "agentId": "nonexistent" }
}
```

### Internal Error (500)
```json
{
  "error": "Internal Server Error",
  "code": "INTERNAL_ERROR",
  "requestId": "req-123",
  "message": "Detailed error message (only in development)"
}
```

---

## Request Headers

### Standard Headers

- `Content-Type: application/json` - Required for POST/PUT
- `X-Request-ID: uuid` - Optional, auto-generated if not provided

Response headers:
- `X-Request-ID: uuid` - Echoed back for tracing

---

## Rate Limiting

Per-agent rate limits are enforced:
- Default: 10 executions per minute per agent
- Configurable via platform config

Response when limited:
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 5
}
```

---

## Examples

### cURL

```bash
# Create agent
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-agent",
    "name": "My Agent",
    "model": {
      "provider": "anthropic",
      "model": "claude-3-sonnet-20240229"
    },
    "tools": ["echo"]
  }'

# Execute agent
curl -X POST http://localhost:3000/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "my-agent",
    "input": "Hello!"
  }'

# Get platform stats
curl http://localhost:3000/api/observability/stats
```

### JavaScript/Node.js

```typescript
// Create agent
const agent = await fetch('http://localhost:3000/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'my-agent',
    name: 'My Agent',
    model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
    tools: ['echo']
  })
}).then(r => r.json());

// Execute agent
const result = await fetch('http://localhost:3000/api/executions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'my-agent',
    input: 'Hello!'
  })
}).then(r => r.json());
```

### WebSocket

```typescript
// Connect
const ws = new WebSocket('ws://localhost:3000');

// Execute with streaming
ws.send(JSON.stringify({
  type: 'execute',
  requestId: 'exec-1',
  data: {
    agentId: 'my-agent',
    input: 'What time is it?'
  }
}));

// Listen for events
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'execution_completed') {
    console.log('Result:', message.data.output);
  }
});
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |
| 503 | Service Unavailable (unhealthy) |

---

## Authentication (Phase 3B)

Coming soon: API key and OAuth2 authentication
