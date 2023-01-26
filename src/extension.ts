// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let prevSaveFile: string | undefined = undefined
let preSaveTask: NodeJS.Timeout | undefined = undefined

const TypedFalse = "# typed: false\n"
const TypedAdopter = "# typed: true adopter\n"
const SigilRange = new vscode.Range(0, 0, 1, 0)

function isRubyFile(fileName: string | undefined) {
	return fileName?.endsWith(".rb")
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	
	let pauseCmd = vscode.commands.registerCommand('sorbet-adopter.pause', () => {
		vscode.window.showInformationMessage('Sorbet Adopter: Paused');
	});
	context.subscriptions.push(pauseCmd);

	let activateCmd = vscode.commands.registerCommand('sorbet-adopter.activate', () => {
		vscode.window.showInformationMessage('Sorbet Adopter: Activated');
	});
	context.subscriptions.push(activateCmd);

	vscode.workspace.onWillSaveTextDocument(async (event) => {
		const document = event.document

		if (isRubyFile(document.fileName)) {
			const header = document.getText(SigilRange)

			prevSaveFile = document.fileName

			clearTimeout(preSaveTask)
			preSaveTask = setTimeout(() => {
				prevSaveFile = undefined
			}, 100)

			if (header === TypedAdopter) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(document.uri, SigilRange, TypedFalse)

				event.waitUntil(vscode.workspace.applyEdit(edit))
			}
		}
	})

	vscode.workspace.onDidChangeTextDocument(async (event) => {
		const document = event.document

		if (isRubyFile(document.fileName)) {	
			if (document.fileName === prevSaveFile) {
				return
			}
	
			const header = document.getText(SigilRange)

			if (header === TypedFalse) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(document.uri, SigilRange, TypedAdopter)

				await vscode.workspace.applyEdit(edit)
			}
		}
	})
}

// This method is called when your extension is deactivated
export function deactivate() {}
