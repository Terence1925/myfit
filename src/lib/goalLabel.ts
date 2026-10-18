import { MIND_BODY_STYLE_BY_ID } from './backend/mindBodyStyles'
import { GOAL_LABELS } from './tdee'
import type { IntakeAnswers } from './types'

/** What to call a program's goal: the yoga or Pilates style when there is one, otherwise the lifting goal. */
export function goalLabelOf(answers: Pick<IntakeAnswers, 'goal' | 'mindBodyStyle'>): string {
  const style = answers.mindBodyStyle ? MIND_BODY_STYLE_BY_ID.get(answers.mindBodyStyle) : undefined
  return style ? style.label : GOAL_LABELS[answers.goal]
}
