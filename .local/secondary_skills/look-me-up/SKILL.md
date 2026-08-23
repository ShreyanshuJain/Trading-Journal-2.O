---
name: look-me-up
description: Discover who the person you are talking to probably is from public sources. Use when you need to brainstorm with them, personalize a response, or they request you get to know them.
---

The user has asked you to find out who they are. Derive a corroborated profile of the person or organization to best brainstorm what they could build.

## When to Use

- The person asked you to look them up, or clicked something that did.
- You have a signup email address and nothing else.

## Constraints

At most 6 tool calls. Stop when the evidence gate is satisfied or the remaining budget cannot produce an independent signal.

Use public pages only.

## Available Functions

### signupIdentity({})

**Parameters:** none. It always describes the person in this conversation, and it cannot be pointed at anybody else.

**Returns:** Dict with:

- `username` (str): their Replit username
- `email` (str): the address they signed up with
- `firstName` (str): `""` when they never gave one
- `lastName` (str): `""` when they never gave one

## Method

1. Run `await signupIdentity({})` to get their email and name.

Then parallelise as much as possible:

2. Read possible names from the email handle. Treat a pseudonymous handle paired with a common name as unsuitable for person search.

2. Use the custom domain from the email to search for the strongest page. Gather the organization’s function, location, and size. Collapse all pages and search-index entities derived from that domain into one domain-class signal.

4. For founder or owner roles, search the name, city, and relevant business terms. When a business name surfaces, search that business with the city for its website, Maps listing, or registry presence.

5. Use independent sources to corroborate candidates. For example, check a registry, Maps listing, person page, independent organization chart, personal site, or similar pages related to the organization site.

6. Check `https://api.github.com/users/<username>` when a username is available. Count the profile when its name matches and it contains relevant evidence.

7. Use social searches after identifying an entity that needs corroboration. For example, constrain searches to LinkedIn, Instagram, TikTok, or Bluesky.

## Example

```javascript
// Turn 1: find out who you are talking to.
const me = await signupIdentity({});
const domain = me.email.split('@')[1];

// Turn 2: three source classes in one round trip.
const [byName, profile, byDomain] = await Promise.all([
  webSearch({ query: `"${me.firstName} ${me.lastName}"` }),
  webSearch({
    query: `"${me.firstName} ${me.lastName}", ${domain}`,
    category: 'people',
  }),
  webSearch({ query: domain }),
]);

// Decide to call more if signal warrants it.
```

A `people` search takes no `includeDomains`.

## Evidence gate

Treat evidence as independent only when it comes from different source classes.

The signup-domain website and search entities derived from that domain form one source class. Pair that signal with an independent class. For example, use a registry, Maps listing, person page naming the user, or independently sourced organization chart.

Use brand-derived social accounts to corroborate organization facts after establishing the organization’s identity.

Verify that every result URL belongs to the requested platform. Count only results hosted on that platform.

## Responding

Don't regurgitate the info you found about the user. Keep your response concise.

For 2+ source info, offer one or two things **only this person** could build, given what you now believe about their week. Not a list of things anybody in their industry might want; the point of looking someone up is that the suggestions could not have been written for anybody else.

For lower signal, offer to build them a personal website designed just for them and their style.

Then ask them which one is closest to something real to provoke them into refining on what to build.
