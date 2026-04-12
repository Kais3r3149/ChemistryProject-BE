import { SeverityLevel } from './types';

/**
 * Maps TDC DDI interaction type (Y: 0-85) to clinical severity level.
 *
 * Classification based on pharmacological interaction categories:
 * - MAJOR (0-19):   Metabolic enzyme inhibition/induction, QT prolongation,
 *                    serotonin syndrome, bleeding risk, CNS depression
 * - MODERATE (20-49): Absorption changes, protein binding displacement,
 *                     additive effects, moderate pharmacokinetic changes
 * - MINOR (50-69):   Mild pharmacokinetic changes, minor additive effects
 * - UNKNOWN (70-85):  Unclassified or insufficient evidence
 *
 * Note: This mapping should be refined with pharmacist/clinician review.
 * The ranges are initial estimates based on TDC DDI type distribution.
 */
export function mapInteractionTypeToSeverity(
  interactionType: number,
): SeverityLevel {
  if (interactionType < 0 || interactionType > 85) {
    return SeverityLevel.UNKNOWN;
  }

  if (interactionType <= 19) {
    return SeverityLevel.MAJOR;
  }

  if (interactionType <= 49) {
    return SeverityLevel.MODERATE;
  }

  if (interactionType <= 69) {
    return SeverityLevel.MINOR;
  }

  return SeverityLevel.UNKNOWN;
}

/**
 * Severity display configuration for API responses.
 */
export const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; color: string; priority: number }
> = {
  [SeverityLevel.MAJOR]: {
    label: 'Major',
    color: 'red',
    priority: 1,
  },
  [SeverityLevel.MODERATE]: {
    label: 'Moderate',
    color: 'amber',
    priority: 2,
  },
  [SeverityLevel.MINOR]: {
    label: 'Minor',
    color: 'emerald',
    priority: 3,
  },
  [SeverityLevel.UNKNOWN]: {
    label: 'Unknown',
    color: 'slate',
    priority: 4,
  },
};
