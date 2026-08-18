# BearGo — Full Web App Build Specification

## Purpose

Build the full web application for **BearGo**, a game-first physical engagement network with an optional performance lead-generation layer.

The current MVP model is:

> **People scan a physical BearGo at a real-world establishment or host, play a three-question daily challenge, see their local daily ranking, and may then choose to help that establishment earn money from a company. If the company interests them, they can complete a verified introduction. Consumer startups pay a fixed CPL for startup-specific, email-verified, qualified, explicitly consented leads. The BearGo host receives a revenue share.**

The startup does **not** need to integrate with BearGo. The billable lead is created entirely on BearGo's platform.

The product deliberately separates three jobs:

1. **The game earns the scan and creates repeatability.**
2. **The company-payment reveal earns attention to the commercial layer through curiosity and altruism.**
3. **The sponsor's actual usefulness creates genuine lead intent.**

The consumer product must remain worthwhile even if the scanner never provides personal information and never becomes a lead.

---

# 1. Product definition

BearGo is:

> **A physical-world, location-based three-question daily challenge with a local leaderboard, paired with an optional company-funded introduction system that lets establishments and other BearGo hosts earn when interested consumers choose to connect with startup sponsors.**

The permanent consumer behavior should be:

```text
See BearGo
→ scan
→ play 3 questions
→ see how you rank here today
```

The optional monetization branch is:

```text
score
→ discover that a company can pay the host
→ learn how it works
→ see one sponsor
→ express genuine interest
→ complete verified introduction
→ company pays host
```

The game must not feel like bait for an ad. The commercial branch must feel optional, transparent, and separate from the promised game experience.

---

# 2. Core business model

## 2.1 MVP revenue model

Consumer startups pay a fixed **CPL — Cost Per Qualified Lead**.

A Qualified Lead is created on BearGo when the campaign's objective rules are satisfied.

Typical required components:

- sponsor ad viewed;
- eligible interest response selected;
- name provided;
- email provided;
- phone provided;
- email verified;
- required qualification/segmentation questions completed;
- startup-specific data-sharing consent completed;
- duplicate rules passed;
- fraud rules passed.

The startup pays because BearGo can independently prove the event.

## 2.2 Host economics

Each billable Qualified Lead creates:

- startup campaign spend;
- host earning;
- platform revenue.

Example:

```text
CPL: $10.00
Host share: $7.00
Platform share: $3.00
```

Do not call the host share a consumer **tip** in venue-facing UX.

The consumer should see language such as:

> **JobRadar paid The Rustic for your introduction.**

This must not be positioned as a replacement for ordinary gratuities to service staff.

## 2.3 Future monetization compatibility

Architect so BearGo could later support separately priced products such as:

- sponsored game exposure;
- sponsor-card engagement;
- company-funded micro-engagement;
- Qualified Leads.

Do **not** make CPM/CPV/sponsored-play billing part of MVP unless separately approved.

The MVP commercial event remains the Qualified Lead.

---

# 3. Primary actors

## 3.1 Scanner / player

- Arrives by scanning a physical BearGo QR.
- Primarily uses mobile web.
- Plays without creating an account.
- Sees three questions, one per page.
- Receives a same-location, same-day rank.
- Is not shown the sponsor before the game/result transition.
- Can ignore the commercial branch entirely.
- If they choose the commercial branch, sees one sponsor only.
- Provides personal information only after expressing sponsor interest.
- Pays $0.

## 3.2 BearGo Host / beneficiary

A Host is the person, establishment, organization, or group associated with the BearGo and eligible to receive company-funded earnings.

Examples:

- bar;
- pub;
- brewery;
- casual restaurant;
- food hall vendor/venue;
- café;
- barbershop;
- salon;
- comedy venue;
- music venue;
- bowling/arcade venue;
- student organization;
- independent performer;
- tour guide;
- trainer;
- market vendor;
- food truck.

The Host:

- receives one or more permanent BearGos;
- has a payout account;
- can have one or more physical placements;
- sees challenge and earning analytics;
- earns from Qualified Leads attributed to its BearGos.

## 3.3 Startup / sponsor / lead buyer

- Consumer startup that wants users/leads from the BearGo network.
- Defines the target consumer and objective Qualified Lead definition.
- Supplies one concise consumer value proposition and creative.
- Pays fixed CPL.
- Requires no SDK, webhook, callback, product modification, or referral integration.
- Receives leads with source and consent provenance.

## 3.4 Platform admin

- Manages Hosts, BearGos, placements, daily challenges, question generation, question review, startups, campaigns, leads, billing, payouts, fraud, analytics, and experiments.
- Uses a desktop-first operations console.

---

# 4. Non-negotiable product principles

## 4.1 The game is the permanent scan promise

The physical BearGo should promise the challenge, not the advertiser.

Recommended venue wording:

# SCAN THE PAW

**3 QUESTIONS**

**HOW DO YOU RANK HERE TODAY?**

The user should still receive the full game and rank if no sponsor is available.

## 4.2 Never require personal information to play or rank

No name, email, phone, account, or login is required to:

- start the game;
- answer the questions;
- see score;
- see local daily rank.

## 4.3 Do not reveal the sponsor before the game payoff

Before the score/result:

- no startup logo;
- no "sponsored by" line;
- no sponsor ad;
- no lead language;
- no contact request.

The game should feel editorially independent.

## 4.4 One sponsor only

After the commercial transition, show one sponsor.

If the scanner selects:

- Maybe later;
- I already use it;
- Not for me;

end gracefully.

Do not rotate into another advertiser in the same scan.

## 4.5 Genuine interest before PII

The startup card is shown **before** contact collection.

Only users who choose an eligible interest response enter the lead funnel.

## 4.6 No startup integrations

Do not build MVP around:

- startup SDKs;
- startup webhooks;
- postbacks;
- account-creation APIs;
- referral tokens preserved in startup onboarding;
- downstream activation tracking;
- startup-side conversion reporting.

## 4.7 Never depend on perfect repeat-user recognition

The game must remain useful to a totally anonymous returning player.

Cookies/local storage may improve UX but are not trusted identity.

Hard duplicate detection happens when an interested user provides email/phone.

## 4.8 Do not turn BearGo into an offerwall

A BearGo is a game with one optional commercial branch, not an endless series of offers.

## 4.9 Protect question quality as aggressively as lead quality

A wrong, ambiguous, stale, or boring trivia question damages the core consumer product.

Question content is first-class inventory.

---

# 5. Best-fit Host environments

The strongest environments combine:

- repeat foot traffic;
- natural downtime;
- social context;
- local identity/affinity;
- mobile-phone acceptability;
- enough dwell time for a 20–45 second game.

## 5.1 Priority launch categories

### Tier 1 — strongest

- bars / pubs;
- breweries / taprooms;
- social casual restaurants;
- food halls;
- sports bars;
- comedy venues;
- music venues;
- bowling / arcade / social entertainment venues.

### Tier 2 — strong

- independent cafés;
- college bars;
- student centers;
- barbershops;
- salons;
- food trucks with waiting/dwell time;
- markets / recurring vendor locations.

### Tier 3 — test selectively

- hotel bars/lobbies;
- laundromats;
- auto-service waiting areas;
- coworking/social lobbies;
- event/festival waiting zones.

### Generally weak or context-sensitive

- fine dining where the experience could feel cheapened;
- fast food with very low dwell time;
- grocery stores where users are task-focused;
- gyms during active workouts;
- medical settings where tone/context is wrong.

The first commercial deployment should prioritize **bars, breweries, and social casual restaurants**.

---

# 6. BearGo placement strategy

The QR should look venue-authorized and intentional.

Potential placements:

- restroom mirror/sink area;
- restroom entry/exit wall;
- table tent;
- bar-top card;
- check presenter;
- waiting area;
- lobby;
- queue area;
- venue-specific wall display.

Avoid looking like a random sticker placed by a third party.

Each physical placement should contain:

- BearGo brand;
- venue/Host identity where useful;
- short trusted domain below QR;
- tamper-resistant/tamper-evident design where possible;
- unique BearGo ID for source attribution.

Do not assume restroom placement is best. The system must support placement experiments.

---

# 7. Recommended top-level app structure

```text
/
 /how-it-works
 /for-hosts
 /for-startups
 /privacy
 /terms
 /host-terms
 /startup-terms

 /p/:pawToken
 /p/:pawToken/play
 /p/:pawToken/result
 /p/:pawToken/company
 /p/:pawToken/sponsor
 /p/:pawToken/intro
 /p/:pawToken/verify
 /p/:pawToken/complete

 /host/login
 /host/onboarding
 /host/dashboard
 /host/challenges
 /host/earnings
 /host/paws
 /host/profile
 /host/settings
 /host/payouts

 /startup/login
 /startup/onboarding
 /startup/dashboard
 /startup/campaigns
 /startup/campaigns/:campaignId
 /startup/leads
 /startup/leads/:leadId
 /startup/exports
 /startup/billing
 /startup/settings

 /admin
 /admin/hosts
 /admin/hosts/:hostId
 /admin/paws
 /admin/placements
 /admin/challenges
 /admin/questions
 /admin/question-generation
 /admin/startups
 /admin/startups/:startupId
 /admin/campaigns
 /admin/campaigns/:campaignId
 /admin/leads
 /admin/leads/:leadId
 /admin/sessions
 /admin/leaderboards
 /admin/consent
 /admin/fraud
 /admin/payouts
 /admin/billing
 /admin/experiments
 /admin/analytics
 /admin/settings
```

Exact route names may differ.

---

# 8. Public marketing website

## 8.1 Home

The home page should explain BearGo as a physical engagement product first.

Possible headline:

# THREE QUESTIONS. ONE LOCAL RANKING. ONE PAW.

Possible explanation:

> Scan a BearGo at a participating place. Play today's three-question challenge. See how you rank there today. If you want, you can also help that place earn from a company without spending anything.

Sections:

- how the BearGo Challenge works;
- daily local rankings;
- how Hosts earn;
- for venues/Hosts;
- for startups;
- trust/transparency;
- FAQ.

Do not lead the consumer site with CPL or lead-generation terminology.

## 8.2 For Hosts

Core proposition:

> **Give customers a reason to scan again and again — and create a new company-funded revenue stream when they choose to connect with sponsors.**

Explain:

1. display a permanent BearGo;
2. customers play today's three questions;
3. they see how they rank at your location;
4. after the game, some choose to learn how a company can pay you;
5. genuinely interested people can connect with a sponsor;
6. qualified introductions create Host earnings.

Host lead form:

- business/Host name;
- legal entity name;
- location(s);
- Host type;
- contact name;
- email;
- phone;
- website/social links;
- average traffic if known;
- desired placement;
- notes.

## 8.3 For Startups

Primary headline:

# GET QUALIFIED HOUSTON CONSUMER LEADS AFTER REAL-WORLD ENGAGEMENT.

Core proposition:

> BearGo creates repeatable physical-world engagement through a three-question local challenge. After players receive their score, they can voluntarily discover one sponsor. Only people who express real interest enter your lead funnel. We verify and qualify the lead on BearGo. **No integration required.**

### How it works

1. Define the consumer you want.
2. Approve your one-page sponsor creative.
3. Define eligible interest responses.
4. Define required lead fields and 1–2 qualification/segmentation questions.
5. Agree CPL and budget.
6. BearGo routes your campaign to eligible Houston locations.
7. Qualified Leads appear in your dashboard.
8. Export/follow up.

Example:

```text
Qualified Lead:
Houston BearGo source
+ viewed JobRadar sponsor card
+ selected "I'd try it"
+ name
+ verified email
+ phone
+ required answers
+ startup-specific consent
+ duplicate/fraud checks passed

CPL: $10
Pilot: 100 leads
Maximum spend: $1,000
```

CTA:

**Launch a 100-lead pilot**

---

# 9. Physical BearGo design

For establishment deployments, recommended core copy:

# SCAN THE PAW

**3 QUESTIONS**

**HOW DO YOU RANK HERE TODAY?**

Optional small text:

> ~30 seconds

The QR should be embedded in or visually centered within the BearGo.

Requirements:

- high contrast;
- QR-safe quiet zone;
- scan-tested at realistic distances/angles;
- clear brand;
- venue-authorized look;
- print-ready vector version;
- permanent BearGo token;
- no startup logo;
- no "tip" language;
- no commercial promise required on physical sign.

The physical artifact should survive campaign changes and monetization changes.

---

# 10. Daily BearGo Challenge format

The default game is a **three-question multiple-choice daily challenge**.

Rules:

- exactly 3 questions for MVP;
- one question per screen;
- four choices by default;
- no login;
- no PII;
- same challenge set for the same Host/local date;
- correctness ranks before speed;
- speed breaks ties among equal correctness groups;
- daily leaderboard resets by Host local timezone.

The product should not become a generic long-form trivia app.

The point is a fast, socially shareable microcompetition.

---

# 11. Trivia format family

Use a consistent three-question ritual but vary question style.

Supported editorial types can include:

- classic general knowledge;
- surprising comparison;
- which came first;
- which is real;
- closest estimate using multiple-choice ranges;
- local/city knowledge;
- neighborhood knowledge;
- food/culture;
- music/entertainment;
- sports where appropriate;
- venue-category context;
- visual identification later.

Do not make all three questions obscure fact recall.

A good question should often cause one of these reactions:

- "I definitely knew that.";
- "There's no way that's true.";
- "Wait, what did you answer?";
- "That's actually interesting.".

The questions should be capable of sparking conversation at the table/bar/venue.

---

# 12. Daily difficulty design

Default set composition:

### Question 1 — accessible

A broad audience should have a reasonable chance.

### Question 2 — medium / interesting

Should create meaningful separation without feeling obscure.

### Question 3 — bragging-rights question

Harder, but still answerable through knowledge/reasoning rather than arbitrary obscurity.

Use actual answer distributions to recalibrate difficulty over time.

Do not rely only on an LLM's subjective "easy/medium/hard" label.

---

# 13. Scoring and leaderboard

Ranking order:

1. number correct descending;
2. total answer time ascending;
3. deterministic tie-breaker if still tied.

Therefore:

```text
3/3 in 40 seconds
ranks above
2/3 in 5 seconds
```

Show a simple result:

> **3 / 3**  
> **14.7 sec**  
> **#6 at The Rustic today**  
> **You beat 43 players**

Optional:

> **Top 12% today**

Do not expose a complicated points equation.

## 13.1 Timing

Measure active response time per question, excluding:

- transition animation;
- answer explanation reading;
- result animation;
- commercial screens.

Preload question data where practical to reduce network differences.

Because the leaderboard has no high-value prize in MVP, perfect anti-cheat timing is not required, but blatant manipulation should be rate-limited/flagged.

## 13.2 Leaderboard scope

Default:

- one Host;
- one local calendar day;
- one challenge version.

Use language such as:

> **#6 at The Rustic today**

Do not claim "among diners" unless BearGo can actually establish dining status.

Use "players at The Rustic today" as the precise underlying population.

---

# 14. LLM question-generation system

Use an LLM API to generate **candidate questions ahead of time**, not live during scanner play.

The question-generation system should be batch-oriented.

Suggested nightly pipeline:

```text
Host profile + location context + question history
→ generate candidate pool
→ structured validation
→ factual verification / source checks
→ ambiguity check
→ safety/content filter
→ duplicate/repetition check
→ difficulty/diversity selection
→ assign 3-question set to Host/local date
→ freeze set
→ serve identical set to players
```

For the pilot, strongly prefer human/admin review before publication.

As reliability is demonstrated, approval can become increasingly automated.

---

# 15. Question candidate schema

Each generated candidate should store structured fields such as:

```text
id
question_text
choice_a
choice_b
choice_c
choice_d
correct_choice
short_explanation
conversation_hook
category
subcategory
location_relevance
venue_relevance
estimated_difficulty
source_notes
source_urls_or_references
valid_from
valid_until
sensitivity_flags
generation_model
generation_prompt_version
verification_status
created_at
```

The **short_explanation** should be concise and interesting enough to show after an answer.

The **conversation_hook** is an internal quality field indicating why the fact is worth discussing.

---

# 16. Question sourcing strategy

Do not generate three fully bespoke venue facts every day at scale.

Build layered inventory:

### Global pool

Evergreen, interesting general questions.

### City pool

Houston-specific questions.

### Neighborhood pool

Montrose, Downtown, EaDo, Heights, etc.

### Category pool

Music, food, sports, nightlife, coffee, college, etc.

### Host-specific pool

Verified facts about the particular establishment when useful.

A typical daily set might combine:

```text
1 global surprise question
+ 1 Houston/local question
+ 1 venue/category question
```

Different Hosts can receive different combinations while preserving editorial quality and manageable verification load.

---

# 17. Question quality controls

Reject questions that are:

- ambiguous;
- dependent on debatable definitions;
- stale/current without verification;
- too obscure;
- trivially obvious;
- repetitive;
- poorly worded;
- culturally inappropriate for the Host;
- likely to start unwanted political/medical/sensitive disputes;
- promotional for the day's sponsor;
- based on unverified local facts.

For time-sensitive questions, require a validity window and re-verification.

Provide a player-facing:

> **Report this question**

link after the game or in a small menu.

Reported questions enter admin review.

---

# 18. Sponsor editorial separation

The challenge itself should remain independent from the advertiser.

Do not ask questions such as:

> Which is the best job-search app?

with JobRadar as the intended answer.

Do not insert sponsor branding between questions.

Do not reveal the sponsor before the game/result transition.

This protects the learned consumer meaning:

> **BearGo = today's local challenge.**

not:

> **BearGo = a disguised ad.**

---

# 19. Bear and motion system

The bear is the guide/character, not a source of clutter.

Required animation states:

## 19.1 Arrival

- brief entrance;
- subtle reaction;
- immediately yields to challenge CTA.

## 19.2 Question transitions

- fast reaction to answer;
- optional correct/incorrect expression;
- never slows game cadence materially.

## 19.3 Score celebration

- stronger celebration after Q3;
- score/rank animates into place;
- bear celebrates the player's result.

## 19.4 Commercial handoff cue

This is critical.

As the rank finishes settling:

- a second card is already visible, peeking from the bottom of the viewport;
- the card rises slightly;
- one restrained pulse/upward nudge occurs;
- an upward chevron is visible;
- bear subtly looks/gestures toward the card;
- the score remains visible above it.

Do not wait several seconds and then inject the card.

Do not auto-navigate away from the score.

Support both:

- swipe up;
- tap card/chevron.

## 19.5 Commercial completion

Use a second, distinct happy-bear animation when a Qualified Lead successfully creates Host earnings.

---

# 20. Canonical scanner journey

This is the canonical MVP flow.

## Step 1 — Physical BearGo

Scanner sees:

# SCAN THE PAW

**3 QUESTIONS**

**HOW DO YOU RANK HERE TODAY?**

They scan.

Create a session tied to:

- BearGo;
- Host;
- placement;
- physical location;
- local date;
- challenge set;
- experiment variant;
- campaign candidate if available.

## Step 2 — Game intro

> # Today's BearGo Challenge
>
> **3 questions.**
>
> Correct answers + speed determine your rank.

CTA:

# PLAY

Optional small context:

> The Rustic · Today

No sponsor appears.

## Step 3 — Question 1

One question, four answers.

Record:

- question rendered/started;
- answer;
- correctness;
- active response time.

Show only a brief answer reaction/explanation.

## Step 4 — Question 2

Same structure.

## Step 5 — Question 3

Same structure.

On answer, finalize score and rank.

## Step 6 — Score reveal

Bear celebrates.

Example:

> # 3 / 3
>
> **14.7 sec**
>
> ## #6 at The Rustic today
>
> You beat 43 players.

The game promise is now fully delivered.

## Step 7 — Immediate second-card teaser

As the result animation resolves, the lower card is already peeking into view.

Visible copy:

> # YOU CAN MAKE A COMPANY PAY THE RUSTIC.
>
> **You pay nothing.**
>
> ↑

The user can tap or swipe upward.

This card must not look like a banner advertisement.

No sponsor name/logo yet.

## Step 8 — Company-payment hook screen

Expand the card to a dedicated screen:

> # You can make a company pay The Rustic.
>
> **You pay nothing.**

CTA:

# SHOW ME

This screen exists to create curiosity, not explain everything.

## Step 9 — Mechanism explanation

Tap **SHOW ME**:

> # Here's how it works
>
> **Companies want to meet people who might genuinely like what they offer.**
>
> If today's sponsor interests you, you can choose to connect with them.
>
> **If you do, the sponsor pays The Rustic for the introduction.**
>
> **You pay $0.**

CTA:

# SEE TODAY'S SPONSOR

## Step 10 — Sponsor reveal

> ### TODAY'S SPONSOR
>
> # JobRadar
>
> **JobRadar helps you discover jobs matched to what you're looking for.**

Show one strong product visual.

Then:

> ## How does that sound?

Options:

- **I'd try it**
- **Seems useful**
- **Maybe later**
- **I already use it**
- **Not for me**

No PII yet.

## Step 11A — Non-interest branches

### Maybe later

> No problem. Thanks for playing today's BearGo Challenge.

### I already use it

> Got it — no need to connect you again. Thanks for playing.

### Not for me

> No problem. Thanks for checking them out.

Then end.

No second sponsor.

## Step 11B — Interested branch

For campaign-eligible interest responses:

> # Great.
>
> **If you complete the introduction, JobRadar pays The Rustic.**

CTA:

# CONTINUE

Campaign configuration determines which interest options enter the lead path.

## Step 12 — Contact details

> # Your details

Fields:

- **Name**
- **Email**
- **Phone**

Subtext:

> **We'll verify your email before the introduction is complete.**

Transparency:

> If you finish, the information you provide will be shared with JobRadar.

CTA:

# CONTINUE

Phone is collected but not verified in MVP.

## Step 13 — Immediate duplicate check

After contact submission, before unnecessary verification work, check startup-level duplicate rules using normalized email and phone.

If previously delivered to JobRadar:

> # Looks like you've already connected with JobRadar.
>
> **No need to do it again.**

End gracefully.

No charge and no Host earning.

This works even if the user cleared cookies, changed browser, or used another device.

## Step 14 — Email verification

If new:

> # One quick check
>
> We sent a verification link to **jane@gmail.com**.
>
> Tap it to keep going.

Verification email:

> **Verify your email**
>
> You're almost done.
>
> **VERIFY & CONTINUE**

Return directly to the same BearGo session.

Support:

- resend;
- change email;
- expired token;
- already verified;
- secure token expiry;
- idempotent verification.

## Step 15 — Qualification + consent on same screen

> # Almost done

Ask only 1–2 startup-relevant questions.

Example:

> **Where are you in your job search?**
>
> - Actively looking
> - Open to opportunities
> - Just exploring

Then:

> **What kind of work interests you most?**

At the bottom:

> JobRadar will receive the details and responses you provided when you finish.

Consent:

> By finishing, you agree that we may share your name, email, phone number, and responses with JobRadar so they can follow up about their service.

CTA:

# FINISH INTRODUCTION

There is **no separate confirmation screen** after qualification.

## Step 16 — Qualified Lead creation

On FINISH INTRODUCTION, evaluate the campaign rules.

Example:

```text
sponsor_viewed = true
interest_response = eligible
name_present = true
email_present = true
phone_present = true
email_verified = true
qualification_complete = true
qualification_passed = true
startup_specific_consent = true
duplicate_check = passed
fraud_check = passed
```

If payable:

- create Qualified Lead;
- create Consent Receipt;
- charge startup campaign balance;
- create Host earning;
- create platform revenue.

## Step 17 — Commercial completion

Bear celebrates.

> # You did it.
>
> **JobRadar paid The Rustic for your introduction.**
>
> **You paid $0.**

If amount can be shown:

> ## The Rustic earned $7.00

Optional:

> **CHECK OUT JOBRADAR**

The outbound click is not required for billing.

---

# 21. Score-to-commercial transition requirements

This is one of the highest-risk UI moments in the product.

The user must not mentally finish the experience before noticing the commercial curiosity loop.

Requirements:

- score appears first and remains readable;
- commercial teaser appears within the same viewport;
- teaser is visible as the score animation resolves;
- teaser does not obscure rank;
- teaser is not sponsor-branded;
- one restrained pulse/upward nudge;
- bear gesture may reinforce direction;
- user can swipe or tap;
- no forced transition;
- no looping obnoxious bounce;
- no auto-playing ad.

Primary teaser copy:

> **YOU CAN MAKE A COMPANY PAY THE RUSTIC.**
>
> **You pay nothing.**

Primary action:

> **SHOW ME**

Test variations of capitalization, card height, motion, bear gaze, timing, and CTA.

---

# 22. Lead-path BearGo progress

The game itself uses score/rank, not BearGo completion progress.

If a digital BearGo progress motif is used during the lead path, begin only after an eligible sponsor-interest response.

Suggested mapping:

| Milestone | BearGo state |
|---|---:|
| Eligible sponsor interest | first toe |
| Contact submitted | second toe |
| Email verified | third toe |
| Qualification completed | fourth toe |
| Qualified Lead created | center pad / complete |

Do not make progress so rewarding that users fake sponsor interest purely to fill the BearGo.

---

# 23. Sponsor-free and no-eligible-campaign behavior

The game must continue even if no sponsor can be served.

Flow:

```text
scan
→ game
→ rank
→ normal game completion
```

If no sponsor is available:

- do not show a broken state;
- do not show the "make a company pay" teaser;
- do not fabricate a sponsor;
- optionally show a simple "Thanks for playing" bear state.

This is a core sunset-proofing feature: BearGo remains useful independent of campaign inventory.

---

# 24. Repeat-use and identity strategy

## 24.1 BearGo must work anonymously forever

Do not require recognition to make repeat scans worthwhile.

A person who cleared cookies should still get:

- fresh challenge;
- local daily ranking;
- sponsor interest gate;
- ability to select Already use it / Not for me.

## 24.2 Soft recognition

Cookies/local storage may store:

- prior BearGo visit;
- prior challenge participation;
- optional remembered settings;
- optional saved-details preference.

Treat these as convenience, not identity proof.

## 24.3 Optional saved details

After a successful commercial introduction, optionally offer:

> **Save my details for future BearGos**

If accepted:

- securely associate verified email identity;
- prefill Name/Email/Phone on future eligible lead paths;
- do not silently share with new sponsors;
- require new sponsor-specific consent.

## 24.4 Hard duplicate detection

Once contact information is submitted, server-side duplicate detection protects startup economics even if browser identity is lost.

## 24.5 Existing-user self-selection

The sponsor-interest gate must always include:

> **I already use it**

This prevents many repeat/duplicate annoyances before contact collection.

---

# 25. Commercial truthfulness constraint

The product must not promise a Host payment before the system can truthfully deliver one.

The phrase:

> **If you complete the introduction, JobRadar pays The Rustic.**

should only be used when campaign rules make completion itself sufficiently deterministic.

Preferred campaign design:

- interest response is a major qualification gate;
- location/source eligibility is known before the lead flow;
- required contact fields are objective;
- email verification is objective;
- final questions primarily segment/enrich rather than unexpectedly disqualify large percentages of willing users.

If a campaign has narrow disqualifying criteria, consumer copy must be adjusted, for example:

> **If you're a match and complete the introduction, JobRadar pays The Rustic.**

Avoid campaigns where large numbers of users are told they can help the Host and only discover at the end that they cannot.

Track qualification-failure rate as a trust metric.

---

# 26. Host onboarding

Host types:

```text
venue
local_business
individual_creator
organization
event
temporary_activation
```

Required fields:

- legal entity / legal name;
- public display name;
- Host type;
- primary contact;
- email;
- phone;
- website/social links optional;
- physical location(s);
- payout entity;
- payout onboarding status;
- terms acceptance.

Statuses:

```text
applied
under_review
approved
active
paused
suspended
rejected
```

For each approved Host:

- create permanent Host record;
- create one or more BearGo records;
- assign placement/location;
- generate QR and print-ready BearGo assets;
- configure local timezone;
- configure question-content profile.

---

# 27. Host challenge profile

Each Host should have a content profile that guides daily question composition.

Fields can include:

```text
host_id
city
neighborhood
host_type
audience_notes
preferred_categories
excluded_categories
local_topics
venue_topics
brand_tone_notes
minimum_difficulty
maximum_difficulty
content_sensitivity_notes
active
```

Examples:

### Brewery

- Houston;
- beer/food culture optional;
- music;
- local history;
- general knowledge;
- sports optional.

### College location

- campus history;
- pop culture;
- general knowledge;
- local city;
- avoid questions requiring age-restricted context.

Hosts may suggest factual venue facts, but Host-submitted facts must be verified before entering question inventory.

---

# 28. Host dashboard

Mobile-first / responsive.

## 28.1 Today

Show:

- BearGo scans;
- game starts;
- game completions;
- players ranked;
- current player count;
- sponsor-card reveals;
- sponsor-interest responses;
- Qualified Leads;
- Host earnings.

Optional fun Host-facing widget:

> **Today's fastest 3/3: 11.2 sec**

Do not expose player PII.

## 28.2 This month

- scans;
- game completion rate;
- commercial teaser engagement rate;
- sponsor view rate;
- Qualified Leads;
- Host earnings;
- earnings / 100 game completions;
- earnings / 100 scans;
- repeat-scan estimate where available.

## 28.3 Challenges

Host can view:

- today's challenge after it has gone live;
- historical challenge sets;
- answer distribution;
- disputed/reported-question status.

Host should not be able to secretly edit live answer keys.

## 28.4 BearGo / placement

Show:

- BearGo QR;
- BearGo token/ID;
- placement name;
- print asset;
- status;
- installation guidance.

## 28.5 Earnings

Show:

- available balance;
- pending/held amount if applicable;
- earning ledger;
- payout history;
- payout onboarding state.

Do not expose lead PII.

---

# 29. Startup onboarding

Desktop-first.

Fields:

- legal company name;
- display name;
- website;
- category;
- headquarters;
- billing contact;
- primary admin;
- product description;
- one-sentence consumer value proposition;
- target consumer;
- Houston serviceability;
- privacy policy URL;
- terms URL.

Statuses:

```text
lead
qualified
pilot_negotiation
approved
active
paused
closed
rejected
```

---

# 30. Campaign creation

A startup cannot publish without admin approval.

## 30.1 Sponsor identity

- campaign name;
- startup;
- logo;
- one-page sponsor creative;
- one-sentence value proposition;
- product image/screenshot;
- optional post-completion URL.

The sponsor ad should fit on one mobile screen where possible.

## 30.2 Interest gate

Default prompt:

> **How does that sound?**

Default options:

```text
I'd try it
Seems useful
Maybe later
I already use it
Not for me
```

Store which responses are eligible to continue.

For many campaigns, preferred lead-eligible options are:

- I'd try it;
- optionally Seems useful.

Do not automatically treat Maybe later as a high-intent Qualified Lead.

## 30.3 Contact fields

MVP defaults:

- Name;
- Email;
- Phone.

Verify email only.

## 30.4 Qualification questions

Support:

- single select;
- multi-select;
- dropdown;
- short text only if necessary.

Target:

**1–2 questions.**

Store:

- question;
- answer options;
- required status;
- qualification logic;
- segmentation-only vs disqualifying classification.

## 30.5 Qualified Lead definition

Machine-evaluable ruleset.

Example:

```text
sponsor_viewed = true
AND interest_response = "id_try_it"
AND email_verified = true
AND phone_present = true
AND consent_completed = true
AND duplicate = false
AND fraud_blocked = false
```

Optional campaign-specific answer requirements may be added.

## 30.6 Commercial terms

- CPL;
- Host share percent or fixed amount;
- platform share;
- budget;
- max leads;
- start/end date;
- prepaid balance;
- minimum balance threshold;
- payment terms.

## 30.7 Host/location eligibility

Campaign can target:

- city;
- neighborhood;
- Host category;
- specific Hosts;
- campus;
- venue type;
- day/time windows if appropriate.

## 30.8 Consent

Store:

- named startup;
- exact consent text;
- fields shared;
- purpose;
- startup privacy policy;
- version;
- permitted use.

## 30.9 Duplicate rules

Examples:

- same normalized email previously delivered to startup;
- same normalized phone previously delivered within defined window;
- previously confirmed startup user if startup supplies a one-time suppression list manually;
- fraud pattern.

No live integration is required.

## 30.10 Campaign status

```text
draft
commercial_review
creative_review
ready
live
paused
budget_exhausted
ended
archived
```

---

# 31. Startup dashboard

Desktop-first.

## 31.1 Executive summary

- active campaigns;
- campaign budget;
- spend;
- Qualified Leads;
- CPL;
- remaining balance;
- campaign status.

## 31.2 Full BearGo funnel

```text
BearGo scans
→ game starts
→ game completions
→ result views
→ commercial teaser views
→ teaser opens
→ mechanism explainer views
→ sponsor views
→ eligible interest responses
→ contact submissions
→ duplicates detected
→ emails verified
→ qualification completions
→ Qualified Leads
```

This allows the startup to understand both reach and high-intent conversion without billing on the upper-funnel events in MVP.

## 31.3 Source performance

Break down by:

- Host;
- Host type;
- BearGo/placement;
- physical location;
- neighborhood;
- day;
- time;
- challenge set;
- sponsor creative variant;
- interest response.

## 31.4 Lead table

Columns:

- lead ID;
- name;
- verified email;
- phone;
- phone verification = no in MVP;
- interest response;
- qualification summary;
- Host;
- placement/location;
- completion time;
- CPL;
- export status.

## 31.5 Lead detail

### Consumer

- name;
- email;
- verified status;
- phone.

### Sponsor intent

- interest response;
- sponsor creative viewed;
- timestamp.

### Qualification

- responses;
- pass status.

### Physical provenance

- Host;
- BearGo;
- placement;
- location;
- scan timestamp;
- game completion timestamp;
- sponsor-view timestamp;
- contact timestamp;
- email-verification timestamp;
- introduction completion timestamp.

### Consent

- status;
- exact version;
- timestamp;
- fields authorized.

## 31.6 Exports

Allow authorized users to export filtered leads to CSV.

Track every export.

## 31.7 Billing

- funded balance;
- spend;
- invoices;
- payments;
- credits;
- remaining campaign balance;
- payment method.

## 31.8 No integrations

Do not build webhook/setup pages for MVP.

The startup dashboard should explicitly communicate:

> **No integration required.**

---

# 32. Sponsor assignment and routing

The game and sponsor assignment are separate systems.

A BearGo can always have a game even with zero sponsor inventory.

## 32.1 Manual routing first

Admin can assign campaigns to:

- one Host;
- Host group;
- Host category;
- location;
- neighborhood;
- all eligible Houston BearGos.

## 32.2 Sponsor eligibility

Before making the commercial teaser available, confirm:

- campaign is live;
- startup active;
- budget sufficient;
- Host/BearGo eligible;
- geography valid;
- dates valid;
- max leads not exhausted;
- campaign not manually suppressed.

If the scanner is softly recognized and known to have already converted for the startup, suppress the startup when practical.

Do not depend on this for duplicate protection.

## 32.3 No sponsor

If no eligible sponsor exists:

- game still runs;
- scoreboard still runs;
- commercial teaser is omitted.

## 32.4 Future routing

Architect for later optimization by:

- sponsor interest rate;
- Qualified Lead rate;
- expected Host earnings per completed game;
- Host type;
- location;
- time;
- sponsor relevance;
- campaign CPL;
- remaining budget;
- repeat-sponsor suppression.

Do not build a complex ML router now.

---

# 33. Scanner session model

Each scan creates a session.

Suggested fields:

```text
id
paw_id
host_id
placement_id
location_id
challenge_set_id
campaign_id_nullable
startup_id_nullable
experiment_variant_id
local_date
created_at

game_started_at
q1_answered_at
q2_answered_at
q3_answered_at
game_completed_at
score_correct
total_response_ms
rank_at_completion
player_count_at_completion

commercial_teaser_viewed_at
commercial_teaser_opened_at
mechanism_viewed_at
sponsor_viewed_at
interest_response

contact_submitted_at
duplicate_status
verification_email_sent_at
email_verified_at
qualification_completed_at
introduction_finished_at
lead_id

hashed_ip
user_agent
device_class
soft_repeat_key
status
```

States can include:

```text
scanned
game_started
game_completed
result_viewed
commercial_teaser_opened
sponsor_viewed
not_interested
already_user
interested
contact_submitted
duplicate
verification_pending
email_verified
qualification_complete
lead_created
abandoned
fraud_blocked
```

---

# 34. Trivia data model

## ChallengeSet

```text
id
host_id
local_date
timezone
version
status
published_at
created_at
```

Statuses:

```text
draft
review
scheduled
live
retired
invalidated
```

## TriviaQuestion

```text
id
question_text
choices_json
correct_choice
short_explanation
conversation_hook
category
subcategory
estimated_difficulty
verification_status
source_notes_json
valid_until
content_flags_json
created_at
```

## ChallengeQuestion

```text
id
challenge_set_id
question_id
position
```

## TriviaAttempt

```text
id
session_id
challenge_set_id
host_id
local_date
started_at
completed_at
correct_count
total_response_ms
rank_at_completion
percentile_at_completion
status
```

## TriviaAnswer

```text
id
attempt_id
question_id
position
selected_choice
correct
response_ms
answered_at
```

## QuestionReport

```text
id
question_id
session_id
reason
notes
status
created_at
resolved_at
```

---

# 35. Lead data model

## Lead

```text
id
session_id
host_id
paw_id
placement_id
campaign_id
startup_id

full_name
email
email_normalized
email_verified
phone
phone_normalized
phone_verified

interest_response
qualification_answers_json
qualification_passed

consent_receipt_id
consent_completed_at

status
qualified_at

gross_cpl
host_amount
platform_amount

duplicate_status
fraud_score
invalid_reason
exported_at
created_at
```

Lead statuses:

```text
in_progress
qualified
duplicate
invalid
fraud_hold
reversed
exported
paid
```

---

# 36. Consent receipt

Every Qualified Lead needs durable proof of consent.

```text
id
lead_id
startup_id
campaign_id
consent_text
consent_version
fields_authorized_json
purpose_text
consent_timestamp
startup_privacy_policy_url
ip_hash
user_agent
created_at
```

The receipt proves:

- which startup was named;
- what information was shared;
- why it was shared;
- exact wording/version;
- when the scanner agreed.

Never use vague "partners" consent in MVP.

---

# 37. Host, BearGo, placement, and location data model

## Host

```text
id
user_id_or_primary_owner_id
display_name
legal_name
host_type
slug
website
bio_or_description
status
payout_account_id
default_share_percent
timezone
created_at
```

## BearGo

```text
id
host_id
public_token
print_version
status
created_at
```

## Placement

```text
id
paw_id
host_id
location_id
placement_type
placement_label
installed_at
removed_at
status
notes
```

Placement types can include:

```text
restroom_mirror
restroom_entry
table_tent
bar_top
check_presenter
waiting_area
wall
queue
other
```

## Location

```text
id
host_id
name
address
lat
lng
city
neighborhood
timezone
location_type
active
```

One Host may have multiple locations and BearGos.

---

# 38. Revenue and ledger system

Use immutable ledger-style accounting.

## Startup balance

Track:

- funded;
- committed if needed;
- spent;
- credited;
- refunded;
- remaining.

## Host liability

Every billable Qualified Lead creates Host liability.

Example:

```text
Gross CPL: $10.00
Host earning: $7.00
Platform revenue: $3.00
```

## Ledger entry types

```text
startup_funding
qualified_lead_charge
startup_credit
host_earning
host_earning_reversal
host_payout
platform_revenue
refund
manual_adjustment
```

Manual adjustments require:

- admin;
- reason;
- timestamp;
- audit trail.

---

# 39. Lead invalidation and reversal

The startup cannot subjectively reject a valid lead merely because the person did not later become a customer.

The written Qualified Lead definition controls billing.

Admin can invalidate/reverse for objective reasons such as:

- duplicate;
- bot/fraud;
- stolen identity;
- Host self-generation;
- email-verification defect;
- consent defect;
- system bug;
- campaign-rule error.

Statuses:

```text
qualified
fraud_hold
invalid
reversed
paid
```

---

# 40. Host payout system

Use a proper platform payout provider.

Required:

- Host onboarding;
- identity/business verification where required;
- bank payout;
- payout status;
- failed payout handling;
- tax information where applicable.

Flow:

```text
Qualified Lead
→ Host earning
→ optional fraud hold
→ available balance
→ payout created
→ payout completed
```

Do not collect raw banking credentials directly.

---

# 41. Startup billing

Preferred initial model:

# PREPAID CAMPAIGN BALANCE

Flow:

```text
startup signs pilot
→ funds campaign
→ campaign goes live
→ each Qualified Lead consumes CPL
→ low-balance warning
→ campaign stops commercial teaser eligibility when balance insufficient
```

The game itself continues even if every campaign is exhausted.

Support:

- card and/or ACH;
- invoices;
- receipts;
- credits;
- refunds;
- billing contacts.

---

# 42. Admin console

Desktop-first, operational, information-dense.

## 42.1 Network dashboard

Show:

### Game network

- active Hosts;
- active BearGos;
- scans today;
- game starts;
- game completions;
- average completion rate;
- top Hosts by play volume;
- question reports;
- challenge-generation failures.

### Commercial network

- live startup campaigns;
- teaser opens;
- sponsor views;
- eligible interest responses;
- Qualified Leads;
- gross revenue;
- Host liability;
- low campaign balances.

### Alerts

- missing challenge set;
- disputed question;
- unusually high/low correctness;
- verification-email failure;
- fraud spike;
- duplicate spike;
- payout failure;
- campaign exhaustion;
- commercial handoff drop-off anomaly.

## 42.2 Host management

Admin can:

- create/edit/approve Host;
- manage locations;
- manage BearGos/placements;
- manage content profile;
- view game analytics;
- view earnings;
- hold payout;
- suspend;
- add notes.

## 42.3 BearGo/placement management

Admin can:

- create BearGo;
- generate QR;
- assign Host/location;
- set placement type;
- activate/deactivate;
- track print version;
- reissue damaged/lost BearGo;
- compare placement performance.

## 42.4 Challenge management

Admin can:

- preview today's challenge;
- edit/replace draft questions;
- approve set;
- invalidate a bad live question/set;
- view answer distributions;
- view player reports;
- inspect generation provenance;
- schedule future sets.

## 42.5 Startup/campaign management

Admin can:

- create/edit startup;
- configure sponsor card;
- configure interest responses;
- define Qualified Lead rules;
- configure contact fields;
- configure questions;
- version consent;
- set CPL/split/budget;
- assign Hosts;
- activate/pause/end;
- preview sponsor experience.

## 42.6 Lead management

Search/filter:

- startup;
- campaign;
- Host;
- BearGo;
- placement;
- date;
- status;
- verification;
- interest response;
- qualification answer;
- fraud score.

Admin can:

- inspect;
- hold;
- invalidate;
- reverse;
- annotate;
- view consent;
- view complete timeline.

## 42.7 Session timeline

Show:

```text
scan
→ game start
→ Q1
→ Q2
→ Q3
→ result
→ teaser view
→ teaser open
→ mechanism explainer
→ sponsor view
→ interest
→ contact
→ duplicate check
→ verification
→ qualification
→ finish introduction
→ Qualified Lead
```

---

# 43. Question operations console

Dedicated question/content tooling is required.

Views:

- candidate queue;
- verification status;
- duplicate/repetition detector;
- scheduled challenges;
- live challenges;
- reported questions;
- question performance analytics;
- source/provenance viewer.

Filters:

- city;
- Host;
- category;
- difficulty;
- generation date;
- source quality;
- report status;
- answer distribution.

Question editor should allow changing:

- wording;
- answer choices;
- answer key;
- explanation;
- category;
- difficulty;
- source notes;
- validity window.

Any answer-key change after publication requires audit logging and a decision on affected leaderboard attempts.

---

# 44. Fraud and game integrity

Game integrity matters, but MVP has no meaningful leaderboard prize, so avoid overengineering.

Signals:

- repeated plays from same soft identity/device;
- impossible answer times;
- automated request patterns;
- repeated identical answer timing;
- suspicious high-volume sessions;
- API tampering.

Default policy:

- first completed attempt per soft device/session is leaderboard-eligible;
- later replays may be allowed for fun but clearly marked non-ranking if detected;
- no financial reward for leaderboard position;
- no high-value prizes until stronger identity/anti-cheat exists.

Do not require invasive fingerprinting simply to protect a low-stakes daily rank.

---

# 45. Lead and Host fraud

## 45.1 Lead signals

- repeated email across many identities;
- repeated phone across many emails;
- disposable/suspicious email patterns;
- impossible completion velocity;
- automation/bot patterns;
- duplicate startup submissions;
- unusual IP/device clusters.

## 45.2 Host fraud signals

- self-generated Qualified Leads;
- repeated devices/IP clusters;
- implausible lead rate;
- unusual contact patterns;
- suspicious timing clusters;
- physical traffic grossly inconsistent with BearGo activity.

## 45.3 Fraud queue

Dispositions:

```text
clear
monitor
hold
invalidate_leads
pause_paw
pause_host
pause_campaign
suspend_account
```

---

# 46. Analytics event taxonomy

Core game events:

```text
paw_scan
game_intro_view
game_start
question_view
question_answer
question_correct
question_incorrect
game_complete
result_view
leaderboard_rank_rendered
question_reported
```

Commercial-transition events:

```text
commercial_teaser_view
commercial_teaser_pulse
commercial_teaser_open
mechanism_explainer_view
mechanism_explainer_continue
sponsor_view
interest_selected
maybe_later_selected
already_use_selected
not_for_me_selected
```

Lead events:

```text
lead_path_start
contact_form_view
contact_submitted
duplicate_detected
verification_email_sent
verification_email_resent
email_verified
qualification_view
qualification_completed
introduction_finished
qualified_lead_created
lead_invalidated
startup_site_click
```

Financial/role events:

```text
startup_funding_completed
host_earning_created
host_payout_created
host_payout_completed
campaign_paused
campaign_budget_exhausted
host_dashboard_view
startup_dashboard_view
```

Keep analytics events separate from the financial ledger.

---

# 47. Required analytics views

## 47.1 Game / Host

- BearGo scans;
- scan → game-start rate;
- Q1/Q2/Q3 completion;
- game-completion rate;
- average correct score;
- answer-time distribution;
- daily player count;
- repeat-play estimate;
- question report rate.

## 47.2 Score-to-commercial handoff

This is a critical funnel.

Track:

- result views;
- teaser visible rate;
- teaser open rate;
- swipe vs tap;
- time from rank render to teaser interaction;
- mechanism explainer continuation rate;
- sponsor reveal rate.

## 47.3 Sponsor

- sponsor views;
- I'd try it rate;
- Seems useful rate;
- Maybe later rate;
- Already use it rate;
- Not for me rate;
- lead-path start rate.

## 47.4 Lead

- contact submission;
- duplicate rate;
- verification rate;
- qualification completion;
- qualification failure;
- Qualified Lead rate;
- CPL;
- revenue / 100 sponsor views;
- revenue / 100 completed games;
- Host earnings / 100 completed games.

## 47.5 Question quality

Per question:

- percent correct;
- median response time;
- abandonment after question;
- report rate;
- difficulty calibration error;
- repeat usage;
- category performance.

## 47.6 Placement performance

- scans per placement;
- game completion;
- teaser-open rate;
- sponsor-view rate;
- leads;
- Host earnings.

Compare:

- restroom mirror;
- table tent;
- bar top;
- check presenter;
- waiting area;
- other.

---

# 48. Repeatability metrics

Because the game is the retention engine, track repeat behavior independently from lead behavior.

Metrics:

- estimated returning players at 7/30/90 days;
- average BearGo scans per soft identity;
- distinct Hosts played per soft identity;
- same-Host repeat rate;
- game completion by encounter count;
- commercial teaser-open rate by encounter count;
- sponsor-interest rate by encounter count;
- lead rate by encounter count;
- Already use it rate over time.

Do not judge BearGo retention only by repeated lead submissions.

A healthy network may have high game repeat and low-frequency lead conversion per individual.

---

# 49. Experimentation framework

Support deterministic lightweight experiments for:

## Physical

- sign headline;
- QR placement;
- poster size;
- venue logo inclusion;
- "3 Questions" vs "30-second challenge" wording.

## Game

- intro copy;
- answer-feedback duration;
- explanation display;
- question-category mix;
- difficulty mix;
- leaderboard wording;
- Top X% display.

## Score handoff

- teaser card height;
- immediate vs slightly delayed appearance;
- pulse amplitude;
- one pulse vs two;
- bear gaze/gesture;
- CTA wording;
- swipe affordance;
- "You pay nothing" placement.

## Sponsor

- sponsor-card creative;
- value-proposition copy;
- interest option labels;
- visual placement.

## Lead

- contact heading;
- field ordering;
- verification copy;
- qualification layout;
- consent placement;
- completion animation.

Record:

```text
experiment_id
variant_id
session_id
host_id
paw_id
campaign_id_nullable
```

Do not build a full experimentation SaaS product.

---

# 50. Role-based access control

Roles:

```text
player_anonymous
host_member
host_admin
startup_member
startup_admin
content_ops
platform_ops
platform_admin
super_admin
```

Rules:

- anonymous players access only their active session/result;
- Host users see only their Host/BearGo/game/economic data;
- Hosts never see lead PII;
- startup users see only their startup's leads/campaigns;
- startup members can have export restrictions;
- only content/admin roles can modify question answer keys;
- only admins can invalidate Qualified Leads;
- only billing-authorized users can fund campaigns;
- only authorized admins can version consent after approval.

Enforce server-side.

---

# 51. Audit logging

Audit sensitive changes including:

- question text/answer-key edits;
- challenge-set replacements;
- campaign status;
- CPL;
- Host share;
- budget;
- interest eligibility;
- qualification rules;
- consent versions;
- lead reversals;
- payout holds;
- Host/BearGo suspension;
- lead exports;
- billing adjustments.

Track:

```text
actor_user_id
action
entity_type
entity_id
before_json
after_json
reason
created_at
```

---

# 52. Notifications

## Host

- application received;
- approved;
- BearGo activated;
- payout onboarding needed;
- meaningful earnings milestone;
- payout sent;
- payout failure;
- BearGo/Host suspended.

Avoid notifying for every low-value event.

## Startup

- campaign ready;
- campaign live;
- lead milestones;
- new lead batch available;
- low balance;
- budget exhausted;
- payment issue;
- campaign completed.

## Content/admin

- nightly generation failure;
- Host missing tomorrow's challenge;
- question report spike;
- suspicious answer distribution;
- verification-email outage;
- fraud spike;
- payout failure.

---

# 53. Email templates

## Player verification

Subject concept:

> **Verify your email to finish the introduction**

Body:

> You're almost done.
>
> **VERIFY & CONTINUE**

Do not imply JobRadar account creation.

## Host

- application received;
- approved;
- payout setup;
- payout sent;
- suspended.

## Startup

- account invitation;
- campaign ready;
- campaign live;
- lead milestone;
- low balance;
- campaign completed.

## Internal

- content generation failure;
- question dispute;
- payment failure;
- fraud alert.

---

# 54. Legal and trust surfaces

Need real pages for:

- Privacy Policy;
- Terms of Service;
- Host Agreement;
- Startup Campaign Terms;
- player disclosure;
- cookie/consent notices where applicable.

The commercial flow must clearly communicate:

1. a company will be revealed only after the game;
2. connecting is optional;
3. the player pays $0;
4. the company pays the named Host for a qualifying introduction;
5. personal details are shared only after the player chooses an interested path and finishes;
6. the named startup receives the submitted information and responses.

Do not:

- disguise the sponsor card as editorial trivia;
- use vague "partners" language;
- imply phone verification when only email is verified;
- imply an account was created at the startup;
- imply the company payment replaces normal gratuities;
- call the venue payment a consumer tip;
- claim payment before a billable Qualified Lead exists.

---

# 55. Privacy and data minimization

The game should collect minimal personal data.

Anonymous game data may include:

- session token;
- Host/BearGo/placement;
- answers;
- timing;
- coarse device/session signals;
- experiment assignment.

Lead PII is collected only after eligible sponsor interest.

For lead data:

- collect only required fields;
- encrypt sensitive fields at rest where appropriate;
- restrict PII access;
- log PII exports/access where practical;
- support deletion workflows;
- never expose PII to Hosts;
- do not sell a startup-specific lead to another startup;
- use named-startup consent;
- do not request precise device GPS by default.

Physical source should normally come from the known BearGo/placement/location.

Do not use invasive fingerprinting as a requirement for repeat detection.

---

# 56. Security

Minimum requirements:

- HTTPS;
- secure authentication;
- hashed passwords if password auth used;
- MFA for platform admins;
- RBAC;
- rate limiting;
- CSRF protection where applicable;
- secure environment variables/secrets;
- no PII/secrets in client bundles;
- secure email-verification tokens;
- token expiry;
- resend abuse prevention;
- server-side authorization;
- encryption where appropriate;
- audit logs;
- database backups;
- error monitoring.

For game endpoints:

- do not send answer keys to client before answer submission if avoidable;
- validate session/question order server-side;
- rate-limit answer submission;
- prevent trivial request replay from generating unlimited leaderboard entries.

---

# 57. Observability

Build:

- application error monitoring;
- API logs;
- question-generation logs;
- challenge-publication logs;
- email-delivery monitoring;
- lead-creation logs;
- ledger/billing logs;
- payout logs;
- uptime monitoring;
- structured server logs;
- fraud-rule logs.

Admin should diagnose a broken BearGo session without reading raw infrastructure logs.

---

# 58. API requirements

Suggested internal web API surface:

```text
POST /api/paws/:token/scan
GET  /api/sessions/:sessionId

POST /api/sessions/:sessionId/game/start
GET  /api/sessions/:sessionId/questions/:position
POST /api/sessions/:sessionId/questions/:position/answer
GET  /api/sessions/:sessionId/result
POST /api/questions/:questionId/report

POST /api/sessions/:sessionId/commercial/open
GET  /api/sessions/:sessionId/sponsor
POST /api/sessions/:sessionId/interest

POST /api/sessions/:sessionId/contact
POST /api/sessions/:sessionId/resend-verification
GET  /api/verify-email/:token
POST /api/sessions/:sessionId/qualification
POST /api/sessions/:sessionId/finish-introduction

GET /api/host/me/overview
GET /api/host/me/challenges
GET /api/host/me/earnings
GET /api/host/me/paws

GET /api/startup/me/campaigns
GET /api/startup/me/campaigns/:id
GET /api/startup/me/leads
GET /api/startup/me/leads/:id
POST /api/startup/me/leads/export
GET /api/startup/me/billing

GET /api/admin/hosts
GET /api/admin/paws
GET /api/admin/challenges
GET /api/admin/questions
GET /api/admin/startups
GET /api/admin/campaigns
GET /api/admin/leads
GET /api/admin/sessions
GET /api/admin/fraud
GET /api/admin/analytics
```

There is no startup conversion webhook API in MVP.

---

# 59. Search, filtering, and export

Admin tables should support filters for:

- Host;
- location;
- BearGo;
- placement;
- date;
- challenge;
- question;
- startup;
- campaign;
- lead status;
- interest response;
- verification;
- fraud severity;
- amount.

Startup exports:

- qualified leads;
- source provenance;
- verification status;
- qualification answers;
- consent timestamp/version.

Host exports:

- aggregate game performance;
- earnings ledger;
- payout history.

Hosts do not receive player PII.

---

# 60. Product states and edge cases

## Game

- invalid BearGo;
- inactive BearGo;
- Host suspended;
- challenge missing;
- question unavailable;
- question invalidated;
- answer submission retry;
- session expired;
- game incomplete;
- completed;
- repeat attempt;
- leaderboard temporarily unavailable.

If leaderboard is unavailable, still show score/time and a graceful message.

## Commercial

- no sponsor available;
- campaign exhausted after game starts;
- teaser omitted;
- sponsor card unavailable;
- Maybe later;
- Already use it;
- Not for me;
- eligible interest.

If campaign becomes unavailable between score and sponsor reveal, do not expose a broken flow. Show:

> **No company introduction is available right now. Thanks for playing.**

## Lead

- duplicate;
- contact invalid;
- verification pending;
- verification expired;
- email changed;
- qualification incomplete;
- qualification failed;
- fraud hold;
- Qualified Lead;
- reversed.

## Host

- application pending;
- approved;
- active;
- no live sponsor but game active;
- payout onboarding incomplete;
- payout held;
- suspended.

## Startup

- lead/prospect;
- onboarding incomplete;
- campaign draft;
- unfunded;
- ready;
- live;
- low balance;
- exhausted;
- paused;
- ended.

---

# 61. Mobile scanner design requirements

The scanner experience is the core product.

Priorities:

1. instant understanding of game;
2. fast answer flow;
3. satisfying score/rank;
4. shrewd but non-deceptive score-to-commercial handoff;
5. clear mechanism explanation;
6. attractive one-page sponsor card;
7. low-friction interest gate;
8. PII only after genuine interest;
9. fast verification return;
10. minimal final questions;
11. satisfying company-payment completion.

Avoid:

- navigation menus during play;
- sponsor branding before result;
- interstitial ads between questions;
- scroll-heavy question screens;
- long trivia explanations;
- multiple sponsors;
- lead-generation language;
- surprise PII forms;
- ordinary tipping language for establishment earnings;
- forced commercial participation.

Use:

- large typography;
- high contrast;
- one question per page;
- large answer buttons;
- instant tap feedback;
- preloading for smooth transitions;
- subtle bear motion;
- result card with visible rank;
- bottom-sheet/slide commercial teaser;
- both tap and swipe affordances.

---

# 62. Desktop startup design requirements

The startup dashboard should feel like a serious performance-acquisition product built on an unusual upper-funnel source.

Prioritize:

- Qualified Leads;
- CPL;
- spend;
- campaign balance;
- sponsor views;
- interest distribution;
- lead funnel;
- Host/location source;
- verified contact data;
- consent provenance.

It should communicate:

> **My sponsor appears after a completed real-world engagement, and I only pay for the qualified people who choose to connect.**

Do not make it look like a trivia admin panel.

---

# 63. Desktop admin design requirements

Admin should be dense and operational.

Prioritize:

- today's challenge health;
- BearGos/placements;
- question reports;
- Host traffic;
- sponsor campaigns;
- score-to-commercial conversion;
- leads;
- billing;
- payouts;
- fraud;
- audit visibility.

The admin should answer within seconds:

> **Is the game network healthy, is the commercial funnel healthy, and is the money correct?**

---

# 64. Seed / demo data

Seed realistic data:

- 3 startups;
- 4 campaigns;
- 12 Hosts;
- 18 BearGos;
- 20 placements;
- 8 locations/neighborhood contexts;
- 100 trivia questions;
- 20 challenge sets;
- 1,000 scan sessions;
- 750 game starts;
- 650 game completions;
- varied scores/times/ranks;
- 250 teaser opens;
- 180 sponsor views;
- interest-response distribution;
- 70 contact submissions;
- duplicates;
- 50 verified emails;
- 35 Qualified Leads;
- consent records;
- payout history;
- low-balance campaigns;
- question reports;
- fraud flags.

---

# 65. Demo Hosts and challenges

Seed examples:

## The Rustic — social restaurant/bar

Daily set:

1. surprising global comparison;
2. Houston knowledge;
3. music/food/culture question.

## Bayou Taproom — brewery

Daily set:

1. general knowledge;
2. Houston/local history;
3. food/music/culture.

## Montrose Coffee Co. — café

Daily set:

1. accessible general;
2. Houston arts/culture;
3. estimation question.

## Campus Union — student center

Daily set:

1. pop culture/general;
2. campus/city;
3. reasoning/comparison.

Use fictional names unless real agreements exist.

---

# 66. Demo startup campaigns

## Career app — JobRadar

Sponsor description:

> **JobRadar helps you discover jobs matched to what you're looking for.**

Eligible interest:

- I'd try it;
- optionally Seems useful.

Contact:

- Name;
- Email;
- Phone.

Question examples:

- job-search status;
- job category.

CPL example:

$10

## Local events app

Description:

> Helps you discover events and social plans happening near you.

Qualification:

- local-events interest;
- preferred event type.

## Consumer marketplace

Description:

> Helps you discover useful products and services from people nearby.

Qualification:

- buying/selling interest;
- category.

These are development examples only.

---

# 67. Full initial build checklist

## Public

- [ ] Home
- [ ] For Hosts
- [ ] For Startups
- [ ] Host application
- [ ] Startup lead form
- [ ] Privacy
- [ ] Terms
- [ ] Host terms
- [ ] Startup terms

## Physical BearGo

- [ ] Permanent BearGo token
- [ ] QR generation
- [ ] print-ready BearGo design
- [ ] placement tracking
- [ ] venue-authorized design variants
- [ ] scan QA

## Game

- [ ] game intro
- [ ] 3-question flow
- [ ] one-question-per-page UI
- [ ] answer timing
- [ ] correctness scoring
- [ ] speed tie-breaker
- [ ] short answer explanations
- [ ] daily Host leaderboard
- [ ] result animation
- [ ] question reporting

## Score handoff

- [ ] second card peeking from bottom
- [ ] controlled pulse/nudge
- [ ] bear gaze/gesture
- [ ] tap interaction
- [ ] swipe-up interaction
- [ ] full hook screen
- [ ] SHOW ME CTA
- [ ] mechanism explainer

## Sponsor

- [ ] sponsor routing
- [ ] one-page ad
- [ ] interest options
- [ ] Maybe later exit
- [ ] Already use it exit
- [ ] Not for me exit
- [ ] interested path
- [ ] no-sponsor graceful game completion

## Lead flow

- [ ] Name/Email/Phone
- [ ] duplicate check before verification
- [ ] email verification
- [ ] verification return to session
- [ ] 1–2 qualification questions
- [ ] consent on qualification screen
- [ ] Finish Introduction
- [ ] Qualified Lead rules engine
- [ ] company-payment completion
- [ ] optional startup-site click

## LLM/content system

- [ ] Host content profile
- [ ] candidate generation job
- [ ] structured question schema
- [ ] duplicate/repetition detection
- [ ] verification workflow
- [ ] admin candidate queue
- [ ] daily challenge assignment
- [ ] publish scheduler
- [ ] validity windows
- [ ] question reports
- [ ] question analytics

## Host

- [ ] auth
- [ ] onboarding
- [ ] approval
- [ ] dashboard
- [ ] challenge history
- [ ] BearGo/placement page
- [ ] earnings ledger
- [ ] payout onboarding
- [ ] payout history

## Startup

- [ ] auth
- [ ] onboarding
- [ ] campaign list
- [ ] campaign detail
- [ ] sponsor creative
- [ ] interest configuration
- [ ] qualification rules
- [ ] consent
- [ ] full funnel
- [ ] lead table
- [ ] lead detail
- [ ] CSV export
- [ ] billing
- [ ] settings/team

## Admin

- [ ] network dashboard
- [ ] Host CRM
- [ ] BearGo management
- [ ] placement management
- [ ] challenge management
- [ ] question operations
- [ ] generation monitor
- [ ] startup CRM
- [ ] campaign management
- [ ] lead management
- [ ] session timeline
- [ ] consent viewer
- [ ] fraud queue
- [ ] billing
- [ ] payouts
- [ ] experiments
- [ ] analytics
- [ ] audit logs

## Backend

- [ ] auth/RBAC
- [ ] Host
- [ ] BearGo
- [ ] Placement
- [ ] Location
- [ ] TriviaQuestion
- [ ] ChallengeSet
- [ ] TriviaAttempt
- [ ] TriviaAnswer
- [ ] ScanSession
- [ ] Startup
- [ ] Campaign
- [ ] contact capture
- [ ] duplicate detection
- [ ] email verification
- [ ] qualification
- [ ] Lead
- [ ] ConsentReceipt
- [ ] financial ledger
- [ ] payout provider
- [ ] startup payment provider
- [ ] email delivery
- [ ] exports
- [ ] observability

Explicitly not required:

- [ ] startup webhooks
- [ ] startup SDK
- [ ] startup account provisioning
- [ ] startup referral integration
- [ ] downstream activation tracking
- [ ] user login to play trivia
- [ ] high-value leaderboard prizes

---

# 68. Critical acceptance tests

## Test 1 — Complete game without sponsor participation

1. Scanner scans active BearGo.
2. Correct Host/challenge loads.
3. Scanner starts game without login.
4. Q1/Q2/Q3 render one at a time.
5. Answers/timing are recorded.
6. Score calculates correctly.
7. Daily Host rank renders.
8. User can stop here with no PII collected.

## Test 2 — Score-to-commercial handoff

1. Q3 completes.
2. Score/rank animates in.
3. Teaser card is already peeking at bottom as result settles.
4. Teaser does not cover rank.
5. Card receives restrained pulse/nudge.
6. Bear indicates the card without obscuring content.
7. Tap expands card.
8. Swipe expands card.
9. No sponsor name appears before SEE TODAY'S SPONSOR.

## Test 3 — No sponsor inventory

1. Scanner completes game.
2. No eligible funded campaign exists.
3. Score/rank still renders normally.
4. Commercial teaser is omitted.
5. No broken campaign state appears.

## Test 4 — Sponsor non-interest

1. User opens commercial flow.
2. Reads mechanism.
3. Views JobRadar.
4. Selects Not for me.
5. No PII form appears.
6. No second advertiser appears.
7. No lead/charge/Host earning is created.

Repeat for Maybe later and I already use it.

## Test 5 — BearGo to Qualified Lead

1. Scanner completes game.
2. Opens commercial teaser.
3. Views mechanism explainer.
4. Opens sponsor card.
5. Selects eligible interest.
6. Sees "if you complete the introduction" Host-payment message.
7. Submits Name/Email/Phone.
8. Duplicate check passes.
9. Verification email sends.
10. Scanner verifies and returns to same session.
11. Scanner completes qualification.
12. Consent appears on same final screen.
13. Scanner clicks FINISH INTRODUCTION.
14. Rules engine passes.
15. Exactly one Qualified Lead is created.
16. Exactly one Consent Receipt is created.
17. Exactly one startup charge is created.
18. Exactly one Host earning is created.
19. Campaign balance decreases.
20. Completion bear renders.
21. Copy says JobRadar paid the Host for the introduction.
22. Startup/Host/admin dashboards update.

## Test 6 — Duplicate after lost cookies

1. Person previously became a JobRadar lead.
2. Clears cookies or uses another device.
3. Plays BearGo normally.
4. Selects JobRadar interest.
5. Enters same normalized email/phone.
6. Duplicate detected before email verification.
7. "Already connected" state shown.
8. No charge or Host earning.

## Test 7 — Unverified email

1. New interested user submits contact.
2. Does not verify.
3. No Qualified Lead.
4. No charge.
5. No Host earning.

## Test 8 — Qualification failure

1. User reaches qualification.
2. Answers fail campaign rules.
3. No billable lead.
4. No claim that company paid Host.
5. User-facing outcome remains truthful.
6. Qualification-failure metric increments.

## Test 9 — Budget exhaustion

1. Campaign can fund one more lead.
2. Qualified Lead is created.
3. Remaining balance becomes insufficient.
4. Campaign becomes budget_exhausted/paused.
5. Games continue normally.
6. Commercial teaser omitted when no other sponsor eligible.

## Test 10 — Bad trivia question

1. Question receives credible report.
2. Admin can inspect sources/history.
3. Admin can invalidate/replace question.
4. Audit log records change.
5. Affected leaderboard handling follows configured policy.

## Test 11 — Daily challenge consistency

1. Multiple players at same Host/local date load challenge.
2. All receive same three questions/version.
3. Ranking uses same challenge population.
4. Next local day receives new set and reset leaderboard.

## Test 12 — Host suspension

1. Admin suspends Host or BearGo.
2. New scans show appropriate inactive state.
3. Existing financial history remains accessible to authorized Host/admin users.

---

# 69. Build order for agents

## Phase 1 — Game prototype and motion

Build before deep dashboards:

1. physical BearGo mockup;
2. QR scanning prototype;
3. three-question game;
4. scoring;
5. daily local leaderboard;
6. bear question transitions;
7. result animation;
8. peeking/pulsating second card;
9. swipe/tap expansion;
10. mechanism explainer;
11. sponsor card prototype.

Test this as a complete mobile interaction before building extensive operations UI.

## Phase 2 — Question/content engine

Build:

- question schema;
- LLM candidate generator;
- admin review queue;
- challenge scheduler;
- Host content profiles;
- daily set assignment;
- question analytics/reports.

The game cannot scale if content operations are an afterthought.

## Phase 3 — Core economic loop

Build:

1. startup/campaign;
2. sponsor routing;
3. interest gate;
4. contact capture;
5. duplicate check;
6. email verification;
7. qualification;
8. consent;
9. Qualified Lead engine;
10. startup charge;
11. Host earning;
12. commercial completion.

## Phase 4 — Operating interfaces

Build:

- Host dashboard;
- startup dashboard;
- admin console;
- lead exports;
- billing;
- payouts;
- fraud.

## Phase 5 — Sales/onboarding

Build:

- public marketing;
- Host application;
- startup lead intake;
- legal pages;
- self-service onboarding where useful.

## Phase 6 — Optimization

Build:

- placement experiments;
- saved details;
- soft repeat recognition;
- sponsor suppression;
- richer question formats;
- routing optimization;
- question-quality models;
- deeper retention analytics.

---

# 70. What not to add right now

Do not add:

- long trivia sessions;
- cash prizes for leaderboard rank;
- offerwalls;
- multiple sponsors per scan;
- interstitial ads between questions;
- sponsor-branded answer keys;
- required player accounts;
- surveys;
- affiliate-offer feeds;
- ecommerce;
- dropshipping;
- generic impression-ad marketplace;
- rewarded video;
- startup SDKs;
- startup webhooks;
- startup account provisioning;
- downstream CPA tracking;
- Host social feed;
- messaging;
- auctions;
- scanner cash rewards for lead submission.

The MVP is one clear system:

# PLAY → RANK → OPTIONAL COMPANY INTRODUCTION → QUALIFIED LEAD → HOST EARNS.

---

# 71. Product language rules

## Player/game language

Prefer:

- BearGo Challenge;
- 3 Questions;
- How do you rank here today?;
- score;
- rank;
- players;
- today's challenge;
- You beat X players.

Avoid:

- lead;
- CPL;
- conversion;
- acquisition;
- offerwall.

## Commercial transition language

Preferred:

> **You can make a company pay The Rustic.**
>
> **You pay nothing.**

Then:

> **Companies want to meet people who might genuinely like what they offer. If today's sponsor interests you, you can choose to connect with them. If you do, the sponsor pays The Rustic for the introduction. You pay $0.**

Avoid venue-facing:

- tip;
- sponsored tip;
- replace your tip;
- tip The Rustic;
- reward ad;
- cash out.

## Sponsor language

Prefer:

- Today's Sponsor;
- How does that sound?;
- I'd try it;
- Seems useful;
- Maybe later;
- I already use it;
- Not for me;
- complete the introduction.

## Lead-flow language

Prefer:

- Your details;
- One quick check;
- Almost done;
- Finish Introduction.

## Startup language

Use:

- Qualified Lead;
- CPL;
- verified email;
- interest response;
- qualification;
- consent;
- Host/source provenance;
- campaign spend.

## Host language

Use:

- company-funded earnings;
- Host earnings;
- company payment;
- qualified introduction;
- BearGo scans;
- challenge plays.

---

# 72. Canonical scanner flow in one diagram

```text
SEE PAW

↓
SCAN

↓
TODAY'S PAW CHALLENGE
3 QUESTIONS

↓
QUESTION 1

↓
QUESTION 2

↓
QUESTION 3

↓
SCORE + LOCAL DAILY RANK

↓
SECOND CARD PEEKS/PULSES UP

"YOU CAN MAKE A COMPANY PAY THE RUSTIC.
YOU PAY NOTHING."

├── Ignore / close → DONE
│
└── Swipe or tap
    ↓
    SHOW ME
    ↓
    HOW IT WORKS
    ↓
    SEE TODAY'S SPONSOR
    ↓
    JOBRADAR ONE-PAGE AD
    ↓
    HOW DOES THAT SOUND?

    ├── Maybe later → DONE
    ├── I already use it → DONE
    ├── Not for me → DONE
    ├── Seems useful → eligible if campaign allows
    └── I'd try it → eligible
            ↓
        "If you complete the introduction,
         JobRadar pays The Rustic."
            ↓
        NAME + EMAIL + PHONE
            ↓
        DUPLICATE CHECK
            ├── Already delivered → DONE
            └── New
                ↓
            EMAIL VERIFICATION
                ↓
            1–2 QUESTIONS + CONSENT
                ↓
            FINISH INTRODUCTION
                ↓
            QUALIFIED LEAD
                ↓
            STARTUP CHARGE
                ↓
            HOST EARNING
                ↓
            BEAR CELEBRATION
```

---

# 73. North-star flows by actor

## Player

```text
see BearGo
→ play today's 3 questions
→ get local rank
→ optionally discover company-payment mechanism
→ optionally view sponsor
→ only continue if genuinely interested
→ optionally complete introduction
```

## Host

```text
join
→ get approved
→ install permanent BearGo
→ receive fresh daily challenge automatically
→ generate repeat plays
→ generate optional sponsor introductions
→ see earnings
→ get paid
```

## Startup

```text
join
→ define target lead
→ approve sponsor card
→ define interest threshold
→ define minimal qualification
→ agree CPL
→ fund pilot
→ launch with no integration
→ receive qualified leads from physical locations
→ export/follow up
→ inspect source/quality
→ buy more
```

## Admin

```text
approve Hosts
→ deploy BearGos
→ generate/verify daily question inventory
→ publish challenge sets
→ sign/fund startup campaigns
→ route sponsor inventory
→ monitor game + commercial funnels
→ resolve question/fraud issues
→ reconcile money
→ pay Hosts
→ optimize locations/content/campaigns
```

---

# 74. Core MVP hypotheses

The application must make these hypotheses measurable.

## Game hypothesis

> **Will people voluntarily scan a BearGo for a three-question, location-specific daily challenge and care about how they rank at that place that day?**

## Repeatability hypothesis

> **Does fresh daily trivia plus local social comparison create enough repeat behavior that BearGo becomes a recognizable physical ritual rather than one-time QR novelty?**

## Handoff hypothesis

> **After receiving their score, will a meaningful percentage of players open the curiosity card: "You can make a company pay [Host]. You pay nothing"?**

## Sponsor hypothesis

> **Will players who voluntarily enter the commercial layer give honest interest signals after seeing one concise sponsor ad?**

## Lead hypothesis

> **Will consumer startups pay economically meaningful CPLs for email-verified, startup-specific, consented leads who reached the sponsor only after completing a real-world BearGo engagement?**

## Host hypothesis

> **Will bars, restaurants, breweries and other establishments value BearGo enough to install it because it provides both customer entertainment and incremental company-funded earnings?**

## Trust hypothesis

> **Can BearGo keep the game fun and independent enough that players do not learn to interpret the BearGo as a disguised lead form or an alternative to ordinary tipping?**

---

# 75. Product definition in one sentence

If an AI agent needs one sentence to resolve ambiguity, use:

> **Build a game-first physical web platform where each BearGo launches a three-question daily challenge and local leaderboard; after the score, players may voluntarily learn how a company can pay the BearGo's Host, view one startup sponsor, and—only if genuinely interested—complete an email-verified, consented introduction that creates a fixed-CPL Qualified Lead and a revenue share for the Host, with no startup integration required.**

---

# 76. Final design doctrine

The product should preserve this hierarchy:

### The BearGo earns attention through curiosity.

### The three-question game earns repeat scans.

### The local daily rank earns social comparison and conversation.

### The post-score card opens a new curiosity loop before the player mentally exits.

### The company-payment mechanism adds altruistic motivation without asking the player for money.

### The sponsor card earns commercial interest only if the product is actually relevant.

### Personal information is requested only after genuine interest.

### The startup pays only for an objectively defined Qualified Lead.

### The Host earns from the introduction.

### The game remains valuable even when no commercial conversion happens.

That separation is the core sunset-proofing architecture.
