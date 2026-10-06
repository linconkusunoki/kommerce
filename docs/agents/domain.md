# Domain Docs

How engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root, or **`GLOSSARY-MAP.md`** at the repo root if it exists.
- **`docs/adr/`**: read ADRs that touch the area being worked on.
- If these files don't exist, proceed silently. The `/domain-modeling` skill creates them lazily when needed.

## File structure

Single-context repo:

```text
/
├── GLOSSARY.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept, use the term defined in `GLOSSARY.md`. Don't drift to synonyms explicitly avoided there.

If a needed concept isn't in the glossary, reconsider inventing language or note the gap for `/domain-modeling`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly rather than silently overriding it.
