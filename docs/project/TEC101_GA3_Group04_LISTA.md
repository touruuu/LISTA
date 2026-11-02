# TEC101 — Technopreneurship
## GA3: Technology Ideation and Initial Concept Visualization
### LISTA · Group 4 · TEC101–MIT421

**Start-up team:** LISTA  
**Instructor:** Jomar Oblea  
**Submission/presentation date in template:** September 29, 2026  
**Status:** Consolidated draft for the group to review, correct, and approve before submission.

> **Scope note.** This draft keeps the GA1–GA2 problem and evidence base, but corrects claims in the earlier draft that were not supported by the research or the current LISTA application. LISTA is currently an online, server-authoritative shared ledger. It can queue writes in a browser-side outbox when connectivity is lost; this is not a promise of fully offline operation. QR profiles, SMS/Messenger receipts, and a borrower app are not current features.

---

## Part 1 — GA1–GA2 Design Basis

### Selected concept
**LISTA** is a digital credit/debt ledger intended to organize records of amounts owed, payments, remaining balances, and transaction history in one place.

### Validated problem
Small businesses and individuals who engage in informal credit or debt can have difficulty maintaining clear, verifiable records. Handwritten notes, memory, chat messages, spreadsheets, and separate payment records can make it difficult to confirm what was owed, what was paid, and what remains. This can contribute to uncertainty, inefficient tracking, errors, or disagreements. The GA1–GA2 evidence is strongest for micro-enterprises; the need among individual borrowers and lenders still requires direct validation.

### Opportunity statement
There is an opportunity to improve informal credit/debt tracking by providing a simple, organized way to record amounts owed, payments, remaining balances, and transaction history—particularly to address the limitations of manual, scattered, and one-sided record-keeping methods.

### Target users and stakeholders
- **Primary:** Micro-store owners (including sari-sari stores) who record customer credit, and customers who use that credit. Owners need to track credit sales and repayments; customers need to review what they owe, have paid, and still owe.
- **Secondary, pending validation:** Individual lenders and borrowers who manage informal personal debts.
- **Other stakeholders:** Store helpers or family members may enter or receive payments. Suppliers/wholesalers are indirect stakeholders because unclear receivables can affect business cash availability.

### Technology/research gap
Existing approaches can capture parts of a transaction but may not provide one easy-to-check record combining the original amount, payments, remaining balance, and transaction history. Notebooks and personal records may be one-sided; details in chats or payment records may be scattered; and spreadsheets or generic apps may require setup or may not match quick informal-credit workflows. Whether users need buyer-side shared verification, offline/low-data operation, local-language support, reminders, or other features remains to be validated—not assumed.

### Evidence and limits
- Sacsac (2026) studied 310 sari-sari stores and documented credit-management and record-keeping problems [1].
- Malinao (2026) reported that 14 of 18 studied micro-enterprises (77.78%) lacked a formal record-keeping system [2]. This small study sample is not a population-wide estimate. The GA1–GA2 evidence slide calls this Malinao (2026), while its reference list says “Mba”; the publisher’s article page identifies Richard Mark Malinao as the author and contains the 14-of-18 finding. [Publisher article](https://doi.org/10.47772/ijriss.2026.100400474)
- Debuque-Gonzales and Corpus (2021) reported that approximately 57% borrowed from family or friends in the study context [3]. This supports the relevance of informal borrowing, but does not by itself show that individual borrowers have a record-keeping problem.
- Chanda et al. (2025) discuss trust, reputation, and relationship concerns around informal borrowing [4]. This is context, not proof that a particular product feature will prevent disputes.

Together, these sources support an informal credit/debt-management context, with the clearest direct record-keeping evidence among micro-enterprises. They do not prove that every target user has the same need or that proposed features will be adopted or improve outcomes.

---

## Part 2 — SCAMPER-Based Technology Ideation

The ideas below apply SCAMPER to the validated record-scattering problem. They distinguish existing LISTA functions from future options. Current LISTA uses a server-authoritative ledger; the browser-side offline outbox queues writes for later submission and does not make the full application offline-first.

| SCAMPER element | Application to LISTA | Expected benefit / boundary |
|---|---|---|
| **Substitute** | Replace scattered notes and manual balance calculations with LISTA’s customer ledger, itemized utang, payment entries, and calculated balances. | Consolidates records and reduces reliance on manual arithmetic. The shared ledger requires the server; paper can still work without a device or connection. |
| **Combine** | Keep customer records, itemized credit, payments, due dates, and transaction history together in the customer ledger. LISTA already combines these. Explore optional notifications only if users request them and privacy/feasibility checks support them. | Lets a storekeeper review account context without assembling separate records. SMS/Messenger notifications are proposals, not shipped features. |
| **Adapt** | Adapt familiar “lista sa tindahan” concepts—customer names, dated entries, and a clear remaining balance—to a searchable digital ledger. Test Tagalog/Taglish labels and counter workflows with storekeepers before adding them. | Retains a familiar recordkeeping model while testing whether digital search and review fit the users’ language and work habits. |
| **Modify / Magnify / Minify** | Make transaction details, payment history, due dates, and balance status easy to scan; simplify entry only where it does not hide useful information. Test the camera-and-signature evidence flow for clarity and counter usability. | May improve reviewability, but the photo/signature steps may add friction. Do not claim a fixed entry time until measured. |
| **Put to Another Use** | Use existing transaction history and JSON/CSV exports to help an owner review outstanding balances and past payments. A future summary for basic receivables review could be explored. | May support record review. Do not create customer credit scores or infer repayment reliability without consent, evidence, and safeguards. |
| **Eliminate** | Reduce dependence on scattered records and avoid requiring a buyer to install an app for the owner to maintain the ledger. As a proposed refinement, make queued-write status and recovery clearer without describing the application as fully offline. | Keeps the core workflow focused. A queued write is not the same as offline browsing, guaranteed synchronization, or complete offline persistence; reliable recovery needs testing. |
| **Reverse / Rearrange** | Organize the workflow around the customer account: find/select a customer, review balance/history, then record utang or payment. LISTA already supports customer search and account views; test any proposed navigation changes. | Puts account context before entry. Whether this is faster or clearer must be observed with users. |

### Three concept directions emerging from SCAMPER
1. **LISTA Shared Digital Ledger — current core direction.** Organize customers, itemized utang, payments, due dates, balances, and transaction history in the current server-authoritative ledger.
2. **Offline-First Owner Ledger — unbuilt alternative.** Explore broader local recording when the connection is unavailable, followed by synchronization or export. This would require architectural changes and decisions about conflict resolution, backup, and device loss; current queued-write behavior is not equivalent.
3. **Borrower Access and Receipt Extension — unbuilt alternative.** Explore borrower-facing access or delivery, such as SMS receipts or QR-based profiles. Current read-only statement links are distinct from those proposed channels; privacy, identity, delivery, and adoption would need evaluation.

---

## Part 3 — Alternative Technology Concepts and Concept Selection

**Scoring:** 1 = very weak; 5 = very strong. Each criterion is scored out of 5; maximum total is 30. Scores are comparative screening judgments, not measured customer outcomes.

### Alternative concepts and screening table

| Concept | Brief Description | Target User | Core Features / Functions | Problem / Gap Addressed | Key Differentiator | Score /30 |
|---|---|---|---|---|---|---:|
| **1. LISTA Shared Digital Ledger (selected; current implementation)** | Browser-based, server-authoritative ledger that centralizes customer accounts and transaction records. A browser outbox can queue writes during connection loss, but the application is not fully offline. | Primary: sari-sari and other small-store owners who record customer credit, plus their credit customers. | Customer search and accounts; itemized utang; payments; due dates, balances, and history; photo/signature evidence for new utang; hash-chain verification; append-only voids; read-only statement links; exports. | Replaces scattered notes, memory, and separate payment records with an organized account history. | Owner maintains one shared ledger; customers can review a read-only statement link without installing a borrower app. Evidence functions support review but do not prove identity, legal consent, or transaction truth. | **27/30** |
| **2. Offline-First Owner Ledger (unbuilt alternative)** | Proposed owner-device-first ledger that supports broader local recording during outages, then synchronizes or exports later. This would require architectural changes. | Small-store owners operating where connectivity is unreliable; their customers remain transaction participants. | Proposed local records and later synchronization/export; conflict handling, backup, and device-loss recovery would need to be designed and tested. | Addresses the limit of a server-authoritative workflow when connectivity is lost; queued writes do not provide full offline operation. | Local-first operation could support a broader offline workflow, but it is not a current LISTA capability and entails data-integrity risks to resolve. | **20/30** |
| **3. Borrower Access and Receipt Extension (unbuilt alternative)** | Proposed borrower-facing extension for expanded access or delivery of transaction information. | Store-credit customers and, pending validation, individual borrowers and lenders. | Possible SMS receipts or QR-based profiles; currently, LISTA has read-only statement links only. Proposed channels would require privacy, identity, delivery, and adoption testing. | Addresses whether customers need easier access to, or a copy of, their recorded balance and transaction details. | Adds a borrower-facing delivery/access channel beyond the current statement link; SMS receipts, QR profiles, and a borrower app are not shipped features. | **22/30** |

Scores are comparative screening judgments, not measured customer outcomes. They sum six equally weighted criteria: problem–solution fit, value to target users, technical feasibility, innovativeness/differentiation, course feasibility, and potential market relevance. The per-criterion screening is retained below for transparency.

| Screening criterion | 1. Shared Ledger | 2. Offline-First Ledger | 3. Borrower Access Extension |
|---|---:|---:|---:|
| Problem–solution fit | 5 | 4 | 4 |
| Value to target users | 5 | 4 | 4 |
| Technical feasibility | 5 | 2 | 3 |
| Innovativeness / differentiation | 3 | 4 | 4 |
| Feasibility within the course | 5 | 2 | 3 |
| Potential market relevance | 4 | 4 | 4 |
| **Total / 30** | **27** | **20** | **22** |

The Shared Digital Ledger is selected because its core workflow is implemented and directly addresses scattered recordkeeping. The scores do not prove differentiation or market demand. The offline-first and borrower-access directions remain alternatives requiring technical and user validation.

### Selected technology concept
**LISTA Shared Digital Ledger — refine and validate the existing concept.**

### Selection justification (approximately 150–200 words)
We select the LISTA Shared Digital Ledger as the course concept because it most directly addresses the validated problem of fragmented informal-credit records and can be evaluated using an existing implementation. It organizes customer accounts, itemized utang, payments, dates, balances, and transaction history in one server-authoritative ledger. Its evidence workflow, verification check, append-only voids, read-only statement links, and exports provide concrete functions to examine in the initial visualization. The screening score of 27/30 reflects comparative fit and course feasibility, not proven adoption, faster service, or fewer disputes. The evidence base is strongest for micro-enterprises, so initial customer validation should focus on storekeepers and customers who use store credit; the individual-borrowing segment remains secondary until directly researched. We do not select the earlier “Sync & Verify” proposal as written because QR profiles, SMS/Messenger receipts, guaranteed offline operation, and two-party verification are not current LISTA capabilities and have not been validated. Offline-first operation and borrower-facing delivery remain possible future alternatives, subject to technical and user testing.

---

## Part 4 — Preliminary Value Proposition

| Primary Target Users | Specific User Need / Pain Point | Proposed Technology Solution | Main Functional Benefit(s) | Key Differentiator | Evidence / Insight from GA1–GA2 Supporting the Value Proposition |
|---|---|---|---|---|---|
| **Primary:** sari-sari and other small-store owners who record customer credit, and the customers who use that credit. **Secondary, pending validation:** individual borrowers and lenders. | Credit amounts, payments, and remaining balances may be spread across notebooks, memory, chats, or separate payment records, making it difficult to review how a balance changed. | Refine LISTA’s existing browser-based, server-authoritative shared ledger to organize customer accounts and transaction records. Browser-side queued writes do not make the system fully offline. | Record itemized utang and payments; review dates, balances, and transaction history; access read-only statements; use photo/signature evidence for new utang and a hash-chain check to support record review. These functions organize evidence; they do not establish transaction truth or prove consent. | Store owners can maintain one customer ledger without requiring each customer to install an app. Customers may review read-only statement links; these are not acknowledgements or two-party write access. | GA1–GA2 evidence identifies credit-management and recordkeeping issues among 310 sari-sari stores [1]. A separate study reports that 14 of 18 rural micro-enterprises lacked formal recordkeeping [2], a small context-specific sample. Other cited work gives context on informal borrowing [3], [4], but does not prove demand for LISTA or validate individual borrowers as a target market. |

**Validation boundary:** The value proposition is preliminary. The cited evidence supports a recordkeeping problem most directly among micro-enterprises; it does not establish product adoption, faster entry, fewer disputes, improved accuracy, or demand. Test the workflow and proposed benefits with store owners and customers before making outcome claims.

---

## Part 5 — Initial Concept Visualization

**Visualization type:** Software UI/wireframe. The following are initial conceptual wireframes based on the current feature set, not screenshots of the live application. The views are designed for a phone-sized browser; currency amounts are placeholders.

### View 1 — Dashboard and customer list
```text
┌──────────────────────────────────────────┐
│ LISTA                          [PIN lock] │
│ Shared ledger                             │
│                                          │
│ Outstanding balance       Overdue         │
│ ₱ [total]                 [count]         │
│                                          │
│ [ Search customers…              ]       │
│                                          │
│ Customers                   [+ New utang] │
│ Ana Santos          ₱[balance] [Open ›]  │
│ Ben Cruz            ₱[balance] [Open ›]  │
│ …                                        │
│ [Home] [Customers] [History] [Verify]    │
└──────────────────────────────────────────┘
```
**Caption:** Provides a starting view of ledger totals and customer balances, plus search and routes into a customer account or new utang flow.

### View 2 — Customer account and transaction history
```text
┌──────────────────────────────────────────┐
│ [‹ Customers]            Ana Santos       │
│                                          │
│ Current balance              ₱[balance]   │
│ [Record payment]       [Add utang]        │
│                                          │
│ Transaction history                      │
│ Date       Entry       Amount    Due      │
│ [date]     Utang       ₱[amount] [status] │
│ [date]     Payment    −₱[amount]          │
│ …                                        │
│ [Open read-only statement]               │
└──────────────────────────────────────────┘
```
**Caption:** Shows the account balance and history together. Due/overdue information and statement access support review; the statement is read-only, not an acknowledgement.

### View 3 — Itemized new utang and evidence capture
```text
┌──────────────────────────────────────────┐
│ [Cancel]                 New utang        │
│ Customer       [Select customer       ▾]  │
│ Due date       [Choose date           ]  │
│                                          │
│ Items                                    │
│ Description   Qty   Unit price   Amount   │
│ [__________]  [__]  [_________]  [____]   │
│ [+ Add item]                              │
│ Total                         ₱[total]   │
│                                          │
│ Evidence for new utang                    │
│ [Take photo]          [Capture signature] │
│ [Review details]             [Save utang] │
└──────────────────────────────────────────┘
```
**Caption:** Associates an itemized credit entry and due date with a customer, then captures the photo/signature artifact before saving. It is a record of the transaction flow, not proof of identity or legal consent.

### Optional View 4 — Verification and export tools
```text
┌──────────────────────────────────────────┐
│ Ledger tools                              │
│ [Verify ledger integrity]                 │
│ Status: [verification result]             │
│                                          │
│ Export records                            │
│ [Download JSON]     [Download CSV]         │
└──────────────────────────────────────────┘
```
**Caption:** Provides access to the hash-chain integrity check and record exports.

### Visual explanation (100–150 words)
The wireframes show a phone-sized interface for LISTA’s shared, browser-based ledger. The dashboard summarizes ledger totals and customer balances, while search leads to an individual account. That account brings the running balance and dated transaction history together so a storekeeper can review the entries behind the amount due. The new-utang view links a customer, due date, and itemized lines, then makes photo and signature capture explicit before saving. A separate tools view represents integrity verification and JSON/CSV export. These screens focus on the validated need to organize scattered credit and payment records. The statement is shown as read-only, not as customer confirmation. The interface represents an online, server-authoritative ledger; the browser may queue writes during a connection interruption, but the concept does not promise full offline use. These are conceptual views and require usability testing.

---

## Part 6 — Features, Functions, and Problem–Solution Alignment

| Feature / component | What it does | User need / problem addressed | Expected benefit / improvement |
|---|---|---|---|
| Shared, server-authoritative ledger | Stores customer balances and dated transaction history centrally; browsers view the shared record. | Owners need an organized ledger rather than disconnected notes. | Makes account balances and the entries behind them easier to review across sessions/devices. |
| Itemized utang and payment recording | Records credit purchases as line items and logs payments as transactions. | A single total or separate payment note can be hard to explain or reconcile later. | Provides more context for charges and shows how recorded payments affect the ledger balance. |
| Due dates and overdue indicators | Allows due dates and overdue status to be recorded/displayed. | Owners may lose track of when credit is expected to be repaid. | Makes due-date information more visible for record review and follow-up planning. |
| Photo/signature evidence for new utang | Captures a camera image and drawn signature together as a transaction artifact. | Parties may need a record of what was documented when credit was given. | Adds transaction context for later review; does not independently prove identity or legal consent. |
| Hash-chain verification and append-only voids | Checks for post-record integrity changes; corrections can be recorded as void offsets rather than silently deleting entries. | Users need changes and corrections to be more transparent in the ledger. | Supports traceability and review. A hash chain detects certain alterations; it does not prove an entry is true. |

**Connectivity boundary:** LISTA is server-authoritative. A browser outbox can queue writes for later submission, but full offline reading/writing and real-phone offline reliability are not established.

---

## Part 7 — Justification Against Existing Solutions

| Existing approach | How it addresses the problem | Strength | Limitation / gap | LISTA’s response |
|---|---|---|---|---|
| **Notebook / paper ledger** | Keeps written amounts and notes. | Simple, inexpensive, and usable without a device or internet. | Searching, sharing, backing up, and reconciling may require manual effort. | Provides searchable customer records, dated entries, calculated balances, and transaction history in a browser-accessible ledger. |
| **Memory and calculator** | Helps recall a transaction or calculate a quick total. | Convenient for a simple, isolated transaction. | Does not inherently retain an itemized history or persistent running balance. | Records utang and payments against a customer account so prior entries can be reviewed. |
| **Spreadsheet / generic app** | Stores records digitally and can organize transactions. | Flexible and searchable when configured. | May require setup or workflows that do not fit fast informal credit transactions. | Provides a customer-ledger workflow with credit-specific entries, due dates, and balances. |
| **Chat/payment records** | Messages communicate details; transfer apps show payment activity. | Convenient communication or evidence that a transfer occurred. | Details can be buried; a payment record may not show the original debt or complete remaining balance. | Keeps recorded debt and payment entries together with the resulting ledger balance. |

### Comparative justification (150–200 words)
LISTA is designed for small-store utang recordkeeping, where an owner needs to track both a customer’s balance and the entries that make it up. Compared with a notebook, LISTA provides searchable customer records and a digital transaction history; paper remains simple, inexpensive, and usable without a device or internet. Compared with memory and a calculator, LISTA is designed to retain itemized utang and payment entries rather than support only a quick total, while memory and a calculator may be more convenient for an isolated transaction. A spreadsheet or generic app can organize records digitally, but may require setup or workflows that do not match informal credit transactions. LISTA includes dated entries, overdue indicators, consent artifacts for new utang, hash-chain verification, append-only voids, and read-only statement links. These are product capabilities, not evidence of measured improvements in speed, adoption, accuracy, or security. LISTA is server-authoritative and requires connectivity for writes; only offline writes may be queued. It should not be presented as offline-first. It also does not provide SMS receipts, QR profiles, or a borrower app.

---

## Part 8 — Remaining Assumptions and Next Refinement Priorities

| Remaining assumption / uncertainty | Why it matters | How it should be validated or refined later |
|---|---|---|
| The strongest evidence is for microbusiness recordkeeping; the fit for individual borrowers/lenders is not established. | Store-credit users and personal borrowers may have different workflows, privacy expectations, and reasons to use a ledger. | Interview individual borrowers/lenders directly and compare their practices and needs with sari-sari store owners before claiming both as validated markets. |
| A shared ledger, photo/signature capture, and read-only statement links will be understandable and acceptable to both parties. | Consent, trust, and privacy concerns may affect use; a statement is not an acknowledgement and does not itself resolve disputes. | Test the consent flow and sample statement with owners and customers; assess comprehension, comfort, and what users think the evidence does or does not prove. |
| The current entry and review flow is practical during real counter use. | Friction, unclear labels, or small-screen difficulty could discourage repeated use. | Observe owners and customers completing realistic tasks on phones; record completion, errors, assistance, and task time, then refine from observed issues. |
| Queued writes and recovery are dependable under real connectivity interruptions. | Missing, duplicated, or delayed entries could undermine trust in the ledger. | Conduct a physical-phone connection-loss/recovery test; check queue visibility, sync behavior, duplicate handling, backup/restore, and record any unsupported offline behaviors. |
| Demand, continued use, and willingness to pay are unknown. | Evidence of a recordkeeping problem does not by itself demonstrate adoption or a sustainable business model. | After confirming user/workflow fit, test concept and pricing reactions; treat stated interest as directional and look for pilot commitment or continued observed use before making demand claims. |
| Claims in the cited studies may not generalize to all intended users or locations. | Overgeneralized prevalence could distort market sizing and product priorities. | Verify each source’s study population and scope; describe estimates with their context and recruit local target users for direct validation. |

---

## Part 9 — Team Reflection and Decision

> **Draft group-voice reflection (150–200 words).** Group members should review and confirm that this accurately represents their process before submission.

SCAMPER helped us move from recordkeeping toward a shared ledger with clearer transaction details and integrity evidence, while separating practical refinements from unvalidated additions. The biggest influence on our selection was the fit with LISTA’s primary users: micro-stores that need a straightforward way to track customer credit, payments, and balances. Since uniqueness scored 3/5, novelty alone did not drive our choice. We are keeping individual lenders and borrowers as a possible secondary audience, pending validation.

The UI visualization made the workflow more concrete: recording an itemized purchase, noting a payment, and reviewing a customer’s balance and history. It also highlighted assumptions to test, especially whether entry is practical and whether customers understand and consent to photo or signature evidence. After customer validation and technical evaluation, we may simplify the flow, revise evidence capture, or change which users we prioritize. Offline transaction queuing is part of the current system, but full offline use remains unverified. QR cards, SMS receipts, and a borrower app are not part of the selected concept.

---

## References

[1] K. F. Sacsac, “Examining the interplay dynamics of business profile, credit risk management practices, problems encountered in CRM, and financial performance of the sari-sari store in Laoag City,” *Divine Word International Journal of Management and Humanities*, vol. 5, no. 1, pp. 2832–2860, 2026, doi: [10.62025/dwijmh.v5i1.250](https://doi.org/10.62025/dwijmh.v5i1.250).

[2] R. M. Malinao, “Financial sustainability of community-based micro-enterprises: A multi-case study on informal record-keeping among sari-sari stores in a rural Philippine setting,” *International Journal of Research and Innovation in Social Science*, vol. 10, no. 4, pp. 6608–6619, 2026, doi: [10.47772/ijriss.2026.100400474](https://doi.org/10.47772/ijriss.2026.100400474). The publisher’s article page identifies Richard Mark Malinao and reports that 14 of 18 studied businesses lacked formal record-keeping.

[3] M. Debuque-Gonzales and J. Corpus, *Understanding and Measuring Financial Inclusion in the Philippines*. 2021, doi: [10.62986/dp2021.37](https://doi.org/10.62986/dp2021.37).

[4] T. Chanda, J. N. Houle, L. K. Vogel, R. E. Dwyer, and L. M. Berger, “‘First phone call is usually family’: Informal borrowing among low-income debtors,” *Journal of Marriage and the Family*, vol. 88, no. 1, pp. 213–226, 2025, doi: [10.1111/jomf.70007](https://doi.org/10.1111/jomf.70007).

**Evidence base:** Group 4, *GA1–GA2 Evidence-Based Problem Validation*, Week 6 presentation deck, TEC101. The 77.78% figure’s author label was reconciled against the publisher’s article page because the deck’s evidence slide and reference list conflict. Study populations remain limited to their source contexts; the deck’s cited evidence does not establish product adoption or impact.

---

## AI Use Declaration — Complete before submission

The assignment requires disclosure of AI assistance. This draft was prepared with **Hermes Agent using GPT-6 Luna**, including delegated AI drafting and review support. AI assistance was used to synthesize the provided GA1–GA2 material, draft and revise written sections, develop the screening matrix and conceptual wireframes, and check completeness. The draft was revised to reflect the actual LISTA implementation and to remove unsupported claims about QR profiles, SMS receipts, two-party verification, fixed entry times, and fully offline operation. The group must review, revise, and approve the content and replace the bracketed names below before submission.

> “I/We, **[participating student name(s)]**, affirm that this work, titled **‘TEC101 GA3 – Technology Ideation and Initial Concept Visualization: LISTA,’** submitted for **TEC101 – Technopreneurship**, was created with the use of **Hermes Agent (GPT-6 Luna), accessed through the Hermes desktop application**. The tool was used to **draft and revise written responses, organize the concept-screening analysis, and create conceptual UI wireframes**. The output from this tool was revised to **align with the GA1–GA2 evidence and the current LISTA application, remove unsupported feature and impact claims, and identify assumptions requiring group review and validation**.”

---

## Before submission — group checklist

- [ ] All group members reviewed and approved the revised problem, concept choice, scores, and reflection.
- [ ] Check the full references and verify study populations/statistics against the source articles.
- [ ] Replace the AI declaration placeholder with the participating students’ names and confirm the statement is accurate.
- [ ] Confirm that the wireframes are acceptable as the initial software visualization; the assignment’s Word submission asks for the visualization embedded in the document.
- [ ] Create the separate concise PowerPoint summary (the assignment requires both Word and PowerPoint files); this Markdown file is the written-content draft, not the slide deck.
