/**
 * Marketplace Database Schema
 *
 * PostgreSQL schema for the Scalix Code community marketplace.
 * Includes agents registry, versions, reviews, ratings, and analytics.
 */

export const schema = `
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  namespace VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  long_description TEXT,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'published',

  -- Agent capabilities
  capabilities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  required_tools TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  supported_languages TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Author information
  author_id UUID NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255),

  -- Repository
  repository_url VARCHAR(512),
  documentation_url VARCHAR(512),
  homepage_url VARCHAR(512),

  -- Stats
  downloads INT DEFAULT 0,
  stars INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  review_count INT DEFAULT 0,

  -- Icons & metadata
  icon_url VARCHAR(512),
  banner_url VARCHAR(512),
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  license VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,

  -- Soft delete
  deleted_at TIMESTAMP,

  -- Indexing
  CONSTRAINT status_check CHECK (status IN ('draft', 'published', 'deprecated', 'archived')),
  CONSTRAINT rating_check CHECK (rating >= 0 AND rating <= 5)
);

-- Agent versions
CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  semver_major INT NOT NULL,
  semver_minor INT NOT NULL,
  semver_patch INT NOT NULL,

  -- Version content
  code_url VARCHAR(512) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  manifest JSONB NOT NULL,

  -- Metadata
  release_notes TEXT,
  breaking_changes TEXT,
  migration_guide TEXT,

  -- Downloads
  downloads INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  deprecated_at TIMESTAMP,

  -- Unique constraint per agent version
  UNIQUE(agent_id, version),
  CONSTRAINT version_format CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+')
);

-- Agent reviews and ratings
CREATE TABLE IF NOT EXISTS agent_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name VARCHAR(255) NOT NULL,

  -- Review content
  title VARCHAR(255),
  body TEXT,
  rating INT NOT NULL,

  -- Verification
  verified_install BOOLEAN DEFAULT FALSE,
  install_date TIMESTAMP,

  -- Engagement
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,

  -- Moderation
  status VARCHAR(50) DEFAULT 'pending',
  reported_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected', 'removed'))
);

-- Agent installation analytics
CREATE TABLE IF NOT EXISTS agent_installs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,

  -- Installation metadata
  user_id UUID,
  environment VARCHAR(100),
  os_platform VARCHAR(50),
  node_version VARCHAR(20),

  -- Tracking
  install_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uninstall_date TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Usage
  last_used TIMESTAMP,
  usage_count INT DEFAULT 0,

  -- Indexing for analytics
  CONSTRAINT os_check CHECK (os_platform IN ('macos', 'linux', 'windows'))
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,

  -- Profile
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(512),

  -- Settings
  public_profile BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,

  -- Account status
  status VARCHAR(50) DEFAULT 'active',
  role VARCHAR(50) DEFAULT 'user',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,

  CONSTRAINT status_check CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
  CONSTRAINT role_check CHECK (role IN ('user', 'moderator', 'admin'))
);

-- API tokens for authentication
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255),

  -- Scopes and permissions
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Rate limiting
  rate_limit_per_hour INT DEFAULT 1000,
  requests_this_hour INT DEFAULT 0,

  -- Security
  ip_whitelist TEXT[],

  -- Lifecycle
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_used TIMESTAMP,

  CONSTRAINT rate_limit_check CHECK (rate_limit_per_hour > 0)
);

-- Community governance - Featured agents
CREATE TABLE IF NOT EXISTS featured_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  featured_by_id UUID NOT NULL REFERENCES users(id),

  -- Curation
  reason TEXT,
  category VARCHAR(100),
  priority INT DEFAULT 0,

  -- Duration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,

  UNIQUE(agent_id)
);

-- Community governance - Reports (spam, abuse)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_id UUID NOT NULL,
  reported_type VARCHAR(50) NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users(id),

  -- Report content
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  evidence_urls TEXT[],

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  resolution TEXT,
  resolved_by_id UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,

  CONSTRAINT reported_type_check CHECK (reported_type IN ('agent', 'review', 'user')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  CONSTRAINT reason_check CHECK (reason IN ('spam', 'abuse', 'copyright', 'malware', 'other'))
);

-- Analytics - Trending agents
CREATE TABLE IF NOT EXISTS trending_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Metrics
  score DECIMAL(10,2) NOT NULL,
  downloads_7d INT DEFAULT 0,
  downloads_30d INT DEFAULT 0,
  new_reviews_7d INT DEFAULT 0,

  -- Calculated
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(agent_id, calculated_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_namespace ON agents(namespace);
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_author_id ON agents(author_id);
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_name_trgm ON agents USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_agents_keywords_idx ON agents USING gin (keywords);

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent_id ON agent_versions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_version ON agent_versions(version);
CREATE INDEX IF NOT EXISTS idx_agent_versions_created ON agent_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_agent_id ON agent_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON agent_reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON agent_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON agent_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_installs_agent_id ON agent_installs(agent_id);
CREATE INDEX IF NOT EXISTS idx_installs_user_id ON agent_installs(user_id);
CREATE INDEX IF NOT EXISTS idx_installs_date ON agent_installs(install_date);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token_hash ON api_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_featured_agents_agent_id ON featured_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_featured_agents_expires ON featured_agents(expires_at);

-- Create updated_at trigger for agents
CREATE OR REPLACE FUNCTION update_agents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_timestamp
BEFORE UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION update_agents_timestamp();

-- Create updated_at trigger for reviews
CREATE OR REPLACE FUNCTION update_reviews_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_timestamp
BEFORE UPDATE ON agent_reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_timestamp();

-- Create updated_at trigger for users
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();
`;

export default schema;
