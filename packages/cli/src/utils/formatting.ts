/**
 * Terminal Formatting Utilities
 */

import chalk from 'chalk';
import { table, TableUserConfig } from 'table';

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function warning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function header(message: string): void {
  console.log('\n' + chalk.bold.cyan(message));
  console.log(chalk.cyan('='.repeat(message.length)));
}

export function subheader(message: string): void {
  console.log('\n' + chalk.bold(message));
}

export function highlight(text: string): string {
  return chalk.bold.cyan(text);
}

export function dim(text: string): string {
  return chalk.dim(text);
}

export function formatTable(
  data: string[][],
  options?: TableUserConfig
): string {
  return table(data, {
    border: ['light'],
    ...options,
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatCost(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

export function formatStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return chalk.green(status);
    case 'failed':
    case 'error':
      return chalk.red(status);
    case 'running':
    case 'pending':
      return chalk.yellow(status);
    default:
      return status;
  }
}
