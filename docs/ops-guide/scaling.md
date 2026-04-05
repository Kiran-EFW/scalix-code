# Scaling Guide

## Horizontal Scaling

### Stateless Architecture

Scalix Code agents are stateless during execution. State is persisted to external storage (PostgreSQL, Redis), allowing horizontal scaling by running multiple instances.

### Load Balancing

```nginx
# nginx.conf
upstream scalix-code {
    least_conn;
    server scalix-1:3000;
    server scalix-2:3000;
    server scalix-3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://scalix-code;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
```

### Kubernetes Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: scalix-code-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: scalix-code
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Vertical Scaling

### Resource Recommendations

| Workload | CPU | Memory | Concurrent Agents |
|----------|-----|--------|-------------------|
| Development | 1 core | 512MB | 2 |
| Small team | 2 cores | 2GB | 10 |
| Medium team | 4 cores | 4GB | 25 |
| Large team | 8 cores | 8GB | 50 |
| Enterprise | 16+ cores | 16GB+ | 100+ |

### Memory Optimization

1. **Limit cache sizes**: Adjust `maxSize` in cache configuration
2. **Prune expired entries**: Call `cache.prune()` periodically
3. **Clear agent history**: Limit `executionHistory` retention
4. **Limit metric storage**: Default max is 10,000 metrics

## Database Scaling

### PostgreSQL Connection Pooling

```typescript
// Use connection pooling for production
const poolConfig = {
  min: 5,
  max: 20,
  idleTimeoutMs: 30000,
  connectionTimeoutMs: 5000,
};
```

### Redis Caching Layer

Use Redis for distributed caching across instances:

```typescript
// Cache frequently accessed data in Redis
// Agent memories, tool results, AST parse results
```

## Performance Targets at Scale

| Scale | Agent Latency | Tool Dispatch | Cache Hit Rate |
|-------|--------------|---------------|----------------|
| 10 concurrent | <1s | <50ms | >80% |
| 50 concurrent | <2s | <100ms | >75% |
| 100 concurrent | <5s | <200ms | >70% |
| 500 concurrent | <10s | <500ms | >65% |

## Capacity Planning

### LLM API Costs

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3 Sonnet | $3 | $15 |
| Claude 3 Opus | $15 | $75 |
| GPT-4 | $30 | $60 |
| GPT-3.5 Turbo | $0.50 | $1.50 |
| Gemini 2 Flash | $0.075 | $0.30 |

### Estimating Monthly Costs

```
Monthly cost = (avg_input_tokens * input_rate + avg_output_tokens * output_rate) 
               * executions_per_day * 30 / 1,000,000
```

Example: 100 executions/day, avg 2000 input + 1000 output tokens, Claude 3 Sonnet:
```
Cost = (2000 * $3 + 1000 * $15) * 100 * 30 / 1,000,000
     = ($6 + $15) * 3000 / 1,000,000
     = $63,000 / 1,000,000
     = $0.063/day * 30 = $1.89/month
```

## Best Practices

1. Start with fewer instances and scale based on metrics
2. Use autoscaling for variable workloads
3. Cache aggressively for read-heavy operations
4. Monitor LLM API costs closely
5. Set per-user rate limits to prevent abuse
6. Use connection pooling for database connections
7. Implement circuit breakers for external API calls
