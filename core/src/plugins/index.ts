/**
 * Plugins Module
 *
 * Extensible plugin system for adding agents, commands, skills, and hooks.
 * Learns from Claude Code's successful plugin architecture.
 */

export * from './types';
export * from './loader';

// Re-export implementations
export { PluginLoader, createPlugin } from './loader';
