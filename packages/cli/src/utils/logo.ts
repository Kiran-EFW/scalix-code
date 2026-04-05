/**
 * Scalix Code Logo & Branding
 *
 * ASCII art and text representations of the Scalix Code brand
 */

import chalk from 'chalk';

/**
 * Main Scalix Code ASCII logo (agent/orchestration themed)
 */
export const asciiLogo = `
╔═══════════════════════════════════════════╗
║                                           ║
║      ╔═══════════════════════════════╗    ║
║      ║   🚀 SCALIX CODE 🚀          ║    ║
║      ║  Agent Orchestration Platform ║    ║
║      ╚═══════════════════════════════╝    ║
║                                           ║
║        ◇  ◇  ◇  ◇  ◇  ◇  ◇              ║
║       ◇    ◇    ◇    ◇    ◇  ◇            ║
║      ◇  Multi-Agent Architecture  ◇       ║
║       ◇    ◇    ◇    ◇    ◇  ◇            ║
║        ◇  ◇  ◇  ◇  ◇  ◇  ◇              ║
║                                           ║
║   Production-Ready • Type-Safe • Observable║
║                                           ║
╚═══════════════════════════════════════════╝
`;

/**
 * Compact Scalix Code ASCII logo (for headers)
 */
export const compactLogo = `
    _____ _____    _    _    _
   / ____|_   _|  | |  | |  | |
  | (___   | |    | |__| |  | |
   \\___ \\  | |    |  __  |  | |
   ____) |_| |_   | |  | |  | |____
  |_____/|_____|  |_|  |_|  |_|_____|

  Agent Orchestration Platform
`;

/**
 * Minimal Scalix Code brand text
 */
export const minimalLogo = `
  🚀 SCALIX CODE 🚀
  Agent Orchestration Platform
`;

/**
 * Scalix Code constellation logo (inspired by Scalix World spiral)
 */
export const constellationLogo = `
           ◇
          ◇ ◇
         ◇   ◇
        ◇  ◇  ◇
       ◇   S   ◇
      ◇   C O D E  ◇
       ◇   ◇   ◇
        ◇ ◇ ◇ ◇
         ◇ ◇ ◇
          ◇ ◇
           ◇
`;

/**
 * Agent/Tool themed ASCII art
 */
export const agentLogo = `
    [Agent Orchestration Platform]

    🤖 --[Tool]-- 🤖
     \\           /
      \\         /
       \\       /
        Platform
        /     \\
       /       \\
    🤖 --[Tool]-- 🤖
`;

/**
 * Styled banner with brand colors
 */
export function styledBanner(): void {
  console.log(chalk.cyan(asciiLogo));
}

/**
 * Get colored brand text
 */
export function brandText(text: string): string {
  return chalk.bold.cyan('SCALIX') + ' ' + chalk.bold.blue('CODE');
}

/**
 * Print welcome message with brand styling
 */
export function printWelcome(): void {
  console.log();
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('  SCALIX CODE - Agent Orchestration       ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('  Production-Ready Platform for Agents    ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════╝'));
  console.log();
}

/**
 * Print goodbye message with brand styling
 */
export function printGoodbye(): void {
  console.log();
  console.log(chalk.cyan('Thank you for using') + ' ' + chalk.bold.cyan('SCALIX CODE') + chalk.cyan('! 🚀'));
  console.log();
}

/**
 * Brand color palette
 */
export const brandColors = {
  primary: '#0D6B75',      // Teal (from Scalix World logo)
  secondary: '#06918B',    // Teal variant
  accent: '#45A78F',       // Green accent
  dark: '#08204B',         // Dark blue
  light: '#A8CDCA',        // Light teal
};

/**
 * Brand typography
 */
export const brandTypography = {
  name: 'SCALIX CODE',
  tagline: 'Agent Orchestration Platform for Production',
  description: 'Production-ready, type-safe, observable multi-agent orchestration',
};
