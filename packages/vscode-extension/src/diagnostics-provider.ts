/**
 * Diagnostics Provider
 *
 * Converts security-analyzer findings into VS Code Diagnostics
 * that appear in the Problems panel with proper severity levels.
 */

import * as vscode from 'vscode';

export interface SecurityFinding {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  code?: string;
  suggestion?: string;
}

const SEVERITY_MAP: Record<SecurityFinding['severity'], vscode.DiagnosticSeverity> = {
  critical: vscode.DiagnosticSeverity.Error,
  high: vscode.DiagnosticSeverity.Warning,
  medium: vscode.DiagnosticSeverity.Warning,
  low: vscode.DiagnosticSeverity.Information,
  info: vscode.DiagnosticSeverity.Hint,
};

export class ScalixDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('scalix-security');
  }

  /**
   * Set diagnostics from security scan results
   */
  setFindings(findings: SecurityFinding[]): void {
    // Clear previous diagnostics
    this.diagnosticCollection.clear();

    // Group findings by file
    const findingsByFile = new Map<string, SecurityFinding[]>();
    for (const finding of findings) {
      const existing = findingsByFile.get(finding.file) || [];
      existing.push(finding);
      findingsByFile.set(finding.file, existing);
    }

    // Create diagnostics per file
    for (const [filePath, fileFindings] of findingsByFile) {
      const uri = vscode.Uri.file(filePath);
      const diagnostics = fileFindings.map((finding) => this.createDiagnostic(finding));
      this.diagnosticCollection.set(uri, diagnostics);
    }
  }

  /**
   * Parse security scan output into structured findings.
   * Expects output from security-analyzer agent with lines like:
   *   [SEVERITY] file:line - message
   */
  parseSecurityOutput(output: string, basePath: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = output.split('\n');

    const findingRegex = /^\[(\w+)\]\s+(.+?):(\d+)\s*-\s*(.+)$/;
    const suggestionRegex = /^\s+Suggestion:\s*(.+)$/;
    const codeRegex = /^\s+Code:\s*(.+)$/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(findingRegex);
      if (!match) {
        continue;
      }

      const [, severityRaw, file, lineStr, message] = match;
      const severity = this.normalizeSeverity(severityRaw);
      const line = parseInt(lineStr, 10);

      const finding: SecurityFinding = {
        file: file.startsWith('/') ? file : `${basePath}/${file}`,
        line,
        severity,
        message,
      };

      // Check next lines for suggestion and code
      if (i + 1 < lines.length) {
        const sugMatch = lines[i + 1].match(suggestionRegex);
        if (sugMatch) {
          finding.suggestion = sugMatch[1];
          i++;
        }
      }

      if (i + 1 < lines.length) {
        const codeMatch = lines[i + 1].match(codeRegex);
        if (codeMatch) {
          finding.code = codeMatch[1];
          i++;
        }
      }

      findings.push(finding);
    }

    return findings;
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Clear diagnostics for a specific file
   */
  clearFile(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }

  private createDiagnostic(finding: SecurityFinding): vscode.Diagnostic {
    const startLine = Math.max(0, finding.line - 1);
    const endLine = finding.endLine ? Math.max(0, finding.endLine - 1) : startLine;
    const startCol = finding.column ? Math.max(0, finding.column - 1) : 0;
    const endCol = finding.endColumn || 1000;

    const range = new vscode.Range(startLine, startCol, endLine, endCol);
    const severity = SEVERITY_MAP[finding.severity];

    const diagnostic = new vscode.Diagnostic(range, finding.message, severity);
    diagnostic.source = 'Scalix Security';

    if (finding.code) {
      diagnostic.code = finding.code;
    }

    if (finding.suggestion) {
      diagnostic.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(
          new vscode.Location(
            vscode.Uri.file(finding.file),
            range
          ),
          `Suggestion: ${finding.suggestion}`
        ),
      ];
    }

    return diagnostic;
  }

  private normalizeSeverity(raw: string): SecurityFinding['severity'] {
    const lower = raw.toLowerCase();
    if (lower === 'critical' || lower === 'crit') return 'critical';
    if (lower === 'high') return 'high';
    if (lower === 'medium' || lower === 'med') return 'medium';
    if (lower === 'low') return 'low';
    return 'info';
  }
}
