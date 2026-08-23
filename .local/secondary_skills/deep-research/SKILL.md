---
name: deep-research
description: Conduct thorough, multi-source research with structured reports and source scoring.
---

# Deep Research

Conduct comprehensive, multi-source research on complex topics: systematically gather, evaluate, triangulate, and synthesize information into structured reports with inline citations and source credibility scoring.

**Autonomy principle:** Operate independently. Infer assumptions from context (technical query = technical audience, comparison = balanced perspective, trend = recent 1-2 years). Only stop for critical errors or incomprehensible queries.

## When to Use

- Explicit research requests: "research this," "do a deep dive on," "write a research report / white paper / briefing on," "investigate [topic]"
- Industry and market analysis: "what's the state of [industry]," competitive landscapes (no stock tickers), trend analysis, country/region comparisons for a business activity
- Decision-support research: due diligence on private companies or markets, pros and cons or risks of a strategy, non-financial benchmarking against industry peers
- Verification and evidence-based analysis: fact-checking, "what does the research say about...", comparing conflicting claims, understanding a topic from multiple angles with cited sources
- Academic and technical evaluation: literature reviews, technology evaluations, state-of-the-art surveys

## When NOT to Use

- Simple factual lookups (1-2 searches) --> use web-search directly
- Searching within the user's codebase --> use grep/glob
- Replit-specific features --> use replit-docs skill
- Specific stock tickers, public company financials, DCF models, portfolio analysis --> use stock-analyzer (it calls deep-research internally for web research)
- "Analyze this dataset" with user-provided data --> use data-visualization
- "Build a presentation on..." --> use slides skill

## Depth Selection

Select the research depth based on the request complexity. Default to **standard** when unclear.

| Tier | Subagents | Min Sources | Phases | Estimated Time | When to Use |
|---|---|---|---|---|---|
| **Quick** | 3 | 8 | 1, 2, 3, 7 (+ source registry from Phase 4) | 2-5 min | Focused question, single domain, time-sensitive; "quick overview," "brief research" |
| **Standard** | 5 | 15 | 1-7 | 5-15 min | Most requests ("research this," "analyze"): market analysis, technology comparisons, country/industry analysis |
| **Deep** | 5 + 2 gap-fill | 25 | 1-7 (all) | 15-30 min | "Deep dive," "comprehensive," "exhaustive": critical decisions, literature reviews, state-of-the-art surveys, multi-stakeholder analysis |

## Methodology

### Phase 1: Scope Definition

Before starting research, clearly define:

- **Research question**: What specific question(s) are you answering?
- **Scope boundaries**: What is in/out of scope?
- **Depth tier**: Quick, Standard, or Deep (see table above)
- **Audience**: Technical, executive, general? (Infer from context if not stated)
- **Output expectations**: Report format, approximate length

Then run 1-2 broad landscape searches to orient yourself and identify the focus areas for decomposition:

```javascript
const overview = await webSearch({
  query: "What is the state of the electric vehicle market in 2026?",
  searchQueries: ["electric vehicle market 2026", "EV industry outlook 2026"],
});
```

### Phase 2: Planning & Decomposition

Decompose the topic into distinct, non-overlapping focus areas: 3 for Quick, 5 for Standard and Deep (Deep adds gap-fill subagents later in Phase 5). After the broad landscape search, identify angles that together cover the full topic without significant overlap. For example, researching "state of electric vehicles 2026" might decompose into:

1. **Market & Competition** -- market share, sales figures, manufacturer rankings
2. **Technology** -- battery chemistry, charging standards, range improvements
3. **Policy & Regulation** -- government incentives, emissions mandates, trade tariffs
4. **Infrastructure** -- charging network growth, grid capacity, urban vs rural
5. **Consumer & Economics** -- total cost of ownership, resale value, adoption demographics

#### Working notes: research/notes.md

Before launching any subagents, write the research plan to research/notes.md with your file tools. This file is the run's visible spine: the user reads it while subagents work, and Phase 7 drafts the report from it. Only you write to it -- subagents return structured text and you transcribe. Keep entries terse (bullets and [@key] markers, never prose): the notes are the skeleton, the report is the polish, and writing the report twice is the failure mode to avoid. Terse is not cryptic -- the user reads this file, so use plain language over methodology jargon, and labeled lines over run-on paragraphs.

```markdown
# Research Notes: [Topic]

**Status:** researching | cross-checking | drafting | complete
**Depth:** [Quick / Standard / Deep]

## Plan

- **Question:** [the research question, one sentence]
- **Scope:** [what is in and out of scope]
- **Audience:** [who the report is for]
- **Deliverable:** [report format and what it must contain]

## Focus Areas

| # | Area | Status | Sources |
|---|---|---|---|
| 1 | [Area] | pending | -- |

## Coverage Checklist

- [ ] [Concrete question the report must answer]

## Findings Log

_[@key] markers reference sources in research/sources.json; they become numbered citations in the final report._

### [Area 1]

[filled in as subagent results arrive]

## Conflicts & Open Questions

[conflicting figures, single-source claims still to be cross-checked]

## Gaps

[each gap -> filled by follow-up, or moved to Limitations]
```

Immediately after the first write, present the file so the user gets a clickable card in the chat instead of a buried file-edit line:

```javascript
await presentAsset({
  filePath: "research/notes.md",
  title: "Research Notes: [Topic]",
  description: "Research plan and running findings log, updated as research progresses.",
});
```

The card opens the live file, so every later edit shows through it -- present ONCE per run; re-presenting on updates duplicates cards in the feed.

**Coverage checklist:** The checklist section holds 5-8 concrete questions the final report must answer, derived from the research question. It is the stopping criterion: every item must be checked off or explicitly moved to Limitations before the report is written. Standard and Deep measure it in Phase 5; Quick skips Phase 5 and checks it directly at the Phase 7 quality gate, moving unanswered items straight to Limitations rather than searching further.

Update the file at each phase boundary -- after Phase 3 collection, during Phase 4/5, and at Phase 7 -- flipping the Status line as you go. Boundaries only: mid-phase edits burn turns without telling the user anything new.

### Phase 3: Parallel Source Discovery via Subagents

Launch all research subagents simultaneously with `subagent(...)` futures inside CodeExecution (see delegation skill). Each subagent gets a specific focus area, tailored search terms, and the structured output template below. The task template is the single source of truth for the webSearch/webFetch call contract -- subagents never see this skill, so every rule they need ships inside the task text. Fill in the brackets and ship it verbatim: paraphrasing away the call-contract lines is how a subagent ends up concluding it has no web tools.

#### Subagent task template

```javascript
const researchTask = `Research FOCUS AREA: [Area Name]

Topic context: [1-2 sentence description of the overall research question]

Your job: Search for information specifically about [focus area]. webSearch and webFetch are pre-registered callbacks in your CodeExecution environment -- call them directly; there is nothing to import, no skill doc to read first, and no Node runtime in the shell. Run at least 4 webSearch queries with different angles:

- [specific search term 1]
- [specific search term 2]
- [specific search term 3]
- [specific search term 4]

Each search is ONE call with this exact shape -- query is a REQUIRED string, and there is no queries parameter:

webSearch({ query: "<one full question>", searchQueries: ["<keyword variant>", "<keyword variant>"] })

Results come back in .resultPages (not .results), each with url, title, and snippet.

Pass every webSearch call a searchQueries list of 2-3 concise keyword variants (3-6 words each) alongside the query — results are noticeably better than with the query alone; query stays required, and searchQueries never replaces it. For time-sensitive topics, check today's date and use the current year in the variants; a year recalled from memory is often stale.

Local language searches: If this topic is specific to a non-English-speaking country or region, run at least 1-2 searches in the local language (e.g., Spanish for Latin America, Portuguese for Brazil, French for Francophone Africa). Primary government data, local media, and industry reports are often only available in the local language.

Source freshness: Note the publication date of every source. Flag any source older than 18 months on a fast-moving topic. For figures that move -- funding, valuations, pricing, versions, market share, leadership -- the first number a search surfaces is often last quarter's: spend one search on recent news for the entity (current month and year in the terms) before reporting such a figure as current, and attach an as-of date to every figure you report.

Run ALL searches before fetching anything, then pick the 2-3 pages worth reading: URLs that surfaced across multiple queries, authoritative domains, specific pages over homepages. Fetches are the scarce resource -- spend them on the best candidates, not the first result. SEO listicles and forum threads (Reddit, Quora) rank well because they are written to rank, not to be right: use them only as leads to the primary sources they cite.

Fetch each chosen page with ONE call carrying this exact shape (the function is webFetch -- there is no fetchPage, fetchWebPage, browse, or fetchUrl):

webFetch({ url, query: "<your focus-area question>", path: "research/sources/[focus-slug]-[NN]-[page-slug].md" })

Pass BOTH query and path on every research fetch. query has a fast model read the FULL fetched page and the result returns its answer in place of raw markdown -- never print or slice page markdown yourself; a slice silently drops everything below the fold. path saves the complete markdown to disk with a provenance header (URL, title, fetch date), and savedTo in the result confirms the save -- saved pages outlive your context and are what makes the report's citations verifiable later. Need something else from a page you already saved? Call webFetch again with a different query, same path.

webFetch THROWS on unfetchable pages (403s, dead links, crawl failures). Wrap calls in try/catch -- use Promise.allSettled for batches so one bad URL does not lose the rest -- and move to a DIFFERENT url from the search results on failure; never re-fetch the same failing URL.

Sources you cite from search snippets alone (without fetching): append each snippet with its URL, title, and date to research/sources/[focus-slug]-snippets.md. Every source you cite needs saved evidence -- the snippet is what the citation gets checked against later, so a claim more specific than its snippet needs the page fetched, or the claim dropped.

Return your findings using this EXACT structure:

## Key Facts

[Bullet list of key data points, each with source URL in parentheses]

## Notable Claims Requiring Cross-Reference

[Claims that seem important but only appear in one source, or that conflict with other findings]

## Source Quality Assessment

[For each source, rate: Tier 1 (government/multilateral/academic), Tier 2 (major publication/industry report), Tier 3 (blog/opinion/promotional). Note publication date.]

## Gaps & Unanswered Questions

[What you could not find or what needs deeper investigation]

## Sources

[Numbered list with title, URL, publication date (if available), tier rating, and the research/sources/ path for fetched pages]

Minimum: 5 distinct sources with URLs`;
```

#### Launch pattern

```javascript
const researchJobs = [
  subagent({ name: "research-1", task: `Research FOCUS AREA 1: [Area] ...`, config: { $kind: "general" } }),
  subagent({ name: "research-2", task: `Research FOCUS AREA 2: [Area] ...`, config: { $kind: "general" } }),
  subagent({ name: "research-3", task: `Research FOCUS AREA 3: [Area] ...`, config: { $kind: "general" } }),
  // ... (3 for Quick, 5 for Standard/Deep)
];

const researchResults = await Promise.all(researchJobs);
for (const researchResult of researchResults) {
  console.log(researchResult.text);
}
```

Size each subagent's task to the 4-6 searches and 2-3 fetches in the template: `subagent(...)` awaits time out at 300 seconds, and a job that runs past that gets backgrounded and must be collected separately with `waitForJob`.

After collecting all results, update research/notes.md in one pass: flip each Focus Area row to done with its source count, carry every "Notable Claims Requiring Cross-Reference" item into Conflicts & Open Questions, and set Status to cross-checking. (The Findings Log fills in during Phase 4, once registry keys exist to cite by.)

### Phase 4: Triangulation & Source Evaluation

After collecting all subagent results, systematically evaluate and cross-reference.

#### Source credibility tiers

| Tier | Description | Examples | Weight |
|---|---|---|---|
| **Tier 1** | Government, multilateral, academic, official statistics | IMF, World Bank, central banks, peer-reviewed journals, SEC filings | Highest -- treat as ground truth unless contradicted by multiple Tier 1 sources |
| **Tier 2** | Major publications, established industry reports, reputable news | Reuters, Bloomberg, Chambers & Partners, LAVCA, Big 4 reports | High -- reliable but verify key claims |
| **Tier 3** | Industry blogs, company websites, opinion pieces, promotional content | Company press releases, consultant blogs, sponsored content | Supporting only -- never use as sole source for a claim |

#### Triangulation rules

- Every major claim must be supported by **3+ sources** (at least 2 Tier 1 or Tier 2)
- When sources conflict on a data point, prefer: Tier 1 > Tier 2 > Tier 3, and more recent > older
- When Tier 1 sources conflict with each other, present both figures and note the discrepancy
- Flag any finding that rests on a single source, regardless of tier
- Note the publication date of key data points; flag anything older than 18 months on fast-moving topics

#### Conflict resolution for quantitative data

When multiple sources report different numbers (e.g., GDP figures, market sizes):

1. Prefer the primary/official source (e.g., central bank over news article)
2. If both are primary sources, present the range and note the methodology difference
3. Never silently pick one number -- acknowledge the variance

#### Source registry

As you evaluate, merge every subagent's source list into a single registry at research/sources.json: dedupe by URL, then give each source a stable kebab-case key (`replit-pricing`, `lovable-cloud-docs`) with its title, URL, publication date, tier, and saved-evidence path. The registry is the only numbering authority in the pipeline -- the draft cites keys, and numbers appear only when the final report is rendered (Phase 7). This step runs on every tier: Quick skips the rest of Phase 4, but the Phase 7 render depends on the registry, so build it before drafting.

With the registry built, transcribe each area's key facts into the Findings Log in research/notes.md as terse bullets, each carrying its [@key] marker, and record triangulation verdicts in Conflicts & Open Questions (which number won, or both figures plus the noted discrepancy). This is where the notes start paying for themselves: by Phase 7 every fact already carries its source key, so drafting is assembly plus prose, not recall.

### Phase 5: Gap Analysis & Follow-Up (Standard and Deep tiers only)

Review the collected findings for completeness:

- Measure the findings against the Coverage Checklist in research/notes.md, checking off each answered item with a one-line answer and its [@key]
- Identify claims with fewer than 3 supporting sources
- Identify sections with thin coverage or missing data
- Note unanswered questions flagged by subagents
- Check whether any focus area returned significantly fewer sources than others

**Stop rule:** fill a gap with at most two targeted attempts -- inline searches on Standard, the gap-fill subagents below on Deep. An item that survives both attempts moves to Limitations with the best available answer; searching past that point mostly re-finds the same pages, so spend the effort on synthesis instead. Record each gap's outcome in the Gaps section of research/notes.md: filled (by what) or moved to Limitations.

**For Deep tier only:** Launch 1-2 targeted follow-up subagents to fill the most critical gaps:

```javascript
const gapFillTask = `GAP-FILL RESEARCH: [Specific gap identified]

Context: During initial research on [topic], we found insufficient data on [gap].

Your job: Run 3-4 targeted searches to fill this specific gap:

- [targeted search term 1]
- [targeted search term 2]
- [targeted search term 3]

Each search is one webSearch({ query: "<one full question>", searchQueries: ["<keyword variant>", "<keyword variant>"] }) call -- query is a REQUIRED string (there is no queries parameter) and results come back in .resultPages. webSearch and webFetch are pre-registered callbacks in your CodeExecution environment; call them directly, nothing to import.

Fetch the 1-2 best pages (picked after all searches complete) with webFetch({ url, query: "<the gap question>", path: "research/sources/gapfill-[NN]-[page-slug].md" }) -- the result returns the answer in place of raw markdown and savedTo confirms the full page is on disk; never print or slice markdown. webFetch throws on unfetchable pages, so try/catch and move to a different URL. Append snippets for sources you cite without fetching to research/sources/gapfill-snippets.md.

Return findings using the same structured template as the initial research, listing the research/sources/ path for each fetched page.`;
const gapFillResult = await subagent({
  name: "gap-fill",
  task: gapFillTask,
  config: { $kind: "general" },
});
```

### Phase 6: Critique & Self-Review (Deep tier only)

Before writing the final report, conduct a critical self-review:

- **Weak claims:** Are any findings supported by only Tier 3 sources? Downgrade or remove them.
- **Balance:** Does the report present multiple perspectives, or does it lean toward one viewpoint?
- **Logical coherence:** Do the findings tell a consistent story? Are there contradictions that need to be addressed?
- **Completeness:** Does the report answer the original research question fully?
- **Freshness:** Are key data points current, or are they based on outdated sources?
- **Speculation vs. fact:** Is every claim clearly labeled as established fact, expert opinion, or speculation?

### Phase 7: Report Writing & Synthesis

Set Status in research/notes.md to drafting, then write the report from the notes, the registry, and the saved evidence -- the Findings Log and checked-off checklist are the report's skeleton, already keyed to sources. Verify and render citations before delivering.

Quick tier arrives here with the Findings Log empty (it skipped the rest of Phase 4 and Phase 5): fill it and the Coverage Checklist in one pass from the subagent results and the registry before drafting, moving unanswered checklist items to Gaps as Limitations entries.

Before drafting, run one news-scoped search per major entity covering the last few weeks. Volatile facts age fastest exactly when they matter most -- a report that misses yesterday's funding round or launch reads as stale throughout, however good the rest of the sourcing is. Anything the sweep turns up that the report will cite goes through the same door as every other source: fetch it with a research/sources/ path and add it to research/sources.json under its own key.

#### Writing style

- **Prose for analysis, tables for facts.** Write the argument in flowing paragraphs (80%+ of analysis sections), and put enumerable facts -- comparisons, pricing, timelines, spec matrices -- in tables, where a skimming reader picks up the skeleton of the report. Never bullet-dump what should be a paragraph or a table.
- Lead with the most important findings
- Support every factual claim with an inline [@key] citation from the registry, placed on the sentence it supports -- a paragraph drawing on three sources carries a marker at each claim, not a cluster at the end. Table rows cite like sentences do.
- Acknowledge limitations and uncertainties explicitly
- Distinguish clearly between established facts, expert opinions, and speculation
- Provide actionable recommendations where appropriate

#### Citation verification (Standard and Deep)

After drafting, re-check each major claim against its saved evidence under research/sources/ -- the saved page for fetched sources, the saved snippet for snippet-cited ones. Each [@key] marker names its source directly, so this is a lookup, not a hunt. Read the file (or `queryWithLLM` it with "Does this state that [claim]?") and fix or downgrade anything the evidence does not actually support; a claim too specific for its snippet needs the page fetched and saved, or the claim downgraded. After reading dozens of pages, claims drift -- numbers get rounded the wrong way, hedges get dropped, attributions blur between sources. This pass is what makes the citation markers trustworthy rather than decorative.

#### Citation rendering

The draft never contains hand-written citation numbers -- only [@key] markers. After verification, render mechanically: number keys in order of first appearance, replace each marker with `[[N]](<source URL>)` so clicking a citation opens the source itself, and emit the Sources section from the registry in the same pass (`N. [Title](URL) -- Published [date], Tier [1/2/3]`). A marker whose key is missing from the registry is an error to fix, never a number to guess; if the Sources section needs reordering or regrouping, re-render -- editing numbers by hand is how prose and source list drift apart. Take the header's Sources Consulted count from the rendered list, not memory.

#### Quality gates (must pass before delivering)

| Gate | Requirement |
|---|---|
| Source count | Quick: 8+, Standard: 15+, Deep: 25+ |
| Claims per finding | 3+ sources supporting each major claim |
| Citation coverage | Every factual claim carries an inline citation on the sentence it supports |
| No placeholders | Zero "TBD," "to be determined," or "[need source]" entries |
| Source list complete | Sources section rendered from the registry -- every marker's key resolves, every entry has a URL and saved evidence under research/sources/ |
| Citations verified | Major claims re-checked against saved evidence (Standard/Deep) |
| Citations rendered | Zero [@key] markers or hand-written numbers in the delivered report |
| Coverage | Every Coverage Checklist item in research/notes.md checked off or listed in Limitations |
| Freshness | Key data points are from the last 18 months (flagged if older); volatile figures carry as-of dates and survived the pre-draft news check |
| Prose ratio | 80%+ of analysis sections are prose, not bullets |

## Output Format

Save the report to research/[topic].md and present it with its own card: `presentAsset({ filePath: "research/[topic].md", title: "[Research Topic]", description: "..." })`. Then set Status in research/notes.md to complete and leave the file in place -- with research/sources/ it is the run's provenance trail.

```text
# [Research Topic]

**Research Date:** [Date]
**Depth:** [Quick / Standard / Deep]
**Sources Consulted:** [Number]

## Executive Summary

[2-3 paragraph overview of key findings and conclusions. 200-400 words.]

## Background

[Context needed to understand the topic. 200-500 words.]

## Key Findings

### Finding 1: [Theme]

[Detailed prose analysis with inline source citations [N]. 400-1,500 words.
When a finding compares enumerable things -- eras, phases, options, scenarios, tiers -- carry the comparison in a table with cited rows; prose makes the argument, the table holds the facts:]

| [Dimension] | [Case A] | [Case B] |
|---|---|---|
| [Row] | [fact [N]] | [fact [N]] |

### Finding 2: [Theme]

[Same structure. Additional findings as needed -- typically 4-8 for Standard/Deep.]

## Analysis

[Cross-cutting analysis, patterns, implications. Draw connections between
findings that reveal insights not visible in any single section. 500-1,000 words.]

## Limitations

[What couldn't be determined, data gaps, source constraints, caveats. 100-300 words.]

## Recommendations

[Actionable next steps based on findings. 200-500 words.]

## Sources

[Rendered from the registry, numbered by first appearance in the report]

1. [Title](URL) -- Published [date], Tier [1/2/3]
2. ...
```

## Limitations

- Cannot access paywalled academic journals or subscription databases
- Cannot access social media content (LinkedIn, Reddit)
- X/Twitter is the exception: read posts, users, and trends with the `externalApi__x` callback -- read `.local/skills/external-apis/references/x.md`
- Some pages are unfetchable (JavaScript-heavy sites, paywalled content, dead links)
- Web sources may have varying levels of reliability
- Research is a snapshot in time -- findings may change
- Cannot conduct primary research (surveys, interviews, experiments)
