# usage-value-reference-anonymous-default

**Proves:** an anonymous default export's references are found at all — through its export
assignment rather than through a name node — and split correctly between `usages` and
`valueReferences`.

```
src/panel.ts :: :: function :: default
```

| Site                                 | Expected           |
| ------------------------------------ | ------------------ |
| `src/use.ts` line 3 — `const held =` | `valueReferences`  |
| `src/use.ts` line 6 — `panel(label)` | `usages`, `invoke` |

## Why this case exists separately

An anonymous default export is the one supported callable shape with **no name to search
from**. §7.2 keys it as `default`, and the importing module names it whatever it likes —
here `panel`. Reference discovery is driven by a name node, and this declaration has none,
so its references have to be reached through the export assignment instead.

That makes it the one shape whose usages depend on this projection to be reported at all,
rather than merely to be filed under the right heading.

## The blind spot this fixture pins, which nothing else can

Probed, zero diagnostics: the seed is found, and then —

- **no usages**,
- **no filtered references**,
- and **nothing unexplained**.

The last one is the problem. The differential check scans for occurrences of the seed's
**name**, and this seed's name is `default`, which appears nowhere in `src/use.ts`. The
call on line 6 and the value use on line 3 are both invisible to it: there is no text for
it to find, so it cannot report that anything is missing.

So this is a **genuine silent miss** — a supported callable whose every usage is dropped,
with the repository's main safety net structurally unable to see it. Unlike most fixtures
here, nothing but this expectation will catch a regression in it.
