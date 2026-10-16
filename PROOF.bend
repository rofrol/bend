import Base
import ./LAWS.bend as Laws

# Companion to LAWS.bend; no AGENTS.md is needed to use this pair.
# Read and follow the full policy embedded in LAWS.bend, not just these proofs.
# Update proofs when changing the modeled implementation; never weaken a law
# simply to pass verification. Follow the policy's Stop and Ask for conflicts.
# Run this file after changes to either file and before committing governed work.
# Report unavailable/failed verification honestly and run relevant project tests.
#
# Proofs by exhaustive case analysis of the policy predicates.
# No unsafe definitions, foreign effects, axioms or unfinished proof holes.
# Run: bend PROOF.bend
# These prove the model, not the truth of externally supplied assessments.

def Laws.required_approval_cannot_be_skipped():
  {==}

def Laws.existing_covered_approval_is_accepted(required):
  match required:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.unprotected_work_needs_no_extra_approval(covered):
  {==}

def Laws.unresolved_work_is_blocked(required, covered):
  {==}

def Laws.implementation_cannot_bypass_approval(unresolved):
  match unresolved:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.resolved_approved_work_is_not_blocked(required):
  match required:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.material_uncertainty_is_nontrivial(trigger):
  match trigger:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.nontrivial_trigger_is_sufficient(uncertainty):
  {==}

def Laws.compatibility_requires_a_current_dependency(covered):
  {==}

def Laws.compatibility_requires_explicit_approval(dependency):
  match dependency:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.justified_approved_compatibility_passes_this_gate():
  {==}

def Laws.removal_requires_inspection(verified):
  {==}

def Laws.removal_requires_verified_replacement(inspected):
  match inspected:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.inspected_verified_removal_passes_this_gate():
  {==}

def Laws.unconfirmed_data_cannot_be_recreated():
  {==}

def Laws.confirmed_disposability_passes_this_gate():
  {==}

def Laws.unrun_checks_cannot_be_reported_as_passed(passed):
  {==}

def Laws.failed_checks_cannot_be_reported_as_passed(performed):
  match performed:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.successful_performed_checks_can_be_reported():
  {==}
