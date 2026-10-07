import tseslint from 'typescript-eslint';
import query from '@tanstack/eslint-plugin-query';
import ts from 'typescript';

const effects = new Set(['useEffect', 'useLayoutEffect']);
const transport = new Set(['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource']);
const normalize = value => value.replaceAll('\\', '/');
const moduleMatches = (file, names) => names.some(name => normalize(file).includes(`/node_modules/${name}/`) || normalize(file).includes(`/node_modules/${name}.`) || normalize(file).endsWith(`/${name}`));

function moduleOrigins(context, modules) {
  const program = context.sourceCode.parserServices.program;
  const checker = program.getTypeChecker();
  const owned = new Set();
  for (const name of modules) {
    const resolved = ts.resolveModuleName(name, context.filename, program.getCompilerOptions(), ts.sys).resolvedModule;
    const source = resolved && program.getSourceFile(resolved.resolvedFileName);
    const symbol = source && checker.getSymbolAtLocation(source);
    for (let exported of symbol ? checker.getExportsOfModule(symbol) : []) {
      if (exported.flags & ts.SymbolFlags.Alias) exported = checker.getAliasedSymbol(exported);
      for (const declaration of exported.declarations ?? []) owned.add(`${declaration.getSourceFile().fileName}:${exported.name}`);
    }
  }
  return origin => moduleMatches(origin.file, modules) || owned.has(`${origin.file}:${origin.name}`);
}

function origins(context, node, seen = new Set()) {
  const services = context.sourceCode.parserServices;
  if (!services?.program) throw new Error('Nando architecture rules require type-aware parsing with a tsconfig.');
  const checker = services.program.getTypeChecker();
  const source = services.esTreeNodeToTSNodeMap.get(node);
  let symbol = checker.getSymbolAtLocation(source);
  if (!symbol && node.type === 'MemberExpression') {
    const name = node.computed ? node.property.value : node.property.name;
    if (typeof name === 'string') symbol = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node.object)).getProperty(name);
  }
  if (!symbol || seen.has(symbol)) return [];
  seen.add(symbol);
  if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  const found = [];
  for (const declaration of symbol.declarations ?? []) {
    found.push({ name: symbol.getName(), file: declaration.getSourceFile().fileName });
    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      const initializer = services.tsNodeToESTreeNodeMap.get(declaration.initializer);
      if (initializer) found.push(...origins(context, initializer.type === 'MemberExpression' ? initializer.property : initializer, seen));
    }
    if (ts.isBindingElement(declaration) && ts.isObjectBindingPattern(declaration.parent) && ts.isVariableDeclaration(declaration.parent.parent) && declaration.parent.parent.initializer) {
      const key = declaration.propertyName ?? declaration.name;
      const name = ts.isIdentifier(key) || ts.isStringLiteral(key) ? key.text : undefined;
      let property = name && checker.getTypeAtLocation(declaration.parent.parent.initializer).getProperty(name);
      if (property && property.flags & ts.SymbolFlags.Alias) property = checker.getAliasedSymbol(property);
      for (const origin of property?.declarations ?? []) found.push({ name: property.name, file: origin.getSourceFile().fileName });
    }
  }
  return found;
}

function rule(description, create) {
  return { meta: { type: 'problem', docs: { description }, schema: [], messages: { boundary: '{{detail}}' } }, create };
}
function report(context, node, detail) { context.report({ node, messageId: 'boundary', data: { detail } }); }
function importVisitors(context, names) {
  const inspect = node => {
    const source = node.source ?? (node.type === 'CallExpression' ? node.arguments[0] : null);
    if (source?.type === 'Literal' && typeof source.value === 'string' && names.some(name => source.value === name || source.value.startsWith(`${name}/`))) {
      report(context, source, `Move ${source.value} behind its owned boundary.`);
    }
  };
  return { ImportDeclaration: inspect, ExportNamedDeclaration: inspect, ExportAllDeclaration: inspect, ImportExpression: inspect,
    CallExpression(node) { if (node.callee.type === 'Identifier' && node.callee.name === 'require') inspect(node); } };
}

const plugin = {
  meta: { name: '@fernando/architecture', version: '0.1.0' },
  rules: {
    'no-feature-effects': rule('Keep synchronization effects in explicitly registered adapters.', context => {
      function inspect(node) {
        if (origins(context, node).some(origin => effects.has(origin.name) && /\/(?:@types\/)?react\//.test(normalize(origin.file)))) {
          report(context, node, 'Portable features cannot reference React effects. Use the SDK Query/subscription adapter; register DOM synchronization at its host boundary.');
        }
      }
      return { Identifier: inspect, MemberExpression: inspect };
    }),
    'no-feature-transport': rule('Keep raw transport and registered protocols out of portable features.', context => {
      const modules = context.settings.nando?.protocolModules ?? [];
      const isProtocol = moduleOrigins(context, modules);
      function inspect(node) {
        if (origins(context, node).some(origin => (transport.has(origin.name) && /\/lib\.(dom|webworker).*\.d\.ts$/.test(normalize(origin.file))) || isProtocol(origin))) {
          report(context, node, 'Transport belongs in the vanilla SDK or its owned transport adapter.');
        }
      }
      return { ...importVisitors(context, modules), Identifier: inspect, MemberExpression: inspect };
    }),
    'design-system-purity': rule('Reject registered product imports and protocol markers in generic UI.', context => {
      const config = context.settings.nando ?? {};
      const modules = [...config.productModules ?? [], ...config.protocolModules ?? []];
      const isProduct = moduleOrigins(context, modules);
      return { ...importVisitors(context, modules), Identifier(node) {
        if (origins(context, node).some(isProduct)) report(context, node, 'Generic UI cannot interpret a registered product or protocol symbol.');
      }, Literal(node) {
        if (typeof node.value === 'string' && (config.protocolMarkers ?? []).some(marker => node.value.includes(marker))) report(context, node, 'Move this registered protocol marker into its owned adapter.');
      }, TemplateElement(node) {
        if ((config.protocolMarkers ?? []).some(marker => node.value.raw.includes(marker))) report(context, node, 'Move this registered protocol marker into its owned adapter.');
      } };
    }),
    'resource-state-dispatch': rule('Configured state presenters use exhaustive switches without catchalls.', context => {
      const keys = context.settings.nando?.discriminants ?? ['status', 'phase'];
      function readsState(node, seen = new Set()) {
        if (!node || seen.has(node)) return false;
        seen.add(node);
        if (node.type === 'MemberExpression' && keys.includes(node.computed ? node.property.value : node.property.name)) return true;
        if (node.type === 'Identifier') {
          const services = context.sourceCode.parserServices;
          const checker = services.program.getTypeChecker();
          const symbol = checker.getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(node));
          for (const decl of symbol?.declarations ?? []) {
            if (ts.isBindingElement(decl) && keys.includes((decl.propertyName ?? decl.name).getText())) return true;
            if (ts.isVariableDeclaration(decl) && decl.initializer && readsState(services.tsNodeToESTreeNodeMap.get(decl.initializer), seen)) return true;
          }
        }
        return (context.sourceCode.visitorKeys[node.type] ?? []).some(key => {
          const value = node[key];
          return Array.isArray(value) ? value.some(child => readsState(child, seen)) : readsState(value, seen);
        });
      }
      function branch(node) {
        if (readsState(node.test ?? node.left)) report(context, node, 'Dispatch workflow/resource discriminants through an exhaustive switch and separate state presentations.');
      }
      return { IfStatement: branch, ConditionalExpression: branch, LogicalExpression: branch, SwitchStatement(node) {
        if (!readsState(node.discriminant)) return;
        for (const clause of node.cases) if (clause.test === null) report(context, clause, 'State dispatch cannot have a catchall default. Enumerate every legal state.');
        const services = context.sourceCode.parserServices;
        const type = services.program.getTypeChecker().getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node.discriminant));
        const members = type.isUnion() ? type.types : [type];
        if (members.some(member => !(member.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral | ts.TypeFlags.EnumLiteral)))) report(context, node.discriminant, 'State discriminants must have a finite literal type, not any, unknown, or a broad string.');
      } };
    }),
  },
};

export default plugin;
export function createArchitectureConfig(options) {
  const { rootDir, tsconfig, sourceRoles } = options;
  if (!rootDir || !tsconfig || !sourceRoles?.portableFeature?.length) throw new Error('rootDir, tsconfig and explicit portableFeature source roles are required.');
  const roles = new Set(['portableFeature', 'designSystem', 'statePresenter', 'hostAdapter', 'sdkReact']);
  for (const [role, files] of Object.entries(sourceRoles)) {
    if (!roles.has(role)) throw new Error(`Unknown source role ${role}.`);
    if (!Array.isArray(files) || files.some(file => typeof file !== 'string' || !file.trim())) throw new Error(`Invalid source role ${role}.`);
  }
  for (const key of ['protocolModules', 'productModules', 'protocolMarkers', 'discriminants']) {
    const values = options[key];
    if (values !== undefined && (!Array.isArray(values) || values.some(value => typeof value !== 'string' || !value.trim()) || (key === 'discriminants' && values.length === 0))) throw new Error(`Invalid ${key}: expected ${key === 'discriminants' ? 'a nonempty array' : 'an array'} of nonempty strings.`);
  }
  const allFiles = [...new Set(Object.values(sourceRoles).flat())];
  const scoped = (files, rules, ignores = []) => files?.length ? [{ files, ignores, rules }] : [];
  return [
    { files: allFiles, languageOptions: { parser: tseslint.parser, parserOptions: { project: tsconfig, tsconfigRootDir: rootDir } }, plugins: { '@fernando/architecture': plugin, '@typescript-eslint': tseslint.plugin, '@tanstack/query': query }, settings: { nando: options }, rules: {
      'no-nested-ternary': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: false }],
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'error',
      '@tanstack/query/stable-query-client': 'error',
      '@tanstack/query/no-unstable-deps': 'error',
    } },
    ...scoped(sourceRoles.portableFeature, { '@fernando/architecture/no-feature-effects': 'error', '@fernando/architecture/no-feature-transport': 'error' }, [...sourceRoles.hostAdapter ?? [], ...sourceRoles.sdkReact ?? []]),
    ...scoped(sourceRoles.designSystem, { '@fernando/architecture/design-system-purity': 'error' }),
    ...scoped(sourceRoles.statePresenter, { '@fernando/architecture/resource-state-dispatch': 'error' }),
  ];
}
