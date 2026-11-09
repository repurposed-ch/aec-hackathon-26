<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Commits
- Make concise, atomic commits: one logical change per commit.
- Subject line only, in the existing style (`feat: …`, `fix: …`, `chore: …`).
- No commit body/description.
- No attribution lines (no `Co-Authored-By`, no session links).

## Plans
Every plan must include:
- **Success criteria**: concrete, checkable conditions that mean the work is done (e.g. build passes, page X renders, feature Y works).
- **Failure criteria**: conditions that mean the approach should stop or be rethought (e.g. build breaks, a feature regresses, the change grows far past its estimate).
- **Expected lines changed**: a rough estimate per step and in total (added/removed), so the scope is visible up front.
- A breakdown into the atomic commits it will produce.
