/**
 * AST Parser Tool
 *
 * Parse code files to Abstract Syntax Trees for analysis
 * Supports TypeScript, JavaScript, Python, and more
 */

import { Project } from 'ts-morph';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { z } from 'zod';

export const ASTParserInputSchema = z.object({
  filePath: z.string().describe('Path to file to parse'),
  language: z.enum(['typescript', 'javascript', 'python', 'auto']).optional().describe('Programming language'),
});

export type ASTParserInput = z.infer<typeof ASTParserInputSchema>;

export interface ASTNode {
  type: string;
  name?: string;
  line?: number;
  column?: number;
  children?: ASTNode[];
}

export interface ASTParseResult {
  success: boolean;
  filePath: string;
  language: string;
  tree?: ASTNode;
  functions?: string[];
  classes?: string[];
  imports?: string[];
  exports?: string[];
  error?: string;
}

/**
 * Parse TypeScript/JavaScript files using ts-morph
 */
export class ASTParser {
  private project: Project;

  constructor() {
    this.project = new Project({
      compilerOptions: {
        target: undefined,
        module: undefined,
      },
    });
  }

  /**
   * Parse a TypeScript/JavaScript file
   */
  parseTypeScript(filePath: string): ASTParseResult {
    try {
      const sourceFile = this.project.addSourceFileAtPath(filePath);
      const functions: string[] = [];
      const classes: string[] = [];
      const imports: string[] = [];
      const exports: string[] = [];

      // Extract function declarations
      sourceFile.getFunctions().forEach(fn => {
        const name = fn.getName();
        if (name) {
          functions.push(name);
        }
      });

      // Extract class declarations
      sourceFile.getClasses().forEach(cls => {
        const name = cls.getName();
        if (name) {
          classes.push(name);
        }
      });

      // Extract imports
      sourceFile.getImportDeclarations().forEach(imp => {
        imports.push(imp.getModuleSpecifierValue());
      });

      // Extract exports
      sourceFile.getExportDeclarations().forEach(exp => {
        exports.push(exp.getModuleSpecifierValue());
      });

      return {
        success: true,
        filePath,
        language: 'typescript',
        functions,
        classes,
        imports,
        exports,
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        language: 'typescript',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse JavaScript/Python files using Babel
   */
  parseBabel(filePath: string, language: 'javascript' | 'python' = 'javascript'): ASTParseResult {
    try {
      const fs = require('fs');
      const code = fs.readFileSync(filePath, 'utf-8');

      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'flow',
          ['decorators', { decoratorsBeforeExport: false }],
        ],
      });

      const functions: string[] = [];
      const classes: string[] = [];
      const imports: string[] = [];
      const exports: string[] = [];

      // Traverse AST to extract information
      traverse.default(ast, {
        FunctionDeclaration(path: any) {
          if (path.node.id?.name) {
            functions.push(path.node.id.name);
          }
        },
        ArrowFunctionExpression(path: any) {
          // Get function name if assigned
          if (path.parent?.type === 'VariableDeclarator' && (path.parent as any).id?.type === 'Identifier') {
            functions.push((path.parent as any).id.name);
          }
        },
        ClassDeclaration(path: any) {
          if (path.node.id?.name) {
            classes.push(path.node.id.name);
          }
        },
        ImportDeclaration(path: any) {
          imports.push(path.node.source.value);
        },
        ExportNamedDeclaration(path: any) {
          if (path.node.source) {
            exports.push(path.node.source.value);
          }
        },
        ExportDefaultDeclaration(path: any) {
          if ((path.node.declaration as any)?.type === 'Identifier') {
            exports.push(`default: ${(path.node.declaration as any).name}`);
          }
        },
      });

      return {
        success: true,
        filePath,
        language,
        functions,
        classes,
        imports,
        exports,
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Auto-detect language and parse
   */
  parse(input: ASTParserInput): ASTParseResult {
    const language = input.language || this.detectLanguage(input.filePath);

    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.parseTypeScript(input.filePath);
      case 'python':
        return this.parseBabel(input.filePath, 'python');
      case 'auto':
      default:
        // Try TypeScript first, fall back to Babel
        const tsResult = this.parseTypeScript(input.filePath);
        if (tsResult.success) {
          return tsResult;
        }
        return this.parseBabel(input.filePath, 'javascript');
    }
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return 'typescript';
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      return 'javascript';
    }
    if (filePath.endsWith('.py')) {
      return 'python';
    }
    return 'javascript';
  }
}

/**
 * Create AST parser tool
 */
export function createASTParserTool() {
  const parser = new ASTParser();

  return {
    name: 'ast-parser',
    description: 'Parse code files to Abstract Syntax Trees for analysis',
    schema: ASTParserInputSchema,
    async execute(input: ASTParserInput): Promise<ASTParseResult> {
      return parser.parse(input);
    },
  };
}
