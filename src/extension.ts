// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let prevEditor: vscode.TextEditor | undefined = undefined

const TypedFalse = "# typed: false"
const TypedAdopter = "# typed: true adopter"

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

	let output = vscode.window.createOutputChannel("Sorbet Adopter");

	vscode.workspace.onWillSaveTextDocument(async (event) => {
		if (isRubyFile(event.document.fileName)) {
			const range = new vscode.Range(0, 0, 0, TypedAdopter.length)
			const header = event.document.getText(range)
	
			if (header === TypedAdopter) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(event.document.uri, range, TypedFalse)

				event.waitUntil(vscode.workspace.applyEdit(edit))
			}
		}
	})

	vscode.workspace.onDidSaveTextDocument(async (document) => {
		if (isRubyFile(document.fileName)) {
			// We handle this case below
			if (vscode.window.activeTextEditor?.document !== document) {
				output.appendLine(`Active: ${vscode.window.activeTextEditor?.document.fileName}`)
				output.appendLine(`Saved: ${document.fileName}`)
				return
			}

			const range = new vscode.Range(0, 0, 0, TypedFalse.length)
			const header = document.getText(range)
	
			if (header === TypedFalse) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(document.uri, range, TypedAdopter)

				// Give the "saved" feedback before reverting
				setTimeout(async () => {
					await vscode.workspace.applyEdit(edit)
				}, 2000);
			}
		}
	})

	vscode.window.onDidChangeActiveTextEditor(async (editor) => {
		if (!editor) {
			return
		}

		if (prevEditor && isRubyFile(prevEditor.document.fileName)) {
			const range = new vscode.Range(0, 0, 0, TypedAdopter.length)
			const header = prevEditor.document.getText(range)
	
			if (header === TypedAdopter) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(prevEditor.document.uri, range, TypedFalse)

				await vscode.workspace.applyEdit(edit)
				await prevEditor.document.save()
			}			
		}

		if (isRubyFile(editor.document.fileName)) {
			const range = new vscode.Range(0, 0, 0, TypedFalse.length)
			const header = editor.document.getText(range)
	
			if (header === TypedFalse) {
				await editor.edit((editBuilder) => {
					editBuilder.replace(range, TypedAdopter)
				})
			}
		}
		
		output.appendLine(`Editor: ${editor.document.fileName}, Prev Editor: ${prevEditor?.document.fileName}`)

		prevEditor = editor
	})
}

// This method is called when your extension is deactivated
export function deactivate() {}
