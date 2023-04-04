import type { Payload } from "magiked"

import { espree } from "espree";
import type { EspreeParseOptions, EspreeAst } from "espree";

const readTextFileAsync = Deno.readTextFile

const ESPREE_PARSE_OPTIONS: EspreeParseOptions =
{
	ecmaVersion : 11,
	sourceType: "module",
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
	const rootAst = espree.parse(content, { ...ESPREE_PARSE_OPTIONS, ...options })

	return {
		type : 'javascript',
		extension : '.js',
		
		rootAst
	}
}
