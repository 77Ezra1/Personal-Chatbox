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

export function selectedHighlightGroupId(
  state: HighlightState
): string | null {
  return state.selectedGroupId ?? null
}

export function selectHighlightGroups(state: HighlightState) {
  return state.groups
}

export function selectedHighlightGroup(
  state: HighlightState
): HighlightGroup | undefined {
  const groupId = state.selectedGroupId ?? null
  if (!groupId) {
    return undefined
  }

  return selectHighlightGroups(state)[groupId]
}

export function selectedHighlightNodeId(
  state: HighlightState
): string | null {
  const groupId = state.selectedGroupId ?? null
  if (!groupId) {
    return null
  }

  const group = selectHighlightGroups(state)[groupId]
  return group?.highlightedNodeId ?? null
}

export function selectHighlightedNode(
  state: HighlightState
): HighlightNode | undefined {
  const groupId = state.selectedGroupId ?? null
  if (!groupId) {
    return undefined
  }

  const group = selectHighlightGroups(state)[groupId]
  if (!group) {
    return undefined
  }

  const nodeId = group.highlightedNodeId ?? null
  if (!nodeId) {
    return undefined
  }

  return group.nodes.find((node) => node.id === nodeId)
}

export function selectHighlightSummary(
  state: HighlightState
): { groupId: string | null; nodeId: string | null } {
  const groupId = state.selectedGroupId ?? null
  const nodeId = (() => {
    if (!groupId) {
      return null
    }

    const group = selectHighlightGroups(state)[groupId]
    return group?.highlightedNodeId ?? null
  })()

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
