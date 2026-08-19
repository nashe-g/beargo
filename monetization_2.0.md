# Beargo Local Promotions — Revised Monetization Model

## 1. Product decision

Beargo will **completely replace the Qualified Introduction / startup lead-generation model** with a local promotion model based on **verified in-person redemption**.

The commercial proposition is:

> **Local businesses promote an offer to Beargo players nearby.**
> **Beargo charges the business $1 only when a Beargo player physically visits and redeems the offer.**

The scanner never pays Beargo.

The promoting business does **not** pay for:

- impressions;
- Beargo plays;
- offer views;
- clicks;
- claims;
- expired vouchers;
- unredeemed vouchers.

The billable event is:

> **One valid, merchant-confirmed Beargo redemption = $1 Beargo fee.**

This is the entire MVP revenue model.

---

# 2. Core Beargo experience remains game-first

The trivia game remains independent of monetization.

Canonical flow:

```
Scan Beargo
↓
3-question daily challenge
↓
Score + local daily rank
↓
Value-first unlocked-offer teaser rises into view
↓
User may tap or swipe to reveal the merchant
↓
One relevant nearby promotion
↓
Claim offer for free
↓
Visit promoting business
↓
Merchant verifies/redeems Beargo voucher
↓
Beargo charges merchant $1
```

The user always receives the promised trivia result before any promotion is required.

Do not hide the result behind an advertisement, offer, signup, or contact form.

The result screen should, however, be designed so that the experience does not feel visually finished before the local-promotion opportunity is noticed. The monetization transition is part of the result choreography, not a separate advertisement inserted after a dead-end scoreboard.

---

# 3. Post-result promotion transition

The transition from trivia result to local promotion is a critical product surface.

A weak generic teaser such as:

> Something nearby is waiting for Beargo players.

is not sufficient.

The teaser must expose **real economic value before asking for another interaction**.

The primary pattern is:

> ### YOU UNLOCKED
>
> # **$10 OFF NEARBY**
>
> **0.6 miles away · Tonight**
>
> **SEE WHERE**

For a percentage-based offer:

> ### YOU UNLOCKED
>
> # **20% OFF NEARBY**
>
> **0.4 miles away · Tonight**
>
> **SEE WHERE**

The user should immediately understand three things before tapping:

1. **Value** — e.g. `$10 off` or `20% off`.
2. **Proximity** — e.g. `0.6 miles away`.
3. **Urgency / availability** — e.g. `Tonight`, `Next 2 hours`, or `This weekend`.

Do not make the user click merely to discover whether the offer is worth caring about.

## Result-screen choreography

The result remains the primary payoff.

Example:

> # 3 / 3
>
> ## #6 at The Rustic today
>
> You beat 43 players.

The bear celebrates and the rank resolves.

At the same time, before the screen feels finished, a second card should already be visible at the bottom edge of the viewport.

That card:

- peeks up underneath the score;
- contains the actual discount value;
- contains proximity and time relevance when available;
- gives one restrained upward pulse or nudge;
- may include an upward chevron;
- is tappable;
- is swipeable upward;
- never requires swipe as the only interaction.

Conceptually:

```text
┌────────────────────────────┐
│           3 / 3            │
│                            │
│   #6 AT THE RUSTIC TODAY   │
│     You beat 43 players    │
│                            │
│            🐻              │
├────────────────────────────┤
│        YOU UNLOCKED        │
│                            │
│      $10 OFF NEARBY        │
│                            │
│  0.6 MILES AWAY · TONIGHT  │
│                            │
│        [ SEE WHERE ]       │
└────────────────────────────┘
```

The score must not be hidden, blurred, delayed, or held behind the promotion.

The second card creates a new curiosity loop while the user is still processing the result.

## Merchant-hidden vs merchant-visible teaser

Support both presentation modes.

### Merchant hidden

Use when the value/proximity combination is likely to create useful curiosity:

> **YOU UNLOCKED $10 OFF NEARBY**
>
> **0.6 miles away · Tonight**
>
> **SEE WHERE**

### Merchant visible

Use when the merchant itself is recognizable or likely to improve relevance/trust:

> **YOU UNLOCKED $10 OFF AT THE RIOT**
>
> **0.6 miles away · Tonight**
>
> **VIEW OFFER**

Do not hide the merchant merely for artificial curiosity if revealing the merchant creates a stronger and more trustworthy offer.

## Teaser rules

The teaser should normally contain at least three of these four elements:

- **value** — `$10 OFF`, `20% OFF`;
- **proximity** — `0.6 miles away`, `2 blocks away`;
- **urgency** — `Tonight`, `Next 2 hours`, `This weekend`;
- **specificity** — `Comedy`, `Coffee`, `Bowling`, `Dinner`, etc.

Examples:

> **$10 OFF COMEDY TONIGHT**
>
> **0.6 miles away**

> **20% OFF COFFEE**
>
> **2 blocks away**

> **$15 OFF BOWLING**
>
> **Valid tonight**

The promotion is optional.

If the user ignores the teaser, the trivia result remains complete.

If no strong eligible promotion exists, do not show a teaser at all.

Do not build an offerwall, carousel, or generic fallback advertisement.

---

# 4. Promotion reveal screen

When the user taps or swipes the teaser, expand into the full offer.

For a fixed-dollar offer:

> # $10 OFF $30+
>
> **The Riot Comedy Club**
>
> 0.6 miles away
>
> Valid tonight
>
> **CLAIM FREE**

For a percentage offer:

> # 20% OFF $25+
>
> **Local Coffee Co.**
>
> 0.4 miles away
>
> Valid through Sunday
>
> **CLAIM FREE**

The full promotion page should clearly show:

- business name;
- logo/image;
- actual offer;
- minimum purchase if applicable;
- optional maximum discount;
- distance/location;
- valid dates/times;
- concise restrictions;
- expiration;
- a clear free-claim CTA.

Preferred CTA:

> **CLAIM FREE**

`CLAIM OFFER` is acceptable as a fallback, but the interface should make it explicit that the scanner is not buying the voucher.

No email, phone number, account creation, or payment should be required merely to claim an offer.

The flow should feel like:

> **Result → unlocked value → reveal merchant → claim free**

not:

> **Result → advertisement → form**

---

# 5. Supported offer structures

MVP should support both **fixed-dollar** and **percentage-based** discounts.

## A. Fixed amount off

Examples:

> **$5 off $20+**

> **$10 off $30+**

> **$20 off $75+**

Fields conceptually include:

```
discount_type = fixed
discount_amount = 10
minimum_purchase = 30
```

---

## B. Percentage off

Examples:

> **10% off $20+**

> **15% off $30+**

> **20% off $50+**

Conceptually:

```
discount_type = percentage
discount_percent = 15
minimum_purchase = 30
```

Support an optional maximum discount where useful:

> **20% off $50+ — up to $20 off**

This prevents unexpectedly large discounts on high-value transactions.

---

# 6. Claiming an offer

When the scanner taps **CLAIM FREE** (or the configured claim CTA), Beargo creates a unique Beargo voucher.

Example:

> # $10 OFF $30+
>
> **The Riot Comedy Club**
>
> Valid tonight
>
> [BEARGO QR]
>
> **BG-7K4M2**
>
> Show this when you pay.

Each voucher must be:

- unique;
- tied to one promotion;
- tied to one merchant/location where required;
- single-use;
- server-validatable;
- timestamped;
- subject to the campaign's expiration rules.

A claim is **not billable**.

A user may claim an offer and never visit.

Beargo earns $0 in that case.

---

# 7. Saving the voucher

The user should be able to keep the offer easily after leaving Beargo.

Possible methods:

- keep it available in the current browser/session;
- screenshot it;
- Add to Apple Wallet / Google Wallet later;
- optional save/send functionality later.

Do not force contact-information collection simply so the user can claim an offer.

The MVP should preserve the extremely low-friction:

> **Unlock → Reveal → Claim → Go.**

---

# 8. In-person redemption

The promoting merchant needs a simple Beargo redemption interface usable by staff.

No POS integration is required.

At checkout:

1. Customer presents Beargo voucher.
2. Staff opens the merchant's Beargo redemption interface.
3. Staff scans the customer's Beargo QR or enters its short code.
4. Beargo validates the voucher.
5. Beargo displays the exact offer and conditions.
6. Staff confirms the purchase qualifies.
7. Staff taps **REDEEM**.
8. Voucher becomes permanently redeemed.
9. Exactly one $1 Beargo charge is generated.

Example merchant screen:

> # BEARGO OFFER
>
> **$10 off $30+**
>
> Confirm the customer's qualifying purchase is at least **$30.00**.
>
> **REDEEM OFFER**

Successful state:

> # REDEEMED
>
> Apply **$10.00 off** this purchase.

---

# 9. Percentage-off redemption

For percentage promotions, Beargo should make redemption easy for staff.

Example:

> **15% off $30+**

Staff may enter the qualifying pre-discount subtotal:

> Purchase subtotal: **$42.00**

Beargo shows:

> **Apply $6.30 discount**

If the offer has a cap:

> **20% off $50+, maximum $15 discount**

and subtotal is $100:

> **Apply $15.00 discount**

The merchant remains responsible for applying the discount in its own checkout/POS system.

Beargo is only verifying and recording the promotion redemption.

---

# 10. Billable event

The **only** event that produces Beargo revenue is a valid redemption confirmed through the merchant interface.

```
offer viewed        → $0
offer claimed       → $0
voucher generated   → $0
customer visits     → $0 until confirmed
merchant redeems    → $1
```

One valid redemption creates:

> **$1.00 Beargo revenue**

There must never be multiple $1 charges from the same voucher.

Redemption must be idempotent.

---

# 11. Merchant commercial proposition

The sales message is deliberately simple:

> ## Pay $1 for each customer Beargo brings you.
>
> Create an offer.
>
> Beargo shows it to people already out nearby.
>
> **You pay nothing when someone sees it.**
>
> **You pay nothing when someone claims it.**
>
> **You pay $1 only when your staff confirms that the customer actually showed up and redeemed it.**

This is the zero-to-one sales advantage.

The merchant is not being asked to buy speculative advertising.

They are buying:

> **verified physical customer visits at $1 each.**

---

# 12. Campaign configuration

Each local promotion should define at minimum:

### Business

- business;
- participating location(s);
- logo/image;
- category;
- address.

### Offer

- fixed-dollar or percentage discount;
- discount amount/percentage;
- minimum purchase;
- optional maximum percentage discount;
- short terms;
- valid products/services if restricted.

### Timing

- campaign start;
- campaign end;
- valid weekdays;
- valid hours;
- voucher expiration.

Example:

```
Thursday–Saturday
6:00 PM–11:30 PM
voucher expires at 1:00 AM
```

This allows genuinely contextual promotions such as:

> **$10 off tonight's 10:30 PM comedy show**

rather than generic evergreen coupons.

---

# 13. Campaign limits

Merchant can control exposure and cost through:

- maximum redemptions;
- maximum campaign spend;
- promotion dates;
- hours;
- eligible Beargo locations;
- geographic radius;
- participating merchant locations.

Because Beargo charges $1 per redemption:

```
Maximum redemptions: 100
Maximum Beargo fee: $100
```

Once the redemption cap or spend cap is reached:

- stop showing the promotion;
- previously issued valid vouchers should still be handled according to their stated validity rules.

Do not promise a promotion to a user and silently revoke it because the campaign filled after the voucher was issued.

---

# 14. Geographic relevance

Location is central to the product.

Beargo knows where the game was played from the physical Beargo location.

Use that location to select promotions.

Examples:

> Beargo player at Midtown bar
> → comedy club 0.5 miles away

> Beargo player at food hall
> → nearby entertainment venue

> Beargo player at brewery
> → local event later that evening

Precise scanner GPS should not normally be necessary.

The Beargo Host's known location is sufficient for initial routing.

---

# 15. Host protections

The establishment hosting the Beargo object must not feel that Beargo is advertising competitors against them.

Each Host should be able to have excluded categories or businesses.

Example:

A bar may allow:

- comedy;
- concerts;
- rideshare;
- attractions;
- salons;
- entertainment;
- local services.

But block:

- competing bars;
- competing restaurants;
- nearby nightlife venues.

Promotion eligibility should respect Host restrictions before anything is shown.

The Host relationship is more important than squeezing an extra promotion into a session.

---

# 16. Promotion selection

For MVP, show **one promotion at most** after a completed game.

Do not build an offer marketplace or carousel.

A promotion should only be eligible if:

- campaign is active;
- campaign has remaining redemption capacity/budget;
- Beargo Host is eligible;
- merchant location is geographically appropriate;
- current day/time is valid;
- Host restrictions allow the category/business;
- offer is relevant enough to justify showing;
- promotion has not been suppressed for another operational reason.

If no eligible promotion exists:

> End after the trivia result.

No empty teaser should appear.

No filler advertisement.

If an eligible promotion exists but its discount/proximity/timing cannot form a compelling value-first teaser, Beargo may also choose not to show it. Protect repeat play over monetizing every completed game.

---

# 17. Voucher states

Conceptual voucher lifecycle:

```
claimed
redeemed
expired
cancelled
invalid
```

### Claimed

Voucher exists and can potentially be redeemed.

### Redeemed

Merchant successfully confirmed it.

Cannot be used again.

### Expired

Validity period ended without redemption.

No Beargo charge.

### Cancelled

Promotion/voucher was legitimately cancelled under allowed rules.

### Invalid

Fraudulent, malformed, wrong merchant, or otherwise unusable.

---

# 18. Redemption validation

Before allowing redemption, verify:

- voucher exists;
- voucher has not already been redeemed;
- voucher has not expired;
- voucher belongs to the correct promotion;
- redemption is being performed by an authorized merchant/location;
- applicable campaign/voucher conditions permit redemption;
- fraud/security checks pass.

Once successful:

```
redeemed_at
merchant_location
merchant_user
campaign
voucher
Beargo_fee = $1
```

must be durably recorded.

---

# 19. Fraud controls

The $1 fee makes heavy fraud economically less attractive than high-value CPA programs, but basic controls are still required.

Protect against:

- one voucher being redeemed repeatedly;
- merchant staff accidentally scanning twice;
- forged voucher IDs;
- vouchers redeemed at wrong merchants;
- automated mass claiming;
- abnormal claim/redemption patterns;
- merchant self-testing accidentally becoming billable;
- staff abuse.

Useful controls include:

- random non-sequential voucher tokens;
- server-side redemption;
- authenticated merchant users;
- single-use enforcement;
- rate limits;
- campaign-specific claim limits;
- audit log;
- test/demo mode that never bills.

---

# 20. Merchant billing

Each successful redemption creates a $1 campaign charge.

Merchant billing should be cumulative rather than processing a separate $1 card transaction every time.

Conceptually:

```
1 redemption    = $1 accrued
17 redemptions  = $17 accrued
100 redemptions = $100 accrued
```

Charges can be settled according to the existing billing architecture.

Campaign should automatically pause if:

- merchant payment method fails;
- budget/spend limit is reached;
- merchant account is suspended.

---

# 21. Merchant dashboard

The merchant should immediately understand whether Beargo is producing real customers.

Show both **raw counts and percentages**.

## Primary numbers

- unlocked-offer teaser impressions;
- teaser opens / merchant reveals;
- offer views;
- offers claimed;
- vouchers redeemed;
- Beargo fees;
- remaining redemption budget.

Example:

> **1,420 offer views**
> **213 claims**
> **48 redemptions**
> **$48 Beargo fees**

---

# 22. Conversion percentages

Always pair major raw counts with conversion rates.

### Teaser-open rate

```
teaser opens / teaser impressions
```

This measures whether the post-result value proposition is strong enough to continue the session.

### Claim rate

```
claims / offer views
```

Example:

> 213 / 1,420 = **15.0% claim rate**

### Redemption rate

```
redemptions / claims
```

Example:

> 48 / 213 = **22.5% redemption rate**

### View-to-redemption rate

```
redemptions / offer views
```

Example:

> 48 / 1,420 = **3.4% view-to-redemption**

### Game-to-offer engagement

Where useful:

```
teaser opens / eligible completed games
```

Also track:

```
offer views / eligible completed games
```

These percentages matter because a merchant needs to understand the quality of the promotion, not just cumulative volume.

---

# 23. Optional purchase-total measurement

The merchant redemption screen may optionally allow staff to enter the customer's pre-discount purchase subtotal.

Example:

> Purchase subtotal: **$41.50**

This would allow Beargo to show:

- redemption count;
- total Beargo-attributed spend;
- average purchase size;
- Beargo fees;
- merchant revenue per Beargo fee.

Example:

> 48 customers redeemed
> $1,982 in recorded purchase value
> $41.29 average check
> $48 Beargo fees

Do **not** make purchase-total entry mandatory if it creates checkout friction.

The primary verifiable event remains redemption.

---

# 24. Scanner privacy

This model should intentionally require far less scanner PII than the former Qualified Introduction model.

For normal promotion use:

> **No Name required.**
> **No Email required.**
> **No Phone required.**
> **No email verification.**
> **No qualification questions.**
> **No startup-specific lead consent.**

The scanner is claiming a merchant offer, not becoming a marketing lead.

Collect only what is genuinely required to operate the game, voucher, fraud prevention, and optional user-requested saving functionality.

---

# 25. Remove the former introduction funnel

The following previous concepts are no longer part of the core Beargo product:

- company/startup introduction missions;
- startup interest qualification;
- “I'd try it / Seems useful / Maybe later” funnel;
- Name + Email + Phone capture for advertiser leads;
- email verification for advertising conversion;
- qualification questions;
- Qualified Leads;
- CPL billing;
- consent receipts for lead sharing;
- startup lead export;
- startup-side follow-up as the purchased outcome;
- “company pays the Host for your introduction.”

They should be replaced conceptually by:

```
Local Promotion
↓
Offer View
↓
Claimed Voucher
↓
Physical Visit
↓
Merchant-Confirmed Redemption
↓
$1 Beargo Fee
```

---

# 26. Revised actor model

There are now three core commercial actors.

## Scanner / Player

- scans Beargo;
- plays the daily challenge;
- sees local rank;
- may see one value-first unlocked-offer teaser;
- may reveal one nearby merchant offer;
- claims for free;
- redeems at merchant;
- pays Beargo $0.

## Beargo Host

The establishment/person/location where the physical Beargo prop lives.

- provides physical audience;
- receives the Beargo game experience;
- controls appropriate promotion categories;
- does not need to participate in the promoted merchant's redemption flow.

The Host and promoting merchant may sometimes be the same business, but they are distinct roles.

## Promoting Merchant

The business purchasing customer acquisition.

- creates promotion;
- defines discount;
- defines minimum spend;
- defines validity;
- defines redemption cap;
- receives Beargo customers;
- confirms redemption;
- pays Beargo $1 per valid redemption.

---

# 27. Examples

## Example A — fixed discount

Jane plays Beargo at The Rustic at 9:10 PM.

Result:

> **3/3 — #8 at The Rustic today**

As the result settles, a second card rises into view:

> ### YOU UNLOCKED
>
> # **$10 OFF NEARBY**
>
> **0.6 miles away · Tonight**
>
> **SEE WHERE**

Jane taps or swipes upward.

The full offer is revealed:

> # $10 OFF $30+
>
> **The Riot Comedy Club**
>
> 0.6 miles away
>
> Valid tonight
>
> **CLAIM FREE**

Jane claims for free.

At The Riot, her qualifying purchase is $38.

Staff scans Beargo voucher.

Beargo says:

> **Apply $10 discount**

Staff confirms.

Result:

```
Jane discount = $10
Beargo charge to The Riot = $1
voucher = redeemed
```

---

## Example B — percentage discount

Marcus plays Beargo at a Midtown brewery.

After his score resolves, the teaser appears:

> ### YOU UNLOCKED
>
> # **15% OFF NEARBY**
>
> **0.5 miles away · Tonight**
>
> **SEE WHERE**

He opens it.

Full offer:

> # 15% OFF $25+
>
> **Nearby entertainment venue**
>
> 0.5 miles away
>
> Valid tonight
>
> **CLAIM FREE**

He claims.

His purchase subtotal is $40.

Staff scans voucher and enters $40.

Beargo shows:

> **Apply $6.00 discount**

Staff redeems.

Beargo earns:

> **$1**

---

## Example C — no redemption

Sarah completes the game and sees:

> ### YOU UNLOCKED
>
> # **20% OFF NEARBY**
>
> **0.4 miles away · This weekend**
>
> **SEE WHERE**

She reveals the merchant and claims the offer, but never visits.

Result:

```
Offer view = yes
Claim = yes
Redemption = no

Merchant Beargo fee = $0
```

This is intentional.

The merchant only pays for a customer who actually arrives and redeems.

---

# 28. North-star commercial flow

```
LOCAL BUSINESS
creates compelling offer
↓
sets redemption cap
↓
agrees to $1 per verified redemption
↓
Beargo distributes offer
to relevant nearby players

PLAYER
plays Beargo
↓
gets score/rank
↓
immediately sees value-first unlocked-offer teaser
("$10 OFF NEARBY · 0.6 miles · Tonight")
↓
may tap/swipe to reveal merchant
↓
claims free voucher
↓
visits merchant
↓
presents voucher

MERCHANT STAFF
scans Beargo voucher
↓
confirms purchase qualifies
↓
redeems

BEARGO
marks voucher redeemed
↓
creates exactly one $1 charge
↓
updates campaign analytics
```

# 29. Core product principle

The monetization promise should remain:

> **Beargo makes money when it creates measurable physical customer traffic — not merely because someone looked at an ad.**

For the first version:

> # **One redeemed customer = $1 to Beargo.**

That should be the commercial model developers build around.