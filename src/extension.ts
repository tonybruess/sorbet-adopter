// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let prevClosed: string | undefined = undefined
let prevEditor: vscode.TextEditor | undefined = undefined
let paused = false

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
		paused = true
	});
	context.subscriptions.push(pauseCmd);

	let activateCmd = vscode.commands.registerCommand('sorbet-adopter.activate', () => {
		vscode.window.showInformationMessage('Sorbet Adopter: Activated');
		paused = false
	});
	context.subscriptions.push(activateCmd);

	let closeCmd = vscode.commands.registerCommand('sorbet-adopter.close', async () => {
		const document = vscode.window.activeTextEditor?.document

		if (document && !paused && isRubyFile(document.fileName)) {
			const header = document.getText(SigilRange)

			if (header === TypedAdopter) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(document.uri, SigilRange, TypedFalse)

				await vscode.workspace.applyEdit(edit)

				prevClosed = document.fileName
			}
		}

		if (document) {
			await vscode.commands.executeCommand('workbench.action.files.save');
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		} else {
			await vscode.commands.executeCommand('workbench.action.closeWindow');
		}
	});
	context.subscriptions.push(closeCmd);

	vscode.workspace.onWillSaveTextDocument(async (event) => {
		if (paused) {
			return
		}

		const document = event.document

		if (isRubyFile(document.fileName)) {
			const header = document.getText(SigilRange)

			if (header === TypedAdopter) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(document.uri, SigilRange, TypedFalse)

				event.waitUntil(vscode.workspace.applyEdit(edit))
			}
		}
	})

	vscode.workspace.onDidSaveTextDocument(async (document) => {
		if (paused) {
			return
		}

		// If we just closed + saved, ignore
		if (document.fileName === prevClosed) {
			return
		}

		if (isRubyFile(document.fileName)) {
			const header = document.getText(SigilRange)

			if (header === TypedFalse) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(document.uri, SigilRange, TypedAdopter)

				await vscode.workspace.applyEdit(edit)
			}
		}
	})

	vscode.window.onDidChangeActiveTextEditor(async (editor) => {
		if (paused) {
			return
		}

		if (!editor) {
			return
		}

		if (prevEditor && isRubyFile(prevEditor.document.fileName)) {
			const header = prevEditor.document.getText(SigilRange)

			if (header === TypedAdopter) {
				const edit = new vscode.WorkspaceEdit()
				edit.replace(prevEditor.document.uri, SigilRange, TypedFalse)

				await vscode.workspace.applyEdit(edit)
				await prevEditor.document.save()
			}
		}

		if (isRubyFile(editor.document.fileName)) {
			const header = editor.document.getText(SigilRange)

			if (header === TypedFalse) {
				await editor.edit((editBuilder) => {
					editBuilder.replace(SigilRange, TypedAdopter)
				})
			}
		}

		prevEditor = editor
	})
}

// This method is called when your extension is deactivated
export function deactivate() {}
