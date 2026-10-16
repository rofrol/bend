import Base

# Standalone agent policy with a partially formalized model.
# Read this entire file, including comments, and PROOF.bend before working.
# The embedded policy is complete: using this pair does not require AGENTS.md.
#
# HOW TO USE THIS PAIR
# Explicitly load LAWS.bend and PROOF.bend into the agent's instructions/context;
# their filenames alone do not guarantee automatic discovery by an agent tool.
# Follow the embedded policy throughout inspection, implementation and reporting.
# Comments are instructions for the agent, not propositions checked by Bend.
# The formal predicates express only the subset described under COVERAGE.
# Preserve the laws; update proofs when changing the modeled implementation.
# Do not weaken specifications merely to make proofs pass. If requirements
# conflict, follow Stop and Ask in the embedded policy.
# Run bend PROOF.bend after changing either file and before committing work
# governed by this pair. A failed check must be resolved or reported as blocked;
# if Bend is unavailable, report that verification was not performed.
# Still perform the project's relevant tests: this proof checks only the model.
# Report proof results separately from tests and human-reviewed assessments.
#
# MAINTENANCE
# AGENTS.md is retained as an alternative distribution of the same policy.
# The embedded copy is not loaded from it at runtime. Keep both policy texts
# synchronized when intentionally revising the shared policy; if they conflict,
# report the conflict and seek direction rather than silently choosing one.
# The model and proofs below do not establish equivalence with the prose.
#
# Check all claims and their proofs with: bend PROOF.bend
# Reference: https://github.com/HigherOrderCO/Bend (guide: bend guide).
# Checked with Bend 2.0.20; guarantees also depend on the checker's soundness.
#
# SCOPE AND TRUST
# This repository contains policy documents, not an application to verify.
# The pure predicates below model necessary policy gates, NOT sufficient
# authorization to act. They neither inspect code nor intercept tools or IO.
# A True input is an externally established fact, not evidence of that fact.
# In particular, Bool does not authenticate a human or establish approval scope.
# Passing these proofs proves properties of this model for all inputs; it does
# not prove that an agent followed the embedded policy or gave true assessments.
# Missing assessment is not False: investigate first, then stop the affected
# work if material uncertainty remains. Do not guess inputs to obtain permission.
#
# Human review remains necessary for materiality, approval scope, adequacy,
# current consumers, data ownership, and whether verification is proportionate.
# Existing explicit approval counts only while it covers the actual consequences.
# No approval to implement implies approval to deploy, delete data or expand access.
#
# COVERAGE
# Human Responsibility; Rules 1, 3, 8: approval_gate.
# Classifying Changes: nontrivial (inputs aggregate the embedded policy criteria).
# Stop and Ask: implementation_gate, applied only to the affected work.
# Rule 7: compatibility_gate, removal_gate, recreation_gate.
# Verification and Reporting: may_report_passed.
#
# NOT MECHANICALLY VERIFIED HERE
# Purpose/Product Principles: minimal complexity, vertical slices, established
# interaction patterns, English documentation, and a factual architecture map.
# Rules 1-3: core size, cohesive/deep modules, allowed dependency directions,
# actual authorization, input validation, ownership, recovery and consistency.
# Rule 4: adequacy of properties, operational error handling and test coverage.
# Rule 5: when/where to record a decision, its rationale and removal conditions.
# Rule 6: the solution ladder, cognitive cost, dependency tradeoffs, real limits.
# Rule 7: factual migration safety, real consumers and replacement equivalence.
# Rules 8-9: when to rewrite, stable contracts, reviewability and coherent steps.
# Required Change Procedure: actual inspection, reasoning and checks performed.
# The provenance appendix describes influences; it creates no extra obligations.
# These require project-specific contracts, integrations or human judgment.
# Do not replace them with arbitrary size limits or self-attested proof claims.
# Changes to these specifications require review, not weakening laws to pass.

# BEGIN EMBEDDED POLICY (verbatim AGENTS.md, comment-prefixed)
# # Architecture and Maintenance Policy
#
# ## Purpose
#
# This file defines how humans and coding agents must develop and maintain this
# system.
#
# LLM agents can generate and modify code much faster than humans can review the
# resulting architecture. An individual change may appear correct while gradually
# increasing coupling, duplication, hidden assumptions, and the amount of context
# required to understand the system.
#
# As the codebase grows, an agent becomes less able to reason about it as a whole.
# It may then solve local problems by adding adapters, abstractions, compatibility
# layers, special cases, and patches. Each addition makes the next change harder
# and accelerates architectural decay.
#
# Complexity is therefore a limited resource. The goal is not to maximize the
# amount of code produced. The goal is to keep the system small, coherent,
# replaceable, and understandable by both humans and agents.
#
# These rules exist to guide judgment, not to replace it with arbitrary metrics
# or procedural paperwork.
#
# ## Project Context and Human Responsibility
#
# Humans retain control of durable architectural commitments. Human approval is
# required for material changes to:
#
# - system-wide architecture, the architectural core, and public or cross-cutting
#   module boundaries;
# - core domain models and invariants;
# - public contracts and persistent data formats;
# - measurable product and operational requirements;
# - security assumptions, authority, and trust boundaries;
# - decisions that are expensive or difficult to reverse.
#
# Replacing an existing module through a rewrite and introducing compatibility
# for an older contract also require human approval, as detailed in Rules 7 and 8.
# The materiality definition below applies consistently throughout this policy.
# A non-trivial change does not automatically require approval.
#
# Using an existing interface or I/O mechanism within its established contract
# is not a boundary change. Local, reversible implementation choices may proceed
# when they preserve protected commitments. Approval to implement a change does
# not imply approval to deploy it, delete non-disposable data, or expand access.
#
# An explicit human instruction or approved plan already counts as approval when
# it clearly covers the proposed decision and its material consequences. Do not
# ask again for the same scope. A broad goal does not authorize every possible
# architectural means of achieving it. Seek a new decision if scope or material
# consequences change; silence is not approval.
#
# Each project should maintain a short architecture map here or in linked,
# existing project documentation. Identify actual paths and contracts for:
#
# - the architectural core: shared domain rules and commitments whose changes
#   constrain multiple modules or consumers;
# - module responsibilities, public interfaces, and allowed dependency directions;
# - trust assumptions, privileged operations, and ownership of persistent data;
# - deployment units, active consumers, and which development data is disposable;
# - verification commands and measurable product or operational requirements.
#
# Keep this map factual and brief. Do not invent project facts or create a new
# document when an existing one is adequate. If the map is missing, infer only
# what the repository supports, state material uncertainty, and ask only when
# that uncertainty blocks the affected decision. The missing map alone does not
# block unrelated local work.
#
# ## Product Development Principles
#
# - Grow the product in vertical slices. Start with the smallest version that
#   works end to end for a real user, and add capabilities only on top of a
#   working product.
# - Choose the simplest implementation that fully satisfies the current
#   requirement. Do not build infrastructure for hypothetical future scale.
# - Before designing a user-facing solution, study how established products solve
#   the same or adjacent problem and reuse proven interaction patterns where
#   appropriate.
# - Keep project documentation, identifiers, code comments, architecture records,
#   and agent plans in English.
#
# ## Classifying Changes
#
# A change is non-trivial if it does any of the following:
#
# - materially alters observable behavior, a public contract, or persistent
#   data;
# - adds or changes a dependency, module boundary, or trust boundary;
# - changes concurrency, authorization, security, or failure behavior;
# - introduces a new architectural concept or assumption;
# - requires coordinated edits in places that can no longer be understood
#   independently;
# - cannot be verified safely through local reasoning and focused tests.
#
# A change may still be trivial when it makes a small, local, easily reversible
# adjustment to presentation or other non-contractual behavior, provided its
# consequences can be established locally and verified directly. Otherwise, a
# change is trivial only when behavior and contracts remain unchanged, no
# boundary or architectural assumption changes, correctness can be established
# locally, and the change is easy to reverse.
#
# Classify changes by their consequences, not by line count, file count, function
# length, or similar proxy metrics. When uncertainty about material consequences
# remains after proportionate inspection, treat the change as non-trivial.
#
# A consequence is material when it changes something a user, caller, operator,
# or neighboring module may reasonably rely on; requires migration or
# coordinated changes; expands authority or failure impact; introduces a durable
# constraint; or would be costly to reverse.
#
# ## Rules for Agents
#
# ### 1. Protect the Architectural Core
#
# - Keep the architectural core as small as possible.
# - Prefer moving optional behavior to replaceable modules around the core.
# - Do not expand the core merely to make a local implementation easier.
# - Apply the approval rules above to material changes to the core or its
#   fundamental assumptions.
#
# ### 2. Enforce Module Boundaries
#
# - Draw boundaries around cohesive responsibilities and design decisions that
#   may change independently, not around process steps, technical fashions, or
#   arbitrary layers.
# - Prefer deep modules: narrow interfaces that hide substantial complexity and
#   expose the smallest useful contract. Do not create shallow wrappers whose
#   interfaces expose nearly as much complexity as their implementations.
# - A boundary should hide knowledge that other modules do not need. If callers
#   must understand the implementation, duplicate its assumptions, or coordinate
#   with its internal changes, the boundary is misplaced or incomplete.
# - Define narrow, explicit interfaces between modules.
# - Enforce boundaries mechanically with the language, type system, build system,
#   dependency rules, linters, or architecture tests.
# - Do not bypass a boundary through internal imports, shared mutable state,
#   database access, reflection, or duplicated implementation knowledge.
# - Treat a boundary that exists only in documentation as incomplete.
#
# ### 3. Protect Trust, Effects, and Failure Boundaries
#
# Inspect external input, network and filesystem operations, subprocesses,
# devices, persistent state, third-party code, secrets, and privileged actions.
# Distinguish the concerns involved:
#
# - A trust boundary separates different authority or trust assumptions. Validate
#   data against the receiving contract and enforce authorization at the point
#   of use. Normalize only where the contract defines a safe canonical form.
# - An effect boundary changes externally observable state. Make the operation,
#   its authority, and ownership explicit.
# - A failure boundary introduces operational failure or uncertainty, such as
#   timeouts, partial writes, or unavailable services. Define the required error,
#   recovery, and consistency behavior.
#
# One operation may cross all three boundaries. I/O alone does not establish a
# new trust domain. Storage does not automatically make data trustworthy; assess
# who can write it and whether its guarantees still hold.
#
# Use narrow representations for validated data where useful. Keep secrets and
# ambient authority from spreading through the system. Do not duplicate
# validation or add wrappers at every call when an established contract already
# provides the necessary guarantee. Revalidate when trust assumptions change or
# mutable state can invalidate an earlier check.
#
# Material changes to trust or authority require approval under Human
# Responsibility. Existing I/O within its approved contract does not require
# repeated approval. Changes to effects or failure behavior are non-trivial;
# they require approval when they also meet the protected-decision criteria.
#
# ### 4. Specify Properties, Not Only Examples
#
# - Distinguish programmer errors from expected operational failures. Encode
#   programmer assumptions, preconditions, postconditions, and invariants as
#   assertions or mechanically checked properties where appropriate; handle
#   expected failures explicitly as part of the contract. Do not use assertions
#   as a substitute for handling untrusted input or recoverable failure.
# - Test system properties, contracts, and invariants in addition to example
#   inputs and outputs.
# - Prefer tests that remain valid when the implementation changes.
# - Include failure behavior, boundary conditions, state transitions, and
#   interactions between modules.
# - Do not use a growing collection of narrow regression tests as a substitute
#   for identifying and specifying the underlying rule.
#
# ### 5. Record Why Decisions Were Made
#
# Record significant, durable decisions in
# `docs/decisions/NNNN-short-title.md`. Create the directory when the first such
# decision is needed. Use the next available sequence number and this format:
#
# ```md
# # Title
#
# ## Context
# What forces required a decision?
#
# ## Decision
# What was chosen?
#
# ## Alternatives
# What materially different options were rejected?
#
# ## Consequences
# What becomes easier, harder, or constrained?
# ```
#
# Use the lightest durable location appropriate to the decision:
#
# - a cross-cutting or costly-to-reverse decision belongs in a decision record;
# - a module contract belongs in documentation next to that module;
# - a non-obvious local reason belongs in a comment next to the affected code;
# - a temporary workaround must state why it exists and the condition for its
#   removal.
#
# Record reasons and consequences, not a chronology of implementation. Do not
# create decision records for local, obvious, and easily reversible choices.
# Update or supersede a record when its assumptions change; do not silently
# contradict it.
#
# ### 6. Minimize the Number of Concepts
#
# Before introducing new code or machinery, choose the first adequate solution
# in this order:
#
# 1. Check whether the behavior is already provided or the proposed work is
#    speculative. Avoid redundant work; do not silently reject an explicit
#    requirement as unnecessary. Surface a material mismatch with the goal.
# 2. Reuse an existing project mechanism that belongs within the same
#    architectural boundary.
# 3. Use the standard library.
# 4. Use a native platform, language, database, or framework capability.
# 5. Use an already-adopted dependency within its established architectural role.
# 6. Compare a minimum direct implementation with a suitable maintained dependency.
#    Choose the lower total cognitive, maintenance, and operational cost for the
#    required contract. Account for implementation risk, transitive dependencies,
#    licensing, updates, and replacement cost. Do not implement complex security
#    primitives or protocols merely to avoid adding a dependency.
#
# A new dependency is non-trivial. Apply the approval rules when its adoption
# materially changes trust, architecture, or another protected commitment.
# Dependency types may appear in an integration module whose contract explicitly
# depends on that technology. Keep them out of technology-independent domain
# contracts when they would leak implementation knowledge or constrain callers.
# Do not add pass-through wrappers solely to hide a type name.
#
# Use this order as a decision aid, not a code-golfing rule. Prefer the solution
# with the lowest total cognitive and maintenance cost, not necessarily the
# fewest lines. Read and trace the affected code before selecting a step.
#
# - Before adding a special case, check whether changing the data representation,
#   invariant, or ownership of the behavior can make it part of the normal path.
#   Prefer removing exceptional paths over hiding them behind helpers or
#   abstractions. Do not force unlike cases together when their contracts,
#   failure behavior, or security requirements are materially different.
# - Judge complexity by how much knowledge is required to understand and safely
#   change the system, not by line counts, function length, file size, class
#   count, or similar proxy metrics.
# - Every new concept, abstraction, dependency, layer, indirection, execution
#   path, and special case must justify its continuing cognitive and maintenance
#   cost.
# - Distinguish simple from merely easy or familiar. Reject local convenience
#   when it entangles otherwise independent state, time, identity, I/O, or
#   responsibilities and thereby increases global complexity.
# - Prefer a direct implementation when an abstraction does not eliminate more
#   complexity than it introduces.
# - Prefer changes that reduce the number of concepts, execution paths, and
#   places that must change together.
# - Keep cohesive code together. Do not split functions, modules, or types merely
#   to satisfy style metrics.
# - Do not introduce interfaces, factories, wrappers, or layers solely in
#   anticipation of hypothetical future requirements.
# - Use hard numeric limits only for actual product, platform, or operational
#   requirements, such as latency, memory use, bundle size, build time, storage,
#   or external API limits.
# - When such a limit exists, treat it as a concrete requirement and verify it
#   directly. Do not generalize it into arbitrary code-shape rules.
#
# ### 7. Delete Code and Use Clean Cutovers
#
# - Do not add compatibility machinery by default. Supporting an older contract
#   requires a named current consumer, deployed version, or stored-state
#   dependency and explicit human approval covering that need. Git history,
#   stale plans, old branches, previous local runs, tests alone, and hypothetical
#   future users do not justify it.
# - Prefer a clean cutover when all affected consumers can be updated together,
#   required data can be preserved, and deployment and recovery requirements
#   remain satisfied. Repository-wide edits alone do not prove that deployed
#   consumers can switch simultaneously.
# - Update current producers and consumers and remove the old implementation.
#   Recreate development data only when it is confirmed disposable; do not infer
#   disposability from its local location or age.
# - When independent deployments or persistent data require a staged transition,
#   propose the smallest migration or compatibility mechanism that meets the
#   actual constraint. Obtain approval for the transition and define an owner,
#   removal condition, and observable completion check.
# - Operational error handling, required recovery, and security mitigations are
#   not compatibility merely because they use an alternative execution path.
#   Justify them through the failure contract; assess any support for an older
#   contract separately. Preserve required safeguards during a cutover.
# - Before removing a legacy path, identify its required behavior, direct callers,
#   configuration references, dependent tests, deployed or stored-state
#   dependencies, and replacement. Remove it only when relevant checks establish
#   that the replacement covers what is still required.
# - If removal cannot be justified, preserve the path and report the missing
#   evidence. Do not add another compatibility layer to conceal uncertainty.
# - Do not retain speculative abstractions for hypothetical future use. Report
#   material removals and the evidence supporting them in the change summary.
#
# Measure progress by reduced complexity and delivered behavior, not lines added.
#
# ### 8. Rewrite from Specifications When Patching Stops Paying
#
# - Do not patch a module indefinitely.
# - Recommend rewriting a module from its specification when accumulated special
#   cases, compatibility layers, or hidden dependencies make safe reasoning
#   difficult.
# - Preserve externally required behavior through specifications, contracts, and
#   tests rather than by copying the old implementation.
# - Rewrite one bounded module at a time behind a stable interface.
# - Require human approval before beginning a rewrite.
#
# ### 9. Keep Changes Reviewable
#
# - Make each change small enough for a human reviewer to understand its purpose,
#   behavioral effect, and architectural consequences without reconstructing
#   unrelated parts of the system.
# - Divide larger work along behavior or module boundaries, not arbitrary line or
#   file limits.
# - Keep the system working and independently verifiable after each step.
# - Do not create a temporary architecture that is harder to understand than the
#   final design merely to split the work.
# - Keep commits coherent and arrange them so they tell the reasoning of the
#   change. Do not fragment cohesive work to satisfy a commit-size metric.
# - If an unresolved material architectural choice prevents reviewable work,
#   apply Stop and Ask to that choice.
#
# ## Required Change Procedure
#
# Apply this reasoning to the depth warranted by consequences and uncertainty.
# Report findings material to review, not ceremonial checklist answers.
#
# ### Before Implementation
#
# For a non-trivial change:
#
# 1. Inspect the responsible module, relevant callers, contracts, tests, and
#    decision records. State the behavior, invariant, or specification at issue.
# 2. Identify material effects on architecture, trust, public contracts,
#    persistent data, deployment, and failure behavior.
# 3. Consider whether deletion, simplification, or a better representation or
#    responsibility boundary resolves the problem without a special path.
# 4. Identify new concepts, dependencies, and places that must change together.
#    Plan the smallest coherent change and focused checks of required behavior,
#    properties, and failure cases.
# 5. Determine whether a durable decision record or human approval is required.
#    Reuse approval already covering the decision; resolve blocked choices before
#    implementing them.
#
# ### During Implementation
#
# - Keep each step coherent, working, and independently verifiable.
# - Update contracts and durable explanations when their meaning changes.
# - Remove obsolete code only after establishing its replacement and checking
#   current consumers and data dependencies.
# - Reassess approval if newly discovered consequences exceed the approved scope.
#
# ### After Implementation
#
# - Run proportionate checks of behavior, invariants, and relevant integration
#   or failure paths. Tests should target the contract, not mirror the code.
# - Inspect the final change for accidental coupling and obsolete paths.
# - Report actual verification and remaining uncertainty. State when a check
#   could not be performed; do not imply that unrun checks passed.
#
# For a trivial change, inspect and verify it locally and report the result.
# Do not create tests, decision records, or empty checklist answers solely to
# satisfy a procedure when direct verification is adequate.
#
# ## Stop and Ask
#
# Stop the affected implementation and ask for human direction when an unresolved
# issue below is not already covered by explicit instructions or an approved plan:
#
# - the specification is missing, ambiguous, or contradicted by existing
#   behavior in a way that materially affects the implementation choice;
# - a decision requires approval under Human Responsibility and existing human
#   instructions or an approved plan do not already cover it;
# - two locally reasonable solutions create materially different long-term
#   architectures;
# - satisfying the requirement appears to require machinery whose continuing
#   cost is not justified, and a simpler adequate solution cannot be established;
#   first discard unnecessary machinery rather than asking permission to add it;
# - safe implementation requires understanding more of the system than can be
#   reliably established after proportionate investigation;
# - patches are treating symptoms while the module's design is the underlying
#   problem;
# - the change is costly to reverse or its consequences cannot be reviewed
#   confidently.
#
# Before stopping, perform safe, read-only investigation proportionate to the
# decision: inspect the responsible code and its callers, existing contracts,
# tests, decision records, and relevant history when available. Do not ask the
# human to resolve a question that the repository can answer directly. Do not,
# however, turn investigation into an unbounded attempt to avoid a necessary
# decision.
#
# Investigation is proportionate when the agent has inspected the responsible
# code, relevant callers, contracts, tests, and decision records needed to
# resolve the specific uncertainty. It need not reconstruct unrelated parts of
# the system.
#
# Do not conceal material uncertainty by generating more code. Silence is not
# approval.
#
# If human approval is required but unavailable:
#
# - do not make the blocked change;
# - record the unresolved question and the options considered;
# - continue only with independent, reversible work that does not assume an
#   answer;
# - prepare analysis, tests of existing behavior, or an unapplied proposal when
#   useful;
# - do not weaken, bypass, or reinterpret the approval requirement to keep the
#   task moving.
#
# ## Verification and Reporting
#
# Make compliance auditable without creating ritual paperwork.
#
# When treating a potentially boundary-affecting change as non-material, state
# the reason briefly in the change summary. The justification must refer to the
# actual contract, affected callers, reversibility, or failure impact; merely
# labeling the change "internal" or "small" is insufficient.
#
# For a trivial change, report the change and the verification performed.
#
# For a non-trivial change, include a concise summary in the final response or
# pull-request description:
#
# ```md
# ## Change Summary
#
# - Behavior changed:
# - Contracts or boundaries affected:
# - Concepts or dependencies added or removed:
# - Verification performed:
# - Decisions recorded:
# - Remaining uncertainty or required human decision:
# ```
#
# Omit fields that genuinely do not apply rather than filling them with
# boilerplate. The summary must reflect actual reasoning and verification, not
# serve as a substitute for them.
#
# ## Guiding Principle
#
# Before adding a new abstraction, dependency, adapter, compatibility layer, or
# special case, consider whether deleting, simplifying, or replacing existing
# code would solve the underlying problem.
#
# Optimize for the long-term cost of understanding and changing the system, not
# for the short-term speed of producing code.
#
# ## Appendix: Intellectual Provenance
#
# This policy is a synthesis, not a claim that any one source originated each
# idea. This appendix records declared influences, not independently verified
# attribution for each rule, and does not add operational requirements. Many
# principles were discovered independently and overlap. The names
# below identify the strongest influences on each part. GPT and Claude are listed
# as drafting or review contributors, not as the originators of established
# software-engineering principles.
#
# | Policy area | Principal influences | Contribution to this policy |
# | --- | --- | --- |
# | Complexity as a limited resource | Grug Brain, John Ousterhout, Rich Hickey | Minimize the knowledge and entanglement required to understand and change the system. |
# | Human control of architectural decisions | GPT synthesis, refined through Roman Frołow's review | Reserve costly, cross-cutting, security-sensitive, and hard-to-reverse decisions for humans. |
# | Trivial and non-trivial changes | Claude critique, GPT drafting | Classify by consequences rather than line or file counts; define material consequences and proportionate investigation. |
# | Architectural core and replaceable surroundings | David Parnas, John Ousterhout, GPT synthesis | Keep the core small and isolate optional behavior behind stable boundaries. |
# | Module boundaries and deep modules | David Parnas, John Ousterhout | Divide by cohesive responsibility and hidden design decisions; prefer narrow interfaces that conceal substantial complexity. |
# | Trust, effects, and failure boundaries | Security-engineering practice, GPT synthesis | Distinguish validation and authority from side effects and operational failure; apply controls to the actual contract. |
# | Contracts, invariants, and assertions | Brad Fitzpatrick, John Carmack, Tiger Style | Test properties rather than only examples; distinguish programmer errors from expected operational failures. |
# | Decision records and explanations | Michael Nygard's ADRs, Tiger Style | Record durable reasons, alternatives, and consequences without creating ceremonial documentation. |
# | Minimum-concept rule and late abstraction | Grug Brain, YAGNI, Casey Muratori, Jonathan Blow | Prefer direct code; introduce an abstraction only when it removes more complexity than it creates. |
# | Minimal-solution ladder | Ponytail, adapted by GPT and Roman Frołow's review | Try no change, existing project code, standard library, native capability, reuse within an established dependency role, then compare direct implementation with a suitable maintained dependency. |
# | Simple versus merely easy | Rich Hickey | Reject local convenience that entangles independent state, time, identity, I/O, or responsibilities. |
# | Removing special cases through representation | Linus Torvalds | Improve data representation, invariants, or ownership so exceptional paths become normal paths where semantics permit. |
# | Data, hardware costs, and measurable limits | Casey Muratori, Bill Hall, Tiger Style | Treat real latency, memory, storage, build, and platform limits as requirements while rejecting arbitrary code-shape metrics. |
# | Dependencies and hidden machinery | Bill Hall, Grug Brain, Ponytail, Jonathan Blow | Account for continuing coupling and maintenance cost; do not add machinery merely for short-term convenience. |
# | Deletion and bounded rewrites | Grug Brain, Ponytail, John Ousterhout, GPT synthesis | Delete obsolete paths and rewrite a bounded module from its contract when continued patching no longer pays. |
# | Compatibility and clean cutovers | [Philipp Schmid](https://x.com/_philschmid/status/2094152154382528996), [Wagsify](https://x.com/wagsify/status/2094215533172494433), [Second Mind Systems](https://x.com/Secondmindsys/status/2094167277944082761), refined through Roman Frołow's review | Make compatibility exceptional, require a real current dependency, prove obsolete paths are replaceable before deletion, and avoid turning uncertainty into new legacy machinery. |
# | Small, reviewable, working steps | Brad Fitzpatrick, Linus Torvalds | Preserve a working, independently verifiable system and organize changes around coherent behavior. |
# | Stop and Ask, including unavailable humans | GPT drafting, strengthened by Claude critique | Investigate first, expose material uncertainty, block only the affected decision, and continue independent reversible work. |
# | Concise verification reporting | GPT synthesis, refined through Roman Frołow's review | Make consequences and evidence auditable without substituting a checklist for reasoning. |
#
# Roman Frołow selected, combined, and repeatedly refined these influences. GPT
# produced the current integrated wording. Claude's documented role was critical
# review, especially around undefined change classes, unavailable human approval,
# and possible abuse of the terms "material" and "proportionate".
# END EMBEDDED POLICY

# Human Responsibility / Rules 1, 3, 8.
# required includes protected material decisions, rewrites and compatibility.
# covered means explicit HUMAN approval covers this action and its consequences.
def approval_gate(required: Bool, covered: Bool) -> Bool:
  match required:
    case False{}:
      True{}
    case True{}:
      covered

# Classifying Changes: trigger aggregates any non-trivial criterion, including
# dependency/failure/concurrency changes. Uncertainty is after due inspection.
# Non-trivial does not itself imply that human approval is required.
def nontrivial(trigger: Bool, material_uncertainty: Bool) -> Bool:
  trigger || material_uncertainty

# Stop and Ask: unresolved means a material blocking issue not already resolved
# by a sufficiently specific instruction/plan. This does not block independent,
# reversible work that makes no assumption about the unresolved decision.
def implementation_gate(unresolved: Bool, required: Bool, covered: Bool) -> Bool:
  match unresolved:
    case True{}:
      False{}
    case False{}:
      approval_gate(required, covered)

# Rule 7: both a named CURRENT dependency and explicit approval are necessary.
# Approval must cover the transition, including its owner, removal condition
# and completion check when a staged transition is needed. Recovery/security
# handling is not automatically compatibility with an older contract.
def compatibility_gate(current_dependency: Bool, covered: Bool) -> Bool:
  current_dependency && covered

# Rule 7: inspection includes required behavior, callers, configuration, tests,
# deployed/stored-state dependencies. Checks must establish that the replacement
# covers still-required behavior and preserves data/deployment/recovery needs.
def removal_gate(inspected: Bool, replacement_verified: Bool) -> Bool:
  inspected && replacement_verified

# Rule 7: locality or age never establishes disposability. This is a necessary
# condition for recreating development data, not permission to delete it.
def recreation_gate(disposable_confirmed: Bool) -> Bool:
  disposable_confirmed

# Verification and Reporting: a successful model proof is not a substitute for
# an unrun integration test. Both inputs refer to the same check and revision.
def may_report_passed(performed: Bool, passed: Bool) -> Bool:
  performed && passed

law required_approval_cannot_be_skipped:
  {approval_gate(True{}, False{}) == False{} : Bool}

law existing_covered_approval_is_accepted:
  for required: Bool
  {approval_gate(required, True{}) == True{} : Bool}

law unprotected_work_needs_no_extra_approval:
  for covered: Bool
  {approval_gate(False{}, covered) == True{} : Bool}

law unresolved_work_is_blocked:
  for required: Bool
  for covered: Bool
  {implementation_gate(True{}, required, covered) == False{} : Bool}

law implementation_cannot_bypass_approval:
  for unresolved: Bool
  {implementation_gate(unresolved, True{}, False{}) == False{} : Bool}

law resolved_approved_work_is_not_blocked:
  for required: Bool
  {implementation_gate(False{}, required, True{}) == True{} : Bool}

law material_uncertainty_is_nontrivial:
  for trigger: Bool
  {nontrivial(trigger, True{}) == True{} : Bool}

law nontrivial_trigger_is_sufficient:
  for uncertainty: Bool
  {nontrivial(True{}, uncertainty) == True{} : Bool}

law compatibility_requires_a_current_dependency:
  for covered: Bool
  {compatibility_gate(False{}, covered) == False{} : Bool}

law compatibility_requires_explicit_approval:
  for dependency: Bool
  {compatibility_gate(dependency, False{}) == False{} : Bool}

law justified_approved_compatibility_passes_this_gate:
  {compatibility_gate(True{}, True{}) == True{} : Bool}

law removal_requires_inspection:
  for verified: Bool
  {removal_gate(False{}, verified) == False{} : Bool}

law removal_requires_verified_replacement:
  for inspected: Bool
  {removal_gate(inspected, False{}) == False{} : Bool}

law inspected_verified_removal_passes_this_gate:
  {removal_gate(True{}, True{}) == True{} : Bool}

law unconfirmed_data_cannot_be_recreated:
  {recreation_gate(False{}) == False{} : Bool}

law confirmed_disposability_passes_this_gate:
  {recreation_gate(True{}) == True{} : Bool}

law unrun_checks_cannot_be_reported_as_passed:
  for passed: Bool
  {may_report_passed(False{}, passed) == False{} : Bool}

law failed_checks_cannot_be_reported_as_passed:
  for performed: Bool
  {may_report_passed(performed, False{}) == False{} : Bool}

law successful_performed_checks_can_be_reported:
  {may_report_passed(True{}, True{}) == True{} : Bool}
