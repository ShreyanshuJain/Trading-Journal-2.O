---
name: project-handoff
description: Move this conversation into a project, or create a separate project for a different piece of work — with or without a confirmation card.
---

# Project Handoff

This conversation's sandbox is temporary — there is no persistent project
the user owns, deploys, or returns to. When the work deserves one, use one
of two functions:

- **`transitionToProject`** — continue *this* conversation in a project.
  You are the agent that continues there, and everything discussed comes
  along. **This is the right call in almost every case.**
- **`createNewProject`** — start a *separate* project for a different
  piece of work while this conversation continues. **Rare** — use it only
  when the user has said they want that work kept apart from this
  conversation, for example because they want to keep working here on
  something else, or asked for several independent builds.

When unsure, use `transitionToProject`: the user keeps their context, and
nothing is lost. Do not use `createNewProject` just because the work is
new or big.

Both take a required `askUser` boolean:

- **`askUser: true`** posts a card the user must confirm. Nothing happens
  until they do.
- **`askUser: false`** performs the action immediately — no card, no wait.
  The feed shows a notice of what happened. Use it when the user's first
  message clearly asked for a persistent app or project, or when they
  explicitly ask you to skip confirmation ("just do it", "don't ask");
  everywhere else — ambiguous intent, mid-conversation pivots — use
  `askUser: true`.

Offer, don't insist. If the user declines, keep helping them here, never
pass `askUser: false` for the declined action unless they explicitly ask
you to, and don't re-offer unless they bring it up again.

## Stack templates

When your instructions mention workspace stack templates, either function
accepts an optional `templateId` naming the template the new project
should start from. Short template lists appear inline in your
instructions; when the workspace curates more than fit there, call
`listTemplates({})` first to see every template's ID, title, and
description. Pass a `templateId` only when it clearly fits what the
user wants to build; omit it for the standard blank setup. IDs must come
from the list — anything else is rejected. On a confirmation card your
pick is a suggestion: the user can change or clear it, and you will be
told what they chose. With `askUser: false` your pick is final. The
template takes effect on `createNewProject`; `transitionToProject`
accepts the field, but today the move keeps this conversation's current
setup.

## Available Functions

### listTemplates()

List the workspace's curated stack templates: each entry's `templateId`
(what the `templateId` argument takes), title, and description. Use it
when your instructions point here instead of inlining the list, or when
you need to re-check what a template is before recommending it. Returns
`{ available: false }` when no list could be fetched this turn — offer
the standard setup in that case.

```javascript
await listTemplates({});
```

### transitionToProject({ askUser, title, templateId?, editorMode? })

Move this conversation into a project. You are the agent that continues
there: the move carries the whole conversation with it, so there is no
`prompt` argument and nothing to restate or hand off. Say what you need
to say in your message instead. The call accepts only the arguments
listed here — anything else is rejected.

- `title` — a few words naming the project. Name what is being built, not
  the conversation. With `askUser: true` the user can edit it before
  confirming.
- `templateId` (optional) — a workspace stack template from the list in
  your instructions (see "Stack templates" above).
- `editorMode` (optional) — set to `'design'` when visual work, such as a
  mockup, layout, or screen, is the primary result. Omit it otherwise.
  Works with either `askUser` value.

Use when the user wants to build the thing you have been discussing — the
common case for any handoff.

**Ends your turn** in both modes: with `askUser: true` the user decides
before anything else happens; with `askUser: false` the conversation is
already leaving for the project. Either way, say what you need to say
before calling it, in the same turn — never end a turn with only the
message.

If an `askUser: false` call fails, the move did not start — do not retry
with `askUser: false`; offer the confirmation card instead.

```javascript
await transitionToProject({ askUser: false, title: 'Invoice parser' });
```

### createNewProject({ askUser, prompt, title, templateId? })

Create a separate project and hand the work to the agent there.

Use only when the user wants the work kept apart from this conversation —
they said the work belongs in another project, asked for something
adjacent while continuing here, or want several things built
independently. When the work is the thing you have been discussing, use
`transitionToProject` instead.

- `askUser` — see above.
- `prompt` — what the agent in the new project should do. Write it for an
  agent that has not seen this conversation: state the goal and any
  decisions already made. Don't reference "what we discussed".
- `title` — a few words naming the project. Also the basis for its slug.
- `templateId` (optional) — a workspace stack template from the list in
  your instructions (see "Stack templates" above).

**Does not end your turn** in either mode, so you can set up several
projects in one go when the user asks for several things.

With `askUser: true`, the user can edit every field before confirming, so
treat none of them as final until their response arrives. If they change
something, you will be told what they changed it from — take the
correction as a signal about how they want the work framed. With
`askUser: false`, your values are final and the result names the
created project's id.

If an `askUser: false` call fails, the outcome may be unknown and the
failure message carries the project id that was reserved. Never call
`createNewProject` again for the same work in either mode — a retry can
create a duplicate project. Check `listProjects` for the title to see
whether the project exists, and tell the user what happened.

```javascript
await createNewProject({
  askUser: true,
  title: 'Invoice parser',
  prompt:
    'Build a Python CLI that reads PDF invoices from a folder and writes ' +
    'a CSV of vendor, date, and total. Use pdfplumber for extraction.',
});
```
