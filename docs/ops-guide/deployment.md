# Deployment Guide

## Deployment Options

### Docker Deployment (Recommended)

```bash
# Build the Docker image
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f scalix-code

# Stop services
docker-compose down
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  scalix-code:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=postgresql://postgres:password@db:5432/scalix
      - LOG_LEVEL=info
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=scalix
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Manual Deployment

```bash
# Install production dependencies
pnpm install --production

# Build
pnpm build

# Start
NODE_ENV=production PORT=3000 node dist/index.js
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scalix-code
spec:
  replicas: 3
  selector:
    matchLabels:
      app: scalix-code
  template:
    metadata:
      labels:
        app: scalix-code
    spec:
      containers:
        - name: scalix-code
          image: scalix-org/scalix-code:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: scalix-secrets
                  key: anthropic-api-key
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: scalix-code
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
  selector:
    app: scalix-code
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key |
| `DATABASE_URL` | No | in-memory | PostgreSQL connection string |
| `REDIS_URL` | No | - | Redis connection string |
| `LOG_LEVEL` | No | `info` | Logging level |
| `MAX_CONCURRENT_AGENTS` | No | `10` | Max concurrent agent executions |
| `AGENT_TIMEOUT_MS` | No | `60000` | Default agent timeout |

*At least one LLM provider key is required.

## Health Checks

The `/health` endpoint returns:

```json
{
  "status": "healthy",
  "version": "0.5.0",
  "uptime": 3600,
  "checks": {
    "storage": "ok",
    "llm": "ok"
  }
}
```

## Backup and Recovery

### Database Backup

```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres scalix > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres scalix < backup_20240101.sql
```

### Application State

Agent memories, execution history, and checkpoints are stored in the database. Regular database backups cover all application state.

## Security Hardening

1. Use HTTPS in production (terminate TLS at load balancer)
2. Set strong database passwords
3. Rotate API keys regularly
4. Enable rate limiting
5. Use network policies to restrict access
6. Run containers as non-root user
7. Scan container images for vulnerabilities
