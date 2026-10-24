# usage-value-reference-shapes

**Proves:** every immediate value use of a callable is projected into `valueReferences`,
the call beside them stays in `usages`, and **no value use is ever reported as an
`invoke`** (§14 M4).

```
src/format.ts :: :: function :: formatRow
```

| Site                                    | Expected           |
| --------------------------------------- | ------------------ |
| `src/use.ts` line 4 — `rows.map(fn)`    | `valueReferences`  |
| `src/use.ts` line 7 — `const held = fn` | `valueReferences`  |
| `src/use.ts` line 9 — `[fn]`            | `valueReferences`  |
| `src/use.ts` line 12 — `memo(fn)`       | `valueReferences`  |
| `src/use.ts` line 16 — `fn(row)`        | `usages`, `invoke` |

## Why this shape

§6.2 names four value positions — argument, assignment, array element, wrapper input —
and all four are here, against one seed, in one file. They differ only in **where the name
sits**, so anything that distinguishes them in the report is a classification difference
and nothing else.

Line 16 is the control, and it is the one that makes the fixture mean something. A
projection that moved _every_ reference into `valueReferences` would satisfy the first
four rows and be badly wrong; only the call staying in `usages` catches that.

`memo` is defined locally rather than imported from a framework. The wrapper shape matters
to §6.2, the framework does not, and a fixture that needed React installed would be
testing dependency resolution as well.

## Current behaviour

Probed, zero diagnostics: **all five are classified correctly already** — four
`value-reference` and one `invoke` — and nothing is unexplained.

What is missing is only the **projection**: the relation exists, but `valueReferences`
is never populated, so all five sit in `usages`. This fixture therefore pins a reporting
shape, not a classification bug, and a reader should not expect it to catch a silent miss.
