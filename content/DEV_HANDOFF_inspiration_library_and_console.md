# Beargo Dev Handoff — Inspiration Library + Content Console

**Audience:** Beargo developers building the admin content console  
**Related files in this handoff package:**

| File | Role |
|---|---|
| `beargo_365_inspiration_library.jsonl` | **Source of truth.** Machine-readable seed records (365). Use this in the console / LLM pipeline. |
| `catalog.md` | **Human browsing surface.** Same 365 entries, organized by Beargo format. Content people use this to pick seeds. |
| This document | Product + engineering context for how the two files plug into the console. |

---

## 1. What this library is

A curated research corpus of **365 BuzzFeed quiz *concepts*** scored for Beargo daily experiences.

Each record captures:

- the **interaction format** (one of 10 Beargo formats)
- the **creative pattern** (hook → mechanic → payoff)
- image / copyright risk notes
- a suggested original Beargo angle
- suitability scores for venue play (bar / restaurant / café / etc.)

It is **not**:

- a dump of BuzzFeed quiz bodies
- a set of questions/answers to republish as-is by default
- a scrape of full article text, result copy, or BuzzFeed images

Source titles and URLs are included so content can **inspect the original when needed**. The library itself stores conceptual design, not question banks.

---

## 2. Product goal

Beargo serves **one canonical interactive experience per day** across **all Hosts**.

Target experience constraints:

- completion time **15–45 seconds** (hard max **60**)
- mobile-first
- no account required to play
- no unnecessary PII
- low reading burden
- ideally **3–7** core interactions
- result must feel worth finishing (identity, score, champion, generated artifact, etc.)
- works alone in a noisy social venue
- no audio / no second player required
- quiz ends cleanly before any local-promotion monetization flow

The inspiration library exists so a content person can plant weekly seeds and an LLM can draft experiences that fit those constraints.

---

## 3. Console workflow to build

### Weekly cohort flow

1. Content person browses `catalog.md` (or a console UI backed by the JSONL).
2. They select **7 seeds** for the upcoming week.
3. They **copy/paste those 7 seed records into the console** (JSON — see §5).
4. For each seed, they set an adaptation mode (see §6).
5. An LLM instance drafts a full Beargo experience from each seed.
6. LLM also proposes image needs / image briefs where relevant.
7. Content person sources or uploads images (with LLM guidance).
8. Content person **previews and edits** in-console.
9. Content person **publishes the cohort of 7**.
10. **Experience #1 of the cohort goes live immediately** at all venues. Remaining days follow the scheduled order.

### Important publishing rule

- Publishing a cohort makes **day 1 live now**.
- Days 2–7 are scheduled relative to publish (or explicit calendar dates — product choice; default to sequential daily unlock from publish day).
- All Hosts see the **same** experience on a given day.

---

## 4. What developers should implement

### A. Seed intake

- Accept paste of **1–7 JSON seed objects** (prefer a JSON array of 7).
- Validate required fields (see §7).
- Optionally allow paste by `id` if the JSONL is loaded into the console DB — but **v1 should support raw JSON paste**, because that matches the content workflow.

### B. Adaptation mode (per seed)

```text
inspired     → use mechanic/hook/payoff; write original Beargo copy + interactions
near_adopt   → preserve the major essence of a strong source concept; allow minor changes
               (images, light wording, length compression, venue tone). Do not claim
               scientific/medical accuracy. Still no PII. Still ≤60s.
```

Default: `inspired`.

### C. LLM generation

Given a seed JSON + adaptation mode, generate a draft experience that includes at least:

- hook / title
- Beargo format template id
- interaction list (within suggested count / duration)
- result / payoff definition
- image brief (if `image_requirement` ≠ `none`)
- estimated duration seconds
- link back to seed `id` for audit

LLM system context should emphasize:

- venue fit (phone at a bar/table)
- screenshot / compare potential
- originality when mode = `inspired`
- essence-preserving compression when mode = `near_adopt`
- never invent medical/psychological diagnosis as fact
- avoid high copyright-risk assets unless product explicitly allows licensed use

### D. Preview / edit / images / publish

- In-console preview of the player experience
- Editable copy and interaction config
- Image attach / replace where needed
- Publish cohort → day 1 live everywhere

### E. Format engines (player runtime)

Build **10 reusable interaction templates**, not 365 one-offs:

1. Quick Trivia  
2. Personality Reveal  
3. Checklist  
4. Hot Takes  
5. Showdown  
6. Tap the Image  
7. Timed Recall  
8. Rank It  
9. Build Something  
10. Generator / Wildcard  

Console drafts should **map into these templates**. Content fills the template; runtime executes the template.

---

## 5. Which file is for what

| Actor | Use |
|---|---|
| Content person choosing seeds | `catalog.md` |
| Content person pasting into console | JSON objects from `beargo_365_inspiration_library.jsonl` |
| Console / LLM / DB | JSONL schema |
| Devs | This handoff + JSONL |

**Do not make Markdown the runtime paste format.** Markdown is for human selection. JSON is for generation.

### Recommended paste shape

Content pastes a JSON array:

```json
[
  { "...full seed record from jsonl..." },
  { "...second seed..." }
]
```

Or the console can accept 7 separate paste boxes. Array is simpler.

---

## 6. Adaptation modes (product policy)

Beargo’s content policy is intentionally flexible:

### `inspired` (common)

Use the seed’s format, pattern family, hook shape, and payoff type.  
Write original interactions and result copy.  
`original_beargo_inspiration` is a strong starting prompt, not mandatory wording.

### `near_adopt` (when a BuzzFeed concept is especially strong)

Preserve the **major essence** of the source idea.  
Allowed changes include:

- different / safer images
- shorter interaction count for the 60s cap
- venue-safe tone
- light wording changes
- swapping copyrighted assets for generic/licensed/generated ones

Still require:

- one experience works on mobile in a social venue
- no unnecessary PII collection
- no deceptive “clinically accurate” framing
- publishable image rights

Source URL/title on the seed exist so content/LLM can open the original when doing `near_adopt`. The library does **not** store the full question set; for near-adopt, content may need to re-open the public source page.

---

## 7. Seed schema (JSONL)

One JSON object per line. Key fields:

### Identity / source

| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `BF-000001` |
| `source` | string | usually `BuzzFeed` |
| `source_url` | string | public page URL |
| `source_title` | string | original title |
| `source_author` | string | may be empty |
| `source_date` | string | ISO date when known |
| `buzzfeed_category` | string | coarse category hint |

### Beargo classification

| Field | Type | Notes |
|---|---|---|
| `beargo_primary_format` | string | one of the 10 formats |
| `beargo_secondary_formats` | string[] | optional |
| `themes` | string[] | e.g. food, nightlife, dating |
| `pattern_family` | string | reusable mechanic family |
| `hook_pattern` | string | abstract hook shape |
| `interaction_summary` | string | what the player does |
| `payoff_summary` | string | what they get |
| `why_it_works` | string | creative rationale |

### Production guidance

| Field | Type | Notes |
|---|---|---|
| `beargo_60s_feasibility` | string | usually `yes` |
| `suggested_beargo_length_seconds` | number | target duration |
| `suggested_interaction_count` | number | target # interactions |
| `image_requirement` | string | `none` \| `optional` \| `recommended` \| `required` |
| `image_type` | string[] | illustration, stock, food, etc. |
| `copyright_asset_risk` | string | `low` \| `medium` \| `high` |
| `shelf_life` | string | `evergreen` \| `refreshable` \| `seasonal` \| `event-driven` |
| `original_beargo_inspiration` | string | original adaptation idea |
| `rejection_risk_notes` | string | caveats (fandom, IP, etc.) |
| `research_notes` | string | research metadata |

### Scores (1–10; overall is weighted)

| Field | Weight in overall |
|---|---:|
| `hook_strength` | 20% |
| `result_payoff_strength` | 20% |
| `interaction_strength` | 15% |
| `venue_fit` | 15% |
| `social_comparison_potential` | 10% |
| `shareability_potential` | 10% |
| `originality_of_pattern` | 10% |
| `overall_beargo_score` | computed |

Library entries were selected to generally score **≥ 7.0** overall.

### Console-only fields to add at paste time (not in JSONL)

| Field | Type | Notes |
|---|---|---|
| `adaptation_mode` | `inspired` \| `near_adopt` | set by content person |
| `scheduled_day_index` | 1–7 | order in the cohort |
| `notes` | string | optional human note to the LLM |

---

## 8. The 10 Beargo formats (runtime templates)

| Format | Player does | Typical payoff |
|---|---|---|
| Quick Trivia | short right/wrong questions | score / rank |
| Personality Reveal | preference choices | identity / archetype card |
| Checklist | tap all that apply | % / expertise label |
| Hot Takes | rapid judgments (fine/not, yum/yuck, etc.) | controversy / standards score |
| Showdown | this-or-that until one remains | champion |
| Tap the Image | image-centered identify/select | score / hawk-eye label |
| Timed Recall | name as many as possible under time | count / badge |
| Rank It | order a short list | priority archetype |
| Build Something | sequential constructive choices | identity / predicted outcome |
| Generator / Wildcard | few inputs → custom artifact | named cocktail, nickname, etc. |

`beargo_primary_format` on each seed tells the console which template to target.

---

## 9. Pattern families (creative mechanisms)

Useful for LLM prompting beyond format alone. Common values include:

- `objective_trivia_score`
- `unrelated_choices_surprise_result`
- `build_x_reveal_personality`
- `checklist_how_much_x`
- `binary_judgments_controversy_score`
- `elimination_tournament`
- `visual_identification_crop`
- `timed_free_recall`
- `rank_preferences_then_compare`
- `choose_inputs_generate_artifact`

Format = UI/template. Pattern family = creative mechanism.

---

## 10. Image handling

Use seed fields:

1. If `image_requirement` = `none` → generate text-first; skip image blocker.  
2. If `optional` / `recommended` → LLM may suggest images; content can publish without if needed.  
3. If `required` → block publish until images attached.  
4. If `copyright_asset_risk` = `high` → prefer generated / stock / original photography; avoid unlicensed fandom stills, logos, album art.

Console should surface image brief + risk on the edit screen.

---

## 11. Suggested LLM input package (per seed)

When generating one experience, feed the model:

1. full seed JSON  
2. `adaptation_mode`  
3. Beargo daily constraints (§2)  
4. target format template schema (your internal experience JSON)  
5. optional content-person note  

Ask it to return structured draft JSON matching your experience schema, plus:

- image briefs  
- estimated duration  
- warnings (IP risk, too long, weak payoff)

---

## 12. Diversity guidance for content (soft rules)

When planting 7 seeds, prefer mix across formats. Current library skew:

- Personality / Build Something are abundant  
- Rank It / some Hot Takes / Showdown are thinner  

Console can warn (not block) if a week is 5× Personality Reveal.

Also prefer:

- venue-friendly themes (food, nightlife, social behavior, travel, lifestyle)
- evergreen where possible
- limited high copyright-risk image days in one week

---

## 13. Non-goals / do-nots

- Do not scrape BuzzFeed quiz bodies into the product DB as a default path.  
- Do not treat every seed as a mandatory near-clone.  
- Do not require account/email/phone to play.  
- Do not ship experiences that need audio, multiplayer, or long reading.  
- Do not present entertainment results as medical, legal, or financial diagnosis.

---

## 14. V1 acceptance criteria for the console

A content person can:

1. Paste 7 seed JSON records  
2. Set `inspired` / `near_adopt` per seed  
3. Generate drafts via LLM  
4. Attach images where required  
5. Preview + edit  
6. Publish  
7. See experience #1 live immediately across venues  
8. See experiences #2–#7 scheduled for the following days  

Audit trail should retain seed `id`, adaptation mode, and final published experience id.

---

## 15. File locations in this package

```text
beargo_365_inspiration_library.jsonl   ← import / paste / LLM seeds
catalog.md                             ← human catalog for picking seeds
DEV_HANDOFF_inspiration_library_and_console.md  ← this file
```

If you later load the JSONL into a database, keep `id` as the stable key (`BF-000001` … `BF-000365`).

---

## 16. One-sentence summary for the team

**Content pastes 7 inspiration seeds from the 365 JSON library into the console; an LLM drafts Beargo experiences (inspired or near-adopt); humans add images, edit, and publish; day one goes live everywhere.**
