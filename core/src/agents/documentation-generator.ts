/**
 * Documentation Generator Agent
 *
 * Generates JSDoc/Docstring comments, README sections,
 * and API documentation from code analysis.
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';
import { DOCUMENTATION_GENERATOR_SYSTEM_PROMPT } from './prompts/documentation-generator';

/**
 * Types of documentation that can be generated
 */
export type DocumentationType =
  | 'jsdoc'
  | 'tsdoc'
  | 'docstring'
  | 'godoc'
  | 'readme'
  | 'api-reference'
  | 'changelog'
  | 'architecture';

/**
 * Documentation target - what to document
 */
export interface DocumentationTarget {
  file: string;
  type: DocumentationType;
  scope?: 'function' | 'class' | 'module' | 'file' | 'project';
  functionName?: string;
  className?: string;
}

/**
 * Generated documentation result
 */
export interface DocumentationResult {
  target: DocumentationTarget;
  content: string;
  insertionPoint?: {
    file: string;
    line: number;
  };
  format: DocumentationType;
  sections: DocumentationSection[];
}

/**
 * A section within a documentation result
 */
export interface DocumentationSection {
  title: string;
  content: string;
  order: number;
}

/**
 * Function signature extracted for documentation
 */
export interface FunctionSignature {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  decorators: string[];
  genericTypes: string[];
}

/**
 * Parameter information for documentation
 */
export interface ParameterInfo {
  name: string;
  type: string;
  description?: string;
  isOptional: boolean;
  defaultValue?: string;
}

/**
 * README template structure
 */
export interface ReadmeTemplate {
  projectName: string;
  sections: ReadmeSection[];
}

/**
 * README section definition
 */
export interface ReadmeSection {
  id: string;
  title: string;
  required: boolean;
  content?: string;
}

/**
 * Standard README sections
 */
export const STANDARD_README_SECTIONS: ReadmeSection[] = [
  { id: 'title', title: 'Project Title', required: true },
  { id: 'description', title: 'Description', required: true },
  { id: 'installation', title: 'Installation', required: true },
  { id: 'quick-start', title: 'Quick Start', required: true },
  { id: 'usage', title: 'Usage', required: false },
  { id: 'api-reference', title: 'API Reference', required: false },
  { id: 'configuration', title: 'Configuration', required: false },
  { id: 'examples', title: 'Examples', required: false },
  { id: 'contributing', title: 'Contributing', required: false },
  { id: 'license', title: 'License', required: true },
];

/**
 * Documentation style configurations by language
 */
export const DOC_STYLES: Record<string, {
  commentStart: string;
  commentEnd: string;
  linePrefix: string;
  paramTag: string;
  returnTag: string;
  throwsTag: string;
  exampleTag: string;
}> = {
  typescript: {
    commentStart: '/**',
    commentEnd: ' */',
    linePrefix: ' * ',
    paramTag: '@param',
    returnTag: '@returns',
    throwsTag: '@throws',
    exampleTag: '@example',
  },
  javascript: {
    commentStart: '/**',
    commentEnd: ' */',
    linePrefix: ' * ',
    paramTag: '@param',
    returnTag: '@returns',
    throwsTag: '@throws',
    exampleTag: '@example',
  },
  python: {
    commentStart: '"""',
    commentEnd: '"""',
    linePrefix: '',
    paramTag: ':param',
    returnTag: ':returns:',
    throwsTag: ':raises',
    exampleTag: 'Example:',
  },
  go: {
    commentStart: '//',
    commentEnd: '',
    linePrefix: '// ',
    paramTag: '',
    returnTag: '',
    throwsTag: '',
    exampleTag: '',
  },
};

export const documentationGeneratorMetadata: AgentMetadata = {
  id: 'documentation-generator',
  name: 'Documentation Generator',
  description: 'Generates JSDoc/Docstring comments, README sections, and API documentation',
  category: 'generation',
  capabilities: [
    'Generate JSDoc and TSDoc comments',
    'Generate Python docstrings',
    'Generate GoDoc comments',
    'Create README sections',
    'Generate API reference documentation',
    'Document function signatures and parameters',
    'Create usage examples',
    'Generate changelog entries',
  ],
  requiredTools: [
    'ast-parser',
    'readFile',
    'file-editor',
    'smart-file-selector',
  ],
  examples: [
    'Generate JSDoc for all functions in this file',
    'Create a README for this project',
    'Document this API endpoint',
    'Add docstrings to this Python module',
    'Generate API reference for this module',
    'What functions are missing documentation?',
  ],
};

export const documentationGeneratorConfig: AgentConfig = {
  id: 'documentation-generator',
  name: 'Documentation Generator',
  description: documentationGeneratorMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.5,
    maxTokens: 4000,
  },
  tools: documentationGeneratorMetadata.requiredTools,
  systemPrompt: DOCUMENTATION_GENERATOR_SYSTEM_PROMPT,
  maxIterations: 12,
  timeout: 90000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};

/**
 * Detect the documentation style based on file extension
 */
export function detectDocStyle(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const styleMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    go: 'go',
  };
  return styleMap[ext] ?? 'typescript';
}

/**
 * Generate a JSDoc/TSDoc comment block for a function
 */
export function generateJSDoc(signature: FunctionSignature, description: string): string {
  const lines: string[] = ['/**'];
  lines.push(` * ${description}`);

  if (signature.genericTypes.length > 0) {
    lines.push(' *');
    for (const generic of signature.genericTypes) {
      lines.push(` * @template ${generic}`);
    }
  }

  if (signature.parameters.length > 0) {
    lines.push(' *');
    for (const param of signature.parameters) {
      const optional = param.isOptional ? ' (optional)' : '';
      const defaultVal = param.defaultValue ? ` - defaults to ${param.defaultValue}` : '';
      const desc = param.description ?? 'TODO: Add description';
      lines.push(
        ` * @param ${param.name} - ${desc}${optional}${defaultVal}`
      );
    }
  }

  if (signature.returnType && signature.returnType !== 'void') {
    lines.push(` * @returns ${signature.returnType}`);
  }

  lines.push(' */');
  return lines.join('\n');
}

/**
 * Generate a Python docstring for a function
 */
export function generateDocstring(signature: FunctionSignature, description: string): string {
  const lines: string[] = ['"""', description];

  if (signature.parameters.length > 0) {
    lines.push('');
    lines.push('Args:');
    for (const param of signature.parameters) {
      const optional = param.isOptional ? ', optional' : '';
      const defaultVal = param.defaultValue ? `. Defaults to ${param.defaultValue}` : '';
      const desc = param.description ?? 'TODO: Add description';
      lines.push(`    ${param.name} (${param.type}${optional}): ${desc}${defaultVal}`);
    }
  }

  if (signature.returnType && signature.returnType !== 'None') {
    lines.push('');
    lines.push('Returns:');
    lines.push(`    ${signature.returnType}: TODO: Add return description`);
  }

  lines.push('"""');
  return lines.join('\n');
}

/**
 * Generate a GoDoc comment for a function
 */
export function generateGoDoc(functionName: string, description: string): string {
  return `// ${functionName} ${description}`;
}

/**
 * Find undocumented functions in a list of signatures
 */
export function findUndocumentedFunctions(
  signatures: FunctionSignature[],
  existingDocs: string[],
): FunctionSignature[] {
  return signatures.filter(sig =>
    sig.isExported && !existingDocs.some(doc => doc.includes(sig.name))
  );
}

/**
 * Generate a table of contents from documentation sections
 */
export function generateTableOfContents(sections: DocumentationSection[]): string {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  return sorted
    .map(s => {
      const anchor = s.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return `- [${s.title}](#${anchor})`;
    })
    .join('\n');
}
