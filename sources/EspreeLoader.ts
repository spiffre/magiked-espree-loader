import type { Payload } from "../dependencies/magiked.ts"

import { espree } from "../dependencies/espree/mod.ts";
import type { EspreeParseOptions, EspreeAst } from "../dependencies/espree/mod.ts";

const readTextFileAsync = Deno.readTextFile

const ESPREE_PARSE_OPTIONS: EspreeParseOptions =
{
	ecmaVersion : 11,
	sourceType: "module",
}

interface EspreeParseError extends Error
{
	index: number
	column: number
	lineNumber: number
	message: string
}

export interface JavascriptPayload extends Payload
{
	// fixme: How to force type and extension to be re-defined ?
	type: 'javascript'
	extension: '.js'

	rootAst : EspreeAst.Program
}

export async function defaultJavascriptLoader (filepath: string, options?: EspreeParseOptions): Promise<JavascriptPayload>
{
	const content = await readTextFileAsync(filepath)
	
	try
	{
		const rootAst = espree.parse(content, { ...ESPREE_PARSE_OPTIONS, ...options })

		return {
			type : 'javascript',
			extension : '.js',
			
			rootAst
		}
	}
	catch (error)
	{
		const { index, lineNumber : line, column, message } = error as EspreeParseError
		const details = `${message}:\nAt line ${line}, column ${column} (index ${index})`
		throw new Error(`Failed to parse file: ${filepath}\n${details}\n\n${error}`)
	}
}
