import { useMemo } from 'react'

export type HighlightNode = {
  id: string
  groupId: string
  data?: unknown
}

export type HighlightGroup = {
  id: string
  nodes: HighlightNode[]
  highlightedNodeId?: string | null
}

export type HighlightState = {
  groups: Record<string, HighlightGroup>
  selectedGroupId?: string | null
}

export const selectedHighlightGroupId = (
  state: HighlightState
): string | null => state.selectedGroupId ?? null

export const selectHighlightGroups = (state: HighlightState) => state.groups

export const selectedHighlightGroup = (
  state: HighlightState
): HighlightGroup | undefined => {
  const groupId = selectedHighlightGroupId(state)
  if (!groupId) {
    return undefined
  }

  return selectHighlightGroups(state)[groupId]
}

export const selectedHighlightNodeId = (
  state: HighlightState
): string | null => {
  const group = selectedHighlightGroup(state)
  return group?.highlightedNodeId ?? null
}

export const selectHighlightedNode = (
  state: HighlightState
): HighlightNode | undefined => {
  const group = selectedHighlightGroup(state)
  const nodeId = selectedHighlightNodeId(state)

  if (!group || !nodeId) {
    return undefined
  }

  return group.nodes.find((node) => node.id === nodeId)
}

export const selectHighlightSummary = (
  state: HighlightState
): { groupId: string | null; nodeId: string | null } => {
  const groupId = selectedHighlightGroupId(state)
  const nodeId = selectedHighlightNodeId(state)

  return { groupId, nodeId }
}

export function useHighlightedNode(state: HighlightState) {
  const { selectedGroupId: groupId, groups } = state

  return useMemo(() => {
    if (!groupId) {
      return undefined
    }

    const group = groups[groupId]
    if (!group) {
      return undefined
    }

    const nodeId = group.highlightedNodeId ?? null
    if (!nodeId) {
      return undefined
    }

    return group.nodes.find((node) => node.id === nodeId)
  }, [groupId, groups])
}
