/**
 * Политика прав доступа в семейных сценариях (доменный слой).
 * Роли «взрослый» vs «ребёнок»: родитель, бабушка/дедушка и «другой» = взрослый.
 */

export const ADULT_ROLES = new Set(['parent', 'grandparent', 'other'])

/** @param {string | undefined} role */
export function isAdultRole(role) {
  return ADULT_ROLES.has(role)
}

/** @param {string | undefined} role */
export function isChildRole(role) {
  return role === 'child'
}

/** Ребёнок не может удалять задачи */
export function canDeleteTask(role) {
  return isAdultRole(role)
}

/** Только взрослый подтверждает выполнение после проверки */
export function canConfirmChildCompletion(role) {
  return isAdultRole(role)
}

/**
 * Взрослый может сразу закрыть задачу без очереди на проверку.
 * Ребёнок не может — только отправка на проверку родителю.
 */
export function canMarkTaskCompletedDirectly(role) {
  return isAdultRole(role)
}

/** Менять статус произвольно (кроме финального начисления) — взрослый свободнее */
export function canEditTaskStatusFreely(role) {
  return isAdultRole(role)
}

/**
 * Пример проверки перед вызовом API удаления:
 * @example
 * if (!FamilyAccessPolicy.canDeleteTask(membership.role)) {
 *   showError('Удалять задачи могут только родители')
 *   return
 * }
 */
export const FamilyAccessPolicy = {
  isAdultRole,
  isChildRole,
  canDeleteTask,
  canConfirmChildCompletion,
  canMarkTaskCompletedDirectly,
  canEditTaskStatusFreely,
}
