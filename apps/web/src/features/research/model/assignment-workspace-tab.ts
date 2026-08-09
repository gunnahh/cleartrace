export const assignmentWorkspaceTabs = ['parties', 'legal', 'cases', 'media'] as const

export type AssignmentWorkspaceTab = (typeof assignmentWorkspaceTabs)[number]
