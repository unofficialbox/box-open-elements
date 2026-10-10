/**
 * Generate native property and event typings from the element map and element
 * source. Run `bun run maps:generate` first when tags change.
 *
 * The emitted files are committed, side-effect-free, and checked for drift by
 * `bun run types:check`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const mapSource = readFileSync(join(SRC, "element-maps.ts"), "utf8");
const imports = new Map(
  [...mapSource.matchAll(/^import type \{ (\w+) \} from "(\.\/.+\.js)";$/gm)]
    .map(([, name, path]) => [name!, path!] as const),
);
const elements = [...mapSource.matchAll(/^    "(box-[a-z0-9-]+)": (\w+);$/gm)]
  .map(([, tag, className]) => ({ tag: tag!, className: className!, path: imports.get(className!) }))
  .sort((a, b) => a.tag.localeCompare(b.tag));
if (elements.length === 0 || elements.some(entry => !entry.path)) {
  throw new Error("element-maps.ts has missing tags or class imports; run bun run maps:generate");
}

const config = ts.readConfigFile(join(ROOT, "tsconfig.json"), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

interface GeneratedElement {
  tag: string;
  className: string;
  path: string;
  properties: string[];
  events: Map<string, Set<string>>;
}

const isPublicInstanceMember = (member: ts.ClassElement): boolean =>
  !member.modifiers?.some(modifier =>
    modifier.kind === ts.SyntaxKind.StaticKeyword ||
    modifier.kind === ts.SyntaxKind.PrivateKeyword ||
    modifier.kind === ts.SyntaxKind.ProtectedKeyword,
  );

// Traverse library component bases, stopping before the framework/DOM surface.
// Pick<HTMLElementTagNameMap[Tag], ...> resolves the final subclass property
// types, including overrides; only the writable key inventory is generated.
const componentClasses = (classNode: ts.ClassDeclaration): ts.ClassDeclaration[] => {
  const classes: ts.ClassDeclaration[] = [];
  const seen = new Set<ts.ClassDeclaration>();
  const visit = (node: ts.ClassDeclaration): void => {
    const file = node.getSourceFile().fileName;
    if (seen.has(node) || !file.startsWith(`${SRC}/`) || file === join(SRC, "core/element.ts")) return;
    seen.add(node);
    classes.push(node);
    const type = checker.getTypeAtLocation(node) as ts.InterfaceType;
    for (const base of checker.getBaseTypes(type) ?? []) {
      for (const declaration of base.symbol?.declarations ?? []) {
        if (ts.isClassDeclaration(declaration)) visit(declaration);
      }
    }
  };
  visit(classNode);
  return classes;
};

const portableType = (type: ts.Type, source: ts.SourceFile, classNode: ts.ClassDeclaration): string => {
  let rendered = checker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation |
      ts.TypeFormatFlags.UseFullyQualifiedType |
      ts.TypeFormatFlags.InTypeAlias,
  );
  const localTypes = source.statements.filter(
    (statement): statement is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
      ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement),
  );
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;
    for (const declaration of localTypes) {
      const symbol = checker.getSymbolAtLocation(declaration.name);
      if (!symbol) continue;
      const name = declaration.name.text;
      const pattern = new RegExp(`(?<![.\\w])${name}\\b`, "g");
      const expanded = checker.typeToString(
        checker.getDeclaredTypeOfSymbol(symbol),
        undefined,
        ts.TypeFormatFlags.NoTruncation |
          ts.TypeFormatFlags.UseFullyQualifiedType |
          ts.TypeFormatFlags.InTypeAlias,
      );
      if (expanded !== name && pattern.test(rendered)) {
        rendered = rendered.replace(pattern, `(${expanded})`);
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const parameter of classNode.typeParameters ?? []) {
    rendered = rendered.replace(new RegExp(`\\b${parameter.name.text}\\b`, "g"), "unknown");
  }
  return rendered.replace(
    /import\("([^"]+)"(?:, \{ with: \{ "resolution-mode": "import" \} \})?\)/g,
    (_match, absolutePath: string) => {
      const path = resolve(absolutePath);
      if (!path.startsWith(`${SRC}/`)) {
        throw new Error(`Cannot emit non-portable event detail import: ${absolutePath}`);
      }
      return `import("./${relative(SRC, path)}.js")`;
    },
  );
};

const generated: GeneratedElement[] = elements.map(entry => {
  const path = entry.path!;
  const sourcePath = join(SRC, path.slice(2).replace(/\.js$/, ".ts"));
  const source = program.getSourceFile(sourcePath);
  if (!source) throw new Error(`Cannot find source for ${entry.tag}: ${sourcePath}`);
  const classNode = source.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) && statement.name?.text === entry.className,
  );
  if (!classNode) throw new Error(`Cannot find class ${entry.className} for ${entry.tag}`);
  const classes = componentClasses(classNode);
  const propertyKeys = new Set<string>();
  const shadowedKeys = new Set<string>();
  for (const node of classes) {
    const members = new Map<string, ts.ClassElement[]>();
    for (const member of node.members) {
      if (!isPublicInstanceMember(member) || !member.name || !ts.isIdentifier(member.name)) continue;
      const name = member.name.text;
      members.set(name, [...(members.get(name) ?? []), member]);
    }
    for (const [name, declarations] of members) {
      if (shadowedKeys.has(name)) continue;
      shadowedKeys.add(name);
      if (declarations.some(member => ts.isSetAccessorDeclaration(member) ||
        (ts.isPropertyDeclaration(member) && !member.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword)))) {
        propertyKeys.add(name);
      }
    }
  }
  const properties = [...propertyKeys].sort();
  const events = new Map<string, Set<string>>();
  const addEvent = (name: string, detail: ts.Type): void => {
    const details = events.get(name) ?? new Set<string>();
    details.add(portableType(detail, source, classNode));
    events.set(name, details);
  };
  // Controller-forwarded events can declare an explicit, source-owned contract.
  const contract = source.statements.find(statement =>
    ts.isInterfaceDeclaration(statement) && statement.name.text === `${entry.className}EventDetails`,
  );
  if (contract && ts.isInterfaceDeclaration(contract)) {
    const type = checker.getTypeAtLocation(contract);
    for (const property of type.getProperties()) {
      addEvent(property.name, checker.getTypeOfSymbolAtLocation(property, contract));
    }
  }
  // Recognize local dispatch helpers by their implementation, not their name.
  const helpers = new Map<ts.Symbol, { target: number; name: number; detail: number }>();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const fn = declaration.initializer;
      if (!fn || !ts.isArrowFunction(fn)) continue;
      const parameterIndex = (node: ts.Node): number => fn.parameters.findIndex(parameter =>
        ts.isIdentifier(parameter.name) && ts.isIdentifier(node) && parameter.name.text === node.text,
      );
      const inspect = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === "dispatchEvent" && node.arguments[0] &&
          ts.isNewExpression(node.arguments[0]) && node.arguments[0].expression.getText(source) === "CustomEvent") {
          const event = node.arguments[0];
          const options = event.arguments?.[1];
          const detailProperty = options && ts.isObjectLiteralExpression(options) ? options.properties.find(property =>
            property.name && property.name.getText(source) === "detail",
          ) : undefined;
          const detailNode = detailProperty && ts.isShorthandPropertyAssignment(detailProperty) ? detailProperty.name :
            detailProperty && ts.isPropertyAssignment(detailProperty) ? detailProperty.initializer : undefined;
          const target = parameterIndex(node.expression.expression);
          const name = event.arguments?.[0] ? parameterIndex(event.arguments[0]) : -1;
          const detail = detailNode ? parameterIndex(detailNode) : -1;
          const symbol = checker.getSymbolAtLocation(declaration.name);
          if (symbol && target >= 0 && name >= 0 && detail >= 0) helpers.set(symbol, { target, name, detail });
        }
        ts.forEachChild(node, inspect);
      };
      inspect(fn.body);
    }
  }
  const visit = (node: ts.Node, source: ts.SourceFile, declaringClass: ts.ClassDeclaration): void => {
    if (ts.isNewExpression(node) && node.expression.getText(source) === "CustomEvent" &&
      node.arguments?.[0] && ts.isStringLiteral(node.arguments[0])) {
      const eventType = checker.getTypeAtLocation(node);
      const detail = checker.getTypeArguments(eventType as ts.TypeReference)[0];
      const name = node.arguments[0].text;
      const details = events.get(name) ?? new Set<string>();
      details.add(detail ? portableType(detail, source, declaringClass) : "unknown");
      events.set(name, details);
    }
    if (ts.isCallExpression(node)) {
      const symbol = checker.getSymbolAtLocation(node.expression);
      const helper = symbol && helpers.get(symbol);
      if (helper && node.arguments[helper.target]?.kind === ts.SyntaxKind.ThisKeyword) {
        const name = node.arguments[helper.name];
        const detail = node.arguments[helper.detail];
        if (name && ts.isStringLiteral(name) && detail) addEvent(name.text, checker.getTypeAtLocation(detail));
      }
    }
    ts.forEachChild(node, child => visit(child, source, declaringClass));
  };
  for (const node of classes) visit(node, node.getSourceFile(), node);
  return { tag: entry.tag, className: entry.className, path, properties, events };
});

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: bun run types:generate
 * Native custom-element properties and CustomEvent details from component source.
 * Type-only: importing this entry never registers or renders an element.
 */`;
const propertyLines = generated.map(entry =>
  `  "${entry.tag}": ${entry.properties.length ? entry.properties.map(name => JSON.stringify(name)).join(" | ") : "never"};`,
).join("\n");
const eventLines = generated.map(entry => {
  const entries = [...entry.events.entries()].sort(([a], [b]) => a.localeCompare(b));
  return `  "${entry.tag}": {${entries.length ? `\n${entries.map(([name, details]) =>
    `    "${name}": CustomEvent<${[...details].join(" | ")}>;`,
  ).join("\n")}\n  ` : ""}};`;
}).join("\n");
const eventOverloads = generated.filter(entry => entry.events.size).map(entry => `declare module "${entry.path}" {
  interface ${entry.className} {
    addEventListener<K extends keyof BoxElementEventMap["${entry.tag}"] & string>(
      type: K,
      listener: (this: ${entry.className}, event: BoxElementEventMap["${entry.tag}"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ${entry.className}, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["${entry.tag}"] & string>(
      type: K,
      listener: (this: ${entry.className}, event: BoxElementEventMap["${entry.tag}"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ${entry.className}, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}`).join("\n\n");
const backtick = String.fromCharCode(96);
const nativeOutput = `${header}
import type { BoxElementTagName } from "./element-maps.js";

/** Writable component properties, including library bases and excluding framework/DOM members. */
export interface BoxElementPropertyKeys {
${propertyLines}
}

/** Events dispatched by each element, with inferred native detail payloads. */
export interface BoxElementEventMap {
${eventLines}
}

export type BoxElementProperties<Tag extends BoxElementTagName> = Partial<Pick<
  HTMLElementTagNameMap[Tag],
  Extract<BoxElementPropertyKeys[Tag], keyof HTMLElementTagNameMap[Tag]>
>>;

export type BoxElementEventHandlerProps<Tag extends BoxElementTagName> = {
  [Name in keyof BoxElementEventMap[Tag] & string as ${backtick}on${"$"}{Name}${backtick}]?: (
    event: BoxElementEventMap[Tag][Name] & { currentTarget: HTMLElementTagNameMap[Tag] },
  ) => void;
};

${eventOverloads}
`;

const jsxOutput = `${header}
import type * as React from "react";
import type { BoxElementTagName } from "./element-maps.js";
import type {
  BoxElementEventHandlerProps,
  BoxElementProperties,
  BoxElementPropertyKeys,
} from "./native-types.js";

type BoxReactProps<Tag extends BoxElementTagName> =
  Omit<React.HTMLAttributes<HTMLElementTagNameMap[Tag]>,
    BoxElementPropertyKeys[Tag] | keyof BoxElementEventHandlerProps<Tag>> &
  BoxElementProperties<Tag> &
  BoxElementEventHandlerProps<Tag> &
  React.RefAttributes<HTMLElementTagNameMap[Tag]>;

type BoxReactIntrinsicElements = {
  [Tag in BoxElementTagName]: BoxReactProps<Tag>;
};

/** Opt in with a type-only import of the react-jsx subpath. */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends BoxReactIntrinsicElements {}
  }
}

export {};
`;

for (const [name, output] of [["native-types.ts", nativeOutput], ["react-jsx.ts", jsxOutput]] as const) {
  const target = join(SRC, name);
  if (process.argv.includes("--check")) {
    if (readFileSync(target, "utf8") !== output) {
      throw new Error(`${name} is stale; run bun run types:generate`);
    }
  } else {
    writeFileSync(target, output);
    console.log(`wrote ${relative(ROOT, target)}`);
  }
}
