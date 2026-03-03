Edit compositing skill tags by editing the `skills` array for each project in `data/projects.json`.

Ranking notes:
- `featured_rank` controls default sort order on compositing when "All" is selected (lower = earlier).
- `skill_rank` controls sort priority when a specific compositing skill is selected (`{ "Skill Name": rank }`, lower = earlier).

Canonical Top 10 skills (for consistency):
- "Roto"
- "Paint / Cleanup"
- "Keying"
- "2D Tracking"
- "CG Integration"
- "Set Extension / DMP"
- "Warp / Distort"
- "Relighting"
- "Smart Vectors / STMap"
- "Tooling / Automation"
- "Projection"
- "Matchmove"
- "Look Change"
- "Effect Look Dev"

Commented reference block (copy/paste-friendly):

```js
// Allowed compositing skills:
// Roto
// Paint / Cleanup
// Keying
// 2D Tracking
// CG Integration
// Set Extension / DMP
// Warp / Distort
// Relighting
// Smart Vectors / STMap
// Tooling / Automation
```
