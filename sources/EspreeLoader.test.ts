import { assert, assertExists, assertRejects } from "../dependencies/std/assert.ts";
import * as path from "../dependencies/std/path.ts"

import { Walker } from "../dependencies/magiked.ts"

import type { JavascriptPayload } from "./EspreeLoader.ts"
import { defaultJavascriptLoader } from "./EspreeLoader.ts"

const DATA_BASE_PATH = "tests/data"


Deno.test("loaders, default loaders (js, es modules)", async () =>
{
	const dir = path.resolve(DATA_BASE_PATH, "default-loaders/sources")

	const walker = new Walker<JavascriptPayload>()
	await walker.init(dir,
	{
		handlers :
		{
			".js" :
			{
				loader : defaultJavascriptLoader,
				options : { sourceType : "module" },
			}
		}
	})

	{
		const libraryFile = walker.pathAsStringToNode("lib.js")
		
		// Ensure we have a valid JsonPayload
		assert(libraryFile !== undefined)
		assert(libraryFile.kind == "FILE")
		assert(libraryFile.payload !== null)
		assert(libraryFile.payload.type == "javascript")
		
		assert(libraryFile.payload.rootAst?.body)
		
		const [ addExport, subtractExport ] = libraryFile.payload.rootAst.body

		assertExists(addExport)
		assert(addExport.type == "ExportNamedDeclaration")
		assertExists(addExport.declaration)
		assert(addExport.declaration.type == "FunctionDeclaration")
		assertExists(addExport.declaration.id)
		assert(addExport.declaration.id.name == "add")
		
		assertExists(subtractExport)
		assert(subtractExport.type == "ExportNamedDeclaration")
		assertExists(subtractExport.declaration)
		assert(subtractExport.declaration.type == "FunctionDeclaration")
		assertExists(subtractExport.declaration.id)
		assert(subtractExport.declaration.id.name == "subtract")
	}
	
	{
		const mainFile = walker.pathAsStringToNode("main.js")
		
		// Ensure we have a valid JsonPayload
		assert(mainFile !== undefined)
		assert(mainFile.kind == "FILE")
		assert(mainFile.payload !== null)
		assert(mainFile.payload.type == "javascript")
		
		const [ libraryImport ] = mainFile.payload.rootAst.body
		
		assertExists(libraryImport)
		assert(libraryImport.type == "ImportDeclaration")
		assertExists(libraryImport.specifiers)
		assert(libraryImport.specifiers[0]?.type == "ImportSpecifier")
		assert(libraryImport.specifiers[0].imported.name == "a")
		assert(libraryImport.specifiers[1]?.type == "ImportSpecifier")
		assert(libraryImport.specifiers[1].imported.name == "b")
	}
});

Deno.test("loaders, default loaders (js, es modules but with wrong options)", () =>
{
	const dir = path.resolve(DATA_BASE_PATH, "default-loaders/sources")

	const walker = new Walker<JavascriptPayload>()
	
	assertRejects( async () =>
	{
		await walker.init(dir,
		{
			
			handlers :
			{
				".js" :
				{
					loader : defaultJavascriptLoader,
					options : { sourceType : "commonjs" },  // With sourceType : "commonjs" Espree cannot parse import/export statements
				}
			}
		})
	})
});

Deno.test("loaders, default loaders (js, cjs modules)", async () =>
{
	const dir = path.resolve(DATA_BASE_PATH, "default-loaders/node")

	const walker = new Walker<JavascriptPayload>()
	await walker.init(dir,
	{
		
		handlers :
		{
			".js" :
			{
				loader : defaultJavascriptLoader,
				options : { sourceType : "commonjs" },
			}
		}
	})

	{
		const libraryFile = walker.pathAsStringToNode("lib.js")
		
		// Ensure we have a valid JsonPayload
		assert(libraryFile !== undefined)
		assert(libraryFile.kind == "FILE")
		assert(libraryFile.payload !== null)
		assert(libraryFile.payload.type == "javascript")
		
		const topLevelStatementsOrExpressions = libraryFile.payload.rootAst.body
		const last = topLevelStatementsOrExpressions.pop()!
		
		assert(last.type == "ExpressionStatement")
		
		assert(last.expression.type == "AssignmentExpression")
		assert(last.expression.left.type == "MemberExpression")
		assert(last.expression.left.property.type == "Identifier")
		assert(last.expression.left.property.name == "exports")

		assert(last.expression.left.object.type == "Identifier")
		assert(last.expression.left.object.name == "module")
	}
	
	{
		const mainFile = walker.pathAsStringToNode("main.js")
		
		// Ensure we have a valid JsonPayload
		assert(mainFile !== undefined)
		assert(mainFile.kind == "FILE")
		assert(mainFile.payload !== null)
		assert(mainFile.payload.type == "javascript")
		
		const topLevelStatementsOrExpressions = mainFile.payload.rootAst.body
		const first = topLevelStatementsOrExpressions.shift()!
		
		assert(first.type == "VariableDeclaration")
		assert(first.declarations[0].type == "VariableDeclarator")
		assertExists(first.declarations[0].init)
		assert(first.declarations[0].init.type == "CallExpression")
		assert(first.declarations[0].init.callee.type == "Identifier")
		assert(first.declarations[0].init.callee.name == "require")
	}
});