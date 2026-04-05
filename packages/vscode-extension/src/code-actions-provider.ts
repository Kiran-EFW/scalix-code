/**
 * Code Actions Provider
 *
 * Provides quick fix actions for security diagnostics.
 * When Scalix security diagnostics are present, offers
 * "Fix with Scalix" code actions.
 */

import * as vscode from 'vscode';

export class ScalixCodeActionsProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const scalixDiagnostics = context.diagnostics.filter(
      (d) => d.source === 'Scalix Security'
    );

    if (scalixDiagnostics.length === 0) {
      return [];
    }

    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of scalixDiagnostics) {
      // Add "Explain this issue" action
      const explainAction = new vscode.CodeAction(
        `Scalix: Explain "${diagnostic.message}"`,
        vscode.CodeActionKind.QuickFix
      );
      explainAction.command = {
        command: 'scalix.explainCode',
        title: 'Explain with Scalix',
      };
      explainAction.diagnostics = [diagnostic];
      explainAction.isPreferred = false;
      actions.push(explainAction);

      // Add "Scan file for more issues" action (only once)
      if (actions.length <= 2) {
        const scanAction = new vscode.CodeAction(
          'Scalix: Scan entire file for security issues',
          vscode.CodeActionKind.QuickFix
        );
        scanAction.command = {
          command: 'scalix.scanSecurity',
          title: 'Scan Security',
        };
        scanAction.diagnostics = [diagnostic];
        actions.push(scanAction);
      }

      // If the diagnostic has a suggestion in relatedInformation, show it
      if (diagnostic.relatedInformation && diagnostic.relatedInformation.length > 0) {
        const suggestion = diagnostic.relatedInformation[0].message;
        if (suggestion) {
          const suggestAction = new vscode.CodeAction(
            `Scalix: ${suggestion}`,
            vscode.CodeActionKind.QuickFix
          );
          suggestAction.diagnostics = [diagnostic];
          suggestAction.isPreferred = true;
          actions.push(suggestAction);
        }
      }
    }

    return actions;
  }
}
