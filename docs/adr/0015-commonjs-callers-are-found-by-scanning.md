# ADR-0015: CommonJS callers are found by scanning, not by a reference search

- **Status:** Accepted
- **Date:** 2026-10-24

## Context

Every other usage in nidan is found the same way: ask the compiler for the references of
the changed callable's name. CommonJS breaks that, and not in a way that can be patched.

`module.exports = { greet }` creates an export property whose symbol is **distinct** from
the function's. A caller writing `mod.greet()` resolves to that property, not to the
function. A reference search over the function returns its own declaration and the
shorthand; a reference search over the shorthand returns the same two. Neither returns the
call site. This was verified directly, twice — once in memory and once on the approved
fixture with full module resolution, because the first probe lacked a `package.json` and
its result could not be trusted.

The consequence was visible before the cause was: every CommonJS call site in the approved
fixtures arrived **unexplained**. The differential check could see them — it resolves from
the call site _towards_ the declaration, which works — while discovery, resolving the other
way, could not.

An earlier version of this record said the fix was "a second `findReferences` search, over
the export property". That was wrong, and the probe above is what disproved it.

## Decision

Find CommonJS callers by **scanning candidates and asking the language service**, not by a
reference search.

In each file that contains a `require("<literal>")`, every identifier spelled like the
seed is a candidate. Go-to-definition decides: if it lands inside the seed's own
declaration, the candidate is a usage. A destructured binding — `const { greet } =
require(…)` — is the CommonJS spelling of an import specifier and is filtered as one.

The `require` test is a **cost filter, not the correctness argument**. A file with no
literal `require` cannot reach a CommonJS export, so skipping it avoids walking every file
for every seed; correctness comes entirely from the definition check, which is why a
same-named identifier inside a requiring file is still rejected.

## Consequences

**The differential check stays an independent method, which is the point.** It resolves
symbols and follows alias chains itself; the analyzer asks go-to-definition. Those are two
different mechanisms reaching the same answer, so the check can still catch a bug in
discovery — which it could not if both consulted the same oracle (§10). They are tied by
an agreement test over a table of caller shapes, including two that must **not** reach the
seed: a same-named export of a different module, and a same-named local function.

**It costs a file walk per seed.** Bounded by the `require` filter, but it is real work,
and it is the second discovery mechanism this project has: the first was declined for
computed member access as disproportionate. The difference is that CommonJS is a supported
pattern in §6.3 and an M4 acceptance criterion, so the alternative was not "document the
limitation" but "fail to support a declared pattern".

**Two mechanisms mean two places to change.** A new CommonJS spelling has to be taught to
discovery and, if it changes what counts as a reference, to the differential check as
well. The agreement test is what makes that failure loud instead of silent.

## Alternatives considered

**A second reference search over the export property.** The original plan. It does not
work: the search returns only same-file results, verified on the real fixture. Recorded
here because the plan was acted on before being measured, and the measurement is the only
reason it did not ship.

**Resolve the export property by hand.** Walk from the export site to the callers using
the module graph rather than the language service. Rejected: that is re-implementing
go-to-definition, which already handles the shorthand, re-exports, and aliasing — and
doing it worse.

**Report CommonJS call sites as a gap.** Honest, and cheap. Rejected because §6.3 lists
CommonJS as a supported pattern and M4's acceptance requires each positive case to be
found; a gap would be documenting a decision not to implement a declared feature.
