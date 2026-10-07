# Public references and example scope

This kit's architecture rules are conventions, not conclusions proven by private application code. All package names, feature trees, and protocol markers in its examples are illustrative. The `@example` scope is a placeholder; adapting it does not imply access to an existing product or repository.

## Composition lineage

Fernando attributes these composition principles to his React Universe talk and the public Vercel composition-patterns skill: shared headless interfaces, injected implementations, explicit trees, and children composition. This attribution does not make any example a production implementation.

## Public documentation

- [React context](https://react.dev/learn/passing-data-deeply-with-context) describes how descendants consume provider values.
- [React state identity](https://react.dev/learn/preserving-and-resetting-state) explains preservation and resetting across tree changes.
- [TanStack advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr) is the reference for Query provider lifetime and hydration. Check APIs against the installed version.
- [Query render optimizations](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations) and [Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense) explain the primitives behind the resource examples.
- [Next native history](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api) is the reference for host URL integration. Verify behavior in the chosen Next configuration.
- [Effect RPC source](https://github.com/Effect-TS/effect/tree/v3/packages/rpc) is a public source for transport and schema integration; select a compatible version before implementing examples.

These references explain framework behavior. They do not prescribe this kit's package names, feature layout, service classes, or exact SDK helper names.

## Synthetic examples and executable evidence

The [example book](../skills/fernando-product-engineering/references/examples.md) and [recipes](../skills/fernando-product-engineering/references/recipes.md) are proposed consumption patterns. They do not reproduce or establish facts about a private codebase. Runtime schemas, services, scoped data access, SDK integration, and app bootstrap each have their own responsibilities in these examples.

The [contract slice](../eval-outputs/contract-slice/README.md) exercises a limited set of schema and service behaviors. The [lint verification record](../skills/fernando-product-engineering/scripts/lint/tests/VERIFICATION.md) describes checker fixtures. Neither proves production SDK completeness, cross-platform parity, a live cloud integration, or browser behavior. See [validation](validation.md) for recorded checks and limits.
