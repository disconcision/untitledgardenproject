/**
 * Tutorial — Step Completion Logic
 *
 * Pure functions for managing tutorial state.
 */

import { World } from "./model";

/**
 * Mark a tutorial step as completed.
 * Searches all sections for the step ID.
 *
 * @param tutorial - Current tutorial state
 * @param stepId - ID of the step to complete
 * @returns Updated tutorial state
 */
export function completeTutorialStep(
  tutorial: World["tutorial"],
  stepId: string
): World["tutorial"] {
  for (let sectionIndex = 0; sectionIndex < tutorial.sections.length; sectionIndex++) {
    const section = tutorial.sections[sectionIndex];
    const stepIndex = section.steps.findIndex((s) => s.id === stepId);

    if (stepIndex >= 0) {
      if (section.steps[stepIndex].completed) {
        return tutorial; // Already completed
      }

      const newSections = [...tutorial.sections];
      const newSteps = [...section.steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], completed: true };
      newSections[sectionIndex] = { ...section, steps: newSteps };

      return {
        ...tutorial,
        sections: newSections,
      };
    }
  }

  return tutorial; // Step not found
}

