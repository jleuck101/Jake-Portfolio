# AGENTS.md

This repository is Jake Leuck's public-facing, recruiter-facing portfolio site. Treat every edit as something that may be seen by recruiters, studios, and collaborators.

## 1. General Editing Rules

- Preserve existing custom writing unless explicitly asked to rewrite it.
- Prefer structural improvements, organization, tag updates, embeds, and asset wiring over unnecessary copy rewrites.
- Keep edits narrow and intentional.
- Preserve the site's curated feel; do not overbuild solutions for simple needs.
- If uncertain about a project detail, do not guess. Report the ambiguity instead.

## 2. Project Page Editing Rules

- Preserve project-specific voice, framing, and concrete contribution details.
- Improve structure when helpful: section order, headings, embeds, before/after presentation, and supporting technical bullets.
- Do not flatten distinctive project pages into generic templates if the work benefits from segmentation.
- When a page has a clear hero shot and supporting shots, keep that hierarchy obvious.
- Remove placeholder or internal notes from public-facing pages rather than leaving them visible.

## 3. Writing Style

- Keep writing grounded, technical, and recruiter-friendly.
- Do not replace personal/project-specific wording with generic marketing language.
- Avoid inflated claims, vague hype, and portfolio filler language.
- When adding text, focus on real completed work, actual shot challenges, and concrete contributions.
- Avoid placeholder language like "drop GIF here later," "more coming soon," or internal-sounding notes on public pages.

## 4. Capitalization / Naming

- Use normal title casing for headings and labels.
- Shot codes may remain lowercase when intentionally styled that way, for example: `gst020`, `echo010`, `lgn010`.
- Do not force all headings or labels into lowercase just to match shot-code styling.
- Preserve project names and established naming where they are clearly intentional.

## 5. Asset Organization

- Follow the repo's existing folder conventions before creating new structure.
- Prefer organizing compositing assets under `images/compositing/` using existing subfolders such as:
  - `before_after/`
  - `stills/`
  - `thumbs/`
  - `node_trees/`
- Prefer organizing support docs and shot notes under a sensible root support folder rather than leaving them loose in the repo root.
- Move misplaced assets only when their destination is clear and references can be updated confidently.

## 6. Before / After Sliders

- Add before/after sliders only when a pair is confidently identified.
- Use the site's existing slider pattern rather than inventing a new one.
- If a possible before/after pair is ambiguous, leave it alone and report it.
- Before/after sliders should support the shot's presentation, not clutter the page.

## 7. Embeds / Media

- Wrong media is worse than missing media.
- Prefer the newest approved video link when explicitly provided.
- If a correct embed target is not known from the repo or explicit user instruction, do not guess.
- Keep embeds aligned with the correct shot section.
- If multiple shots exist on one page, make sure media order supports the project story instead of treating every clip as equally important.

## 8. Tags

- Use existing tag patterns and repo conventions.
- Tags should reflect the strongest accurate reading of the work.
- Prefer accurate, concrete technical tags over broader but weaker ones.
- Do not add tags based on assumptions about unseen work.

## 9. Lagoon-Specific Guidance

- `gst020` is the main hero/problem-solving Lagoon shot.
- `gst020` is the shot where the major split-face / two-take alignment challenge was worked out.
- `echo010` is the cleanup/paint contrast shot.
- `lgn010` is a supporting split-effect / fuller-body expansion shot.
- The Lagoon page should stay curated and should not become overcrowded with too many similar sequence shots.
- Supporting Lagoon shots can be included lightly, but they should not compete with `gst020` as the main technical breakthrough section.

## 10. Validation / Reporting Expectations

- After edits, report:
  - files changed
  - moved assets
  - embed assignments
  - ambiguities left unresolved
  - significant wording rewrites
- When asked for validation, answer directly and specifically.
- If lightweight checks are available, run them.
- If no real automated checks exist, do a targeted verification pass appropriate to a static site, such as searching for stale links, checking references, and reviewing diffs.

## 11. Things Agents Should Not Do

- Do not rewrite custom copy unless explicitly asked.
- Do not replace specific project framing with generic portfolio-speak.
- Do not guess project details, shot mappings, or embed targets.
- Do not leave public-facing placeholder language in pages.
- Do not overcrowd curated pages by treating every available asset as equally important.
- Do not make unrelated repo-wide edits when the request is page-specific.
