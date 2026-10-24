# gap-computed-member-access

> **PROPOSAL — awaiting a maintainer ruling.** This case records a gap kind that does not
> exist in spec §10.1. It is here to make the proposal concrete enough to rule on, not
> because the behaviour is decided.

**Proposes:** when a computed member access cannot be resolved to the seed **but the
receiver's type carries the seed's member**, report a gap instead of nothing.

```
src/client.ts :: Client :: method :: send
```

| Site                                           | Receiver type | Proposed              |
| ---------------------------------------------- | ------------- | --------------------- |
| `src/use.ts` line 5 — `client[key]` (constant) | `Client`      | gap                   |
| `src/use.ts` line 9 — `client[("send")]`       | `Client`      | gap                   |
| `src/use.ts` line 13 — `client[key]` (param)   | `Client`      | gap                   |
| `src/use.ts` line 17 — `bag[key]`              | `Record<…>`   | **nothing** — correct |

## The problem, measured

Probed on this fixture, with **zero diagnostics** — every line is ordinary TypeScript:

```
seed:          src/client.ts :: Client :: method :: send
usages:        none
unexplained:   none
occurrences:   src/use.ts:4  comment-or-string
               src/use.ts:9  comment-or-string
               src/use.ts:12 comment-or-string
```

`Client.send` is called **four times** and the report says it has **no usages at all**.
Nothing is unexplained, so the repository's safety net is silent: the only textual traces
are the literal `"send"` inside a string, a parenthesis, and a type annotation, and the
differential check is right to call those text.

This is the state the current documentation describes as "no usage and no gap". It is
honest, and it is also the worst possible answer for a reader, because an empty usage
list is indistinguishable from a callable that genuinely has no callers.

## What the proposal would change

Add `computed-member-access` to §10.1, emitted when **both** hold:

1. an element access could not be resolved to the seed, **and**
2. the receiver's type has a member with the seed's name.

Condition 2 is the whole proposal. Without it this would fire on every computed access in
the repository and mean nothing. With it, the gap says something a reader can act on:
_this call site could be reaching the changed method, and static analysis cannot confirm
it._

Line 17 is the negative control and is the reason the fixture has four cases rather than
three. `bag[key]` is a computed access on a receiver whose type has no `send` member —
it is genuinely unrelated to the seed, and must stay silent. A proposal that fired there
too would be a proposal to report noise.

## What it would cost

- **A new gap kind** in §10.1, the public schema, and `docs/limitations.md`, which the
  documentation currently describes as a closed list.
- **A second discovery path.** `findReferences` does not return these nodes, so detecting
  them means sweeping element accesses per file and asking the checker about each
  receiver — the work previously declined as disproportionate when the question was
  whether to _resolve_ these spellings. This proposal is cheaper than that: it does not
  resolve anything, only notices that a member of the right name exists on the receiver.
- **False positives are possible by design.** A receiver that happens to have a
  same-named member would produce a gap for a call that never reaches the seed. Gaps are
  explicitly _not_ edges (ADR-0004), so this is the category where that is tolerable —
  but it is a real cost and the gap counts will be noisier than today's.

## What it would buy

The three undiscovered spellings stop being invisible. A changed method reached only
through a dispatch table currently reports zero usages with no indication anything was
missed; under this proposal it reports zero usages **and** a gap per call site saying the
analysis could not confirm them.

## The alternative

Leave it. The behaviour is documented, the agreement table pins it on both
implementations, and a reader who consults `docs/limitations.md` is told plainly that a
dispatch table is outside what the report covers.

The argument against leaving it is that the documentation is the only place this is
visible. The report itself looks identical to "nothing calls this".
