import { Parser } from "../core/parser";
import { Node } from "./node";
import { Token, TokenizeHandler } from "./token";


/**
 * A customize node for defining new Node to handle
*/
export interface CustomNode {
    type: string
    children?: Node[]
    [key: string]: any; // Other attribute defined by user
}

/**
 * Define a custom token
 * @property type - Type of Token.
 * @property content - Optional property, used if Token have content inside.
 * @property key - A list of custom properties defined by user
 */
export interface CustomToken {
    type: string
    [key: string]: any
}

export interface ConvertExtension {
    name: string
    type: 'block' | 'inline'
    tokenizer: TokenizeHandler
    parse: (parser: Parser, token: Token) => Node
}

export interface HTMLConvertExtension extends ConvertExtension {
    render: (node: Node, children: string[]) => string
}

export interface ReactConvertExtension extends ConvertExtension {
    render: (node: Node, children: React.ReactNode[]) => React.ReactNode
}