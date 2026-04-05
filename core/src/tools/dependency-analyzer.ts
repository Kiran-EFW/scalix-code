/**
 * Dependency Analyzer Tool
 *
 * Analyze project dependencies, imports, and relationships
 */

import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs';

export const DependencyAnalyzerInputSchema = z.object({
  projectPath: z.string().describe('Root path of the project'),
  type: z.enum(['npm', 'python', 'go', 'all']).optional().describe('Type of dependencies to analyze'),
});

export type DependencyAnalyzerInput = z.infer<typeof DependencyAnalyzerInputSchema>;

export interface Dependency {
  name: string;
  version?: string;
  type?: 'production' | 'development' | 'peer';
  source?: string;
}

export interface DependencyAnalysisResult {
  success: boolean;
  projectPath: string;
  type: string;
  dependencies: Dependency[];
  devDependencies: Dependency[];
  peerDependencies: Dependency[];
  externalDeps: string[]; // External packages used
  internalDeps: string[]; // Internal module dependencies
  circularDeps: string[][]; // Circular dependency chains
  error?: string;
}

/**
 * Analyze project dependencies
 */
export class DependencyAnalyzer {
  /**
   * Analyze npm dependencies from package.json
   */
  private analyzeNpmDependencies(projectPath: string): DependencyAnalysisResult {
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: true,
          projectPath,
          type: 'npm',
          dependencies: [],
          devDependencies: [],
          peerDependencies: [],
          externalDeps: [],
          internalDeps: [],
          circularDeps: [],
          error: 'No package.json found',
        };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const dependencies: Dependency[] = Object.entries(packageJson.dependencies || {}).map(
        ([name, version]) => ({
          name,
          version: version as string,
          type: 'production',
        })
      );

      const devDependencies: Dependency[] = Object.entries(
        packageJson.devDependencies || {}
      ).map(([name, version]) => ({
        name,
        version: version as string,
        type: 'development',
      }));

      const peerDependencies: Dependency[] = Object.entries(
        packageJson.peerDependencies || {}
      ).map(([name, version]) => ({
        name,
        version: version as string,
        type: 'peer',
      }));

      const allDeps = [...dependencies, ...devDependencies, ...peerDependencies];
      const externalDeps = allDeps.map(d => d.name);

      return {
        success: true,
        projectPath,
        type: 'npm',
        dependencies,
        devDependencies,
        peerDependencies,
        externalDeps,
        internalDeps: [],
        circularDeps: [],
      };
    } catch (error) {
      return {
        success: false,
        projectPath,
        type: 'npm',
        dependencies: [],
        devDependencies: [],
        peerDependencies: [],
        externalDeps: [],
        internalDeps: [],
        circularDeps: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Analyze Python dependencies from requirements.txt or setup.py
   */
  private analyzePythonDependencies(projectPath: string): DependencyAnalysisResult {
    const requirementsPath = path.join(projectPath, 'requirements.txt');

    try {
      if (!fs.existsSync(requirementsPath)) {
        return {
          success: true,
          projectPath,
          type: 'python',
          dependencies: [],
          devDependencies: [],
          peerDependencies: [],
          externalDeps: [],
          internalDeps: [],
          circularDeps: [],
          error: 'No requirements.txt found',
        };
      }

      const content = fs.readFileSync(requirementsPath, 'utf-8');
      const dependencies: Dependency[] = content
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
          const match = line.match(/^([a-zA-Z0-9\-_.]+)([=><!~].*)?/);
          return {
            name: match?.[1] || line,
            version: match?.[2],
            type: 'production' as const,
          };
        });

      return {
        success: true,
        projectPath,
        type: 'python',
        dependencies,
        devDependencies: [],
        peerDependencies: [],
        externalDeps: dependencies.map(d => d.name),
        internalDeps: [],
        circularDeps: [],
      };
    } catch (error) {
      return {
        success: false,
        projectPath,
        type: 'python',
        dependencies: [],
        devDependencies: [],
        peerDependencies: [],
        externalDeps: [],
        internalDeps: [],
        circularDeps: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Analyze Go dependencies from go.mod
   */
  private analyzeGoDependencies(projectPath: string): DependencyAnalysisResult {
    const goModPath = path.join(projectPath, 'go.mod');

    try {
      if (!fs.existsSync(goModPath)) {
        return {
          success: true,
          projectPath,
          type: 'go',
          dependencies: [],
          devDependencies: [],
          peerDependencies: [],
          externalDeps: [],
          internalDeps: [],
          circularDeps: [],
          error: 'No go.mod found',
        };
      }

      const content = fs.readFileSync(goModPath, 'utf-8');
      const dependencies: Dependency[] = [];

      const lines = content.split('\n');
      let inRequire = false;

      for (const line of lines) {
        if (line.startsWith('require')) {
          inRequire = true;
          continue;
        }
        if (inRequire && line.startsWith(')')) {
          break;
        }
        if (inRequire && line.trim()) {
          const match = line.trim().match(/^(.+?)\s+(.+?)(?:\s+\/\/.*)?$/);
          if (match) {
            dependencies.push({
              name: match[1],
              version: match[2],
              type: 'production',
            });
          }
        }
      }

      return {
        success: true,
        projectPath,
        type: 'go',
        dependencies,
        devDependencies: [],
        peerDependencies: [],
        externalDeps: dependencies.map(d => d.name),
        internalDeps: [],
        circularDeps: [],
      };
    } catch (error) {
      return {
        success: false,
        projectPath,
        type: 'go',
        dependencies: [],
        devDependencies: [],
        peerDependencies: [],
        externalDeps: [],
        internalDeps: [],
        circularDeps: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Analyze all dependency types
   */
  analyzeAll(projectPath: string): DependencyAnalysisResult {
    const npmResult = this.analyzeNpmDependencies(projectPath);
    const pythonResult = this.analyzePythonDependencies(projectPath);
    const goResult = this.analyzeGoDependencies(projectPath);

    return {
      success: npmResult.success || pythonResult.success || goResult.success,
      projectPath,
      type: 'all',
      dependencies: [...npmResult.dependencies, ...pythonResult.dependencies, ...goResult.dependencies],
      devDependencies: npmResult.devDependencies,
      peerDependencies: npmResult.peerDependencies,
      externalDeps: [
        ...npmResult.externalDeps,
        ...pythonResult.externalDeps,
        ...goResult.externalDeps,
      ],
      internalDeps: [],
      circularDeps: [],
    };
  }

  /**
   * Main analyze method
   */
  analyze(input: DependencyAnalyzerInput): DependencyAnalysisResult {
    const type = input.type || 'npm';

    switch (type) {
      case 'npm':
        return this.analyzeNpmDependencies(input.projectPath);
      case 'python':
        return this.analyzePythonDependencies(input.projectPath);
      case 'go':
        return this.analyzeGoDependencies(input.projectPath);
      case 'all':
        return this.analyzeAll(input.projectPath);
      default:
        return this.analyzeAll(input.projectPath);
    }
  }
}

/**
 * Create dependency analyzer tool
 */
export function createDependencyAnalyzerTool() {
  const analyzer = new DependencyAnalyzer();

  return {
    name: 'dependency-analyzer',
    description: 'Analyze project dependencies and imports',
    schema: DependencyAnalyzerInputSchema,
    async execute(input: DependencyAnalyzerInput): Promise<DependencyAnalysisResult> {
      return analyzer.analyze(input);
    },
  };
}
