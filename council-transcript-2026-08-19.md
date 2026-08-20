# Council transcript — Stampede charts

Date: 2026-08-19

## Original question

Talk to other models: what do they think about the charts — what's missing, what to add, what to improve.

## Framed question

Stampede is a weekly chart for vibe-coders: skip crowded clusters (Stampede), steal thin holes that already bill (Empty). Cream newsprint UI. Two views: a ranked list (Chart) and a d3 bump graph (Graph).

Graph today: X = 8 ISO weeks, Y = rank with #1 at the top; one polyline per cluster; Stampede solid, Empty dashed; capped at 15; category filter; week playhead; hover isolate + drawer; labels dodge; week ticks; dots at current week. Ranked list is the default reading path.

Constraints: no fake verified MRR, ESTIMATE stays labeled, no SaaS cards/modals, two grammars (skip vs steal), Oswald + IBM Plex Mono.

Question: What is missing from these charts, what should be added, and what should be improved first so a vibe-coder leaves with one skip or one steal?

## Anonymization mapping (peer review)

- Response A = The Expansionist
- Response B = The First Principles Thinker
- Response C = The Contrarian
- Response D = The Executor
- Response E = The Outsider

## Advisor responses

### The Contrarian

The most dangerous assumption is that the bump graph is a decision surface. It is a race. Fifteen polylines, a playhead, dodged labels, and hover-isolate are craft for watching motion. A vibe-coder who came to skip or steal leaves with a screenshot of spaghetti. The ranked list is already the reading path. Every hour spent polishing Graph delays the job.

Worse: rank on Y is a category error. Stampede #1 means most crowded: skip. Empty #1 means thinnest hole that still bills: steal. Same axis, opposite verbs. Solid vs dashed does not fix that. The lane toggle makes it worse. Filter to Stampede and you only see skips, with no steal to walk toward. Filter to Empty and you only see holes, with no crowd to flee. Skip vs steal is a comparison. A toggle hides half of it.

Builder count on hover is the fragile number. Rank is a sort of that count. Eight weeks of rank motion is eight weeks of ranking a scrape. Precise-looking garbage. If the denominator is soft, every delta you plot is a lie with better typography.

Do not add more Graph craft. Do not add a KPI strip. Do not mix lanes on one Y. Do not invent a third grammar.

Improve first: the Chart list, not the bump. Pin one Skip and one Steal above the fold — this week’s #1 in each grammar, with the why line, ESTIMATE if Empty, and a permalink. Kill 15 as a reading default. Graph should show at most the five lines that moved. Drop the playhead. Eight weeks is historian bait; this week vs last week is the only delta that changes a weekend. If a label has to dodge to exist, the line should not be there.

Until the page answers “skip X or steal Y” without hover, click, or a second filter, the charts are a chart.

### The First Principles Thinker

The charts answer a different question than the one that matters.

The job is not “understand 8 weeks of rank.” The job is leave with **one skip or one steal** and a permalink. Rank, polylines, playhead, label dodge, and a 15-line cap are sports-broadcast machinery. They describe a race. The user is not watching a race. They are picking a hole.

What is missing is the **verdict on the reading path**. Stampede vs Empty already exist as two grammars, but the list still presents a catalog: rank, name, why, builders, spark. Empty’s money proof lives in the drawer. Without a labeled ESTIMATE receipt on the row, “few builders” is indistinguishable from “nobody wants this.” Steal then requires faith. Skip is easier — crowding is visible — but even skip has no named takeaway. Fifteen lines is the opposite of one.

The bump graph is the wrong object to improve first. It restates the spark already on the list, then asks you to hunt a line. Hover isolate and a drawer are inspection tools for someone who already chose. They do not produce the choice.

Add one thing: **this week’s pick, named as such, above the rest.**

- Stampede #1: SKIP. Cluster, builder count, one-line why.
- Empty #1: STEAL. Same, plus the ESTIMATE receipt on the row — source and dollars, never dressed as verified MRR.
- One copy control that emits the permalink. That is the exit the product already defined.

Do not mix the two into one “featured” card. Do not open a modal. Do not invent SaaS chrome. The rest of the chart stays optional context: the herd for people who want to argue with the pick, the graph for people who already care about a trajectory.

Improve the list first. Name the skip. Receipt the steal. Make paste the last click. Then stop. Everything else is decoration fighting the numbers.

### The Expansionist

The Graph is a trophy room. The product is a weekly pick. Chart is already the reading path — so every hour on 15 polylines, label dodge, and a playhead is leverage spent on a view nobody uses to decide. A bump line answers “how did rank move.” A vibe-coder needs “what do I do this week.”

What’s missing is the pair as one object. Stampede XOR Empty is a header toggle. That hides half the grammar. First paint should name both: #1 herd to skip, #1 hole to steal. Then they pick one. That pair is the screenshot, the Discord paste, the reason Monday exists. “Copy a line” currently lives in a drawer after a click. You buried the success metric.

Empty already stamps BEST HOLE on rank 1. Stampede #1 has no SKIP THIS. Asymmetry. Steal has a mark; skip is just a number. Graph hover showing builders + delta is status, not a verdict. Put the verdict on the playhead: one annotated #1, permalink attached. Graph is receipts for how that #1 got there — not a second product.

The compounding loop is the composer. Charts expire every ISO week. Count-me is how next week’s ranks exist. If they leave with a paste and never type what they’re building, you sold a magazine issue.

Do not add more weeks, more lines, a category rainbow, or a dual-lane overlay. Do not polish Graph first.

Improve first: Chart masthead. Two named picks, two copy buttons, ESTIMATE still labeled. A stranger should screenshot the list and leave with one skip or one steal without opening a drawer. Graph waits until that paste exists.

### The Outsider

A stranger opens this and hits a newspaper they cannot read. “Stampede” is both the product and one of two lanes. “Chart” is a list. “Graph” is spaghetti. “Empty” sounds broken. “Builders” could be stars, Discord members, or people who typed in a box. ESTIMATE is honest and still does not tell me what to do with the number. I am decoding before I am deciding.

Do not touch the Graph first. Fifteen overlapping lines, a playhead, dodging labels, hover isolation — that is a toy for people who already trust the ranking. A vibe-coder on Sunday night did not come to watch rank motion. They came to pick one thing not to build, or one hole to clone. Spaghetti does not produce that sentence.

What is missing is a verdict that does not require a toggle. I see either the herd or the holes, never both. Default is Stampede, so I may never click Empty, which is the money side. BEST HOLE exists only after I switch lanes, and only on rank 1. Stampede #1 has no SKIP THIS. There is no “this week, skip X / steal Y” at the top. The why column is the decision and it is the quietest type on the row. The permalink that was supposed to leave with me is not on the list.

Improve the Chart, not the Graph. Pin two lines above the list, always visible, no lane switch: one SKIP (Stampede #1) and one STEAL (Empty #1), each with the why in ink, ESTIMATE builders, and a copy link. Put SKIP / STEAL as a verb on every row so the grammar lives on the object, not in a header toggle. Then stop. If they still want the bump, they will find it.

### The Executor

The Graph is not the product. Chart is. Freeze the bump. Do not add another hover, another dodge, another playhead tick. A vibe-coder does not leave with a polyline. They leave with a row.

What is missing is a forced pick on that row. Rank, name, why, builders, spark, BEST HOLE, then a drawer that asks them to Count me. That is a catalog, not a decision. Copy a line exists and then hides behind a click. The permalink is the success metric and it is buried. Stampede #1 has no SKIP THIS. Empty #1 has BEST HOLE, which is a label, not a takeaway. Default lane is the herd they already know.

Ship Chart first. Monday:

1. Pin rank 1. Stampede lane: `#1 SKIP THIS` in ink. Empty lane: `#1 STEAL THIS` in oxblood. Verb sits on the number, not in the dek.
2. Put Copy a line on that row. One click, no drawer. Same line you already copy: why, rank, name, builders, week, ESTIMATE, permalink.
3. Default the ranked list to Empty. Steal is the job. Stampede is the other toggle for people who need a skip. Do not mix both grammars in one list.
4. Kill the drawer footer as the exit. Count me stays for people who are already building. The leave action is Copy. Drawer is receipts, leak, feeds. Secondary.

Do not touch Graph this week except to keep the cap and the dashed Empty stroke. Week playhead is for recap, not for Monday. Category filter stays. Hover isolation stays. Labels can keep dodging. None of that closes the loop.

If you only have one afternoon: default Empty, stamp STEAL THIS on #1, surface Copy on that row. That is the skip-or-steal. Everything else is scenery.

## Peer reviews

### Review 1

1. Strongest: B. Matches leave-with-a-paste. Names the steal-blocker (ESTIMATE in the drawer). Stop condition. A is close on the pair-as-screenshot.
2. Biggest blind spot: D. Default Empty keeps skip hidden. STEAL THIS without on-row ESTIMATE is still faith.
3. Missed: permalink durability after the week rolls. Starring #1 if the scrape is noisy. C said the denominator is soft for Graph; nobody applied that to Chart #1.

### Review 2

1. Strongest: A. The pair is the product. First paint names both #1s. Graph is receipts. Magazine trap: paste without Count-me.
2. Biggest blind spot: D. Empty-default hides skip. Does not offer skip or steal.
3. Missed: receipt truth — Empty #1 is phrase-match ESTIMATE, not a verified hole. Week-locked permalink/OG. Why copy, not the verb, is the actual decision.

### Review 3

1. Strongest: A. Skip and steal on first paint. Copy unburied. Graph is receipts, not a second product.
2. Biggest blind spot: D. Hide skip behind a toggle. No ESTIMATE on the steal row.
3. Missed: stamping SKIP/STEAL on a soft scrape is overconfident. Thin-data state. Last week’s steal getting crowded. Returning users / YOU / Count-me.

### Review 4

1. Strongest: A. Leave-object is a screenshot of skip XOR steal. SKIP THIS / BEST HOLE asymmetry. Buried copy. Count me as compounding loop.
2. Biggest blind spot: D. Speed without the receipt. Empty-default hides skip.
3. Missed: failure case if Empty has no ESTIMATE. Scoreboard (copy click vs bounce vs Count me). Dual-pin quietly repeals “do not mix the two grammars.”

### Review 5

1. Strongest: A. Pair as product. Copy on the masthead. Leave Graph alone.
2. Biggest blind spot: D. Empty-only default hides skip.
3. Missed: Count me as the other path (“you are in X”). Category-scoped picks. Thin + billed is not automatically a steal (adverse selection).

## Chairman synthesis

See council-report-2026-08-19.html.
