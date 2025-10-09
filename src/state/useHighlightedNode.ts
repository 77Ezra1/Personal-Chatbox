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
  const groupId = selectedHighlightGroupId(state)
  if (!groupId) {
    return undefined
  }

  return selectHighlightGroups(state)[groupId]
}

export function selectedHighlightNodeId(
  state: HighlightState
): string | null {
  const group = selectedHighlightGroup(state)
  return group?.highlightedNodeId ?? null
}

export function selectHighlightedNode(
  state: HighlightState
): HighlightNode | undefined {
  const group = selectedHighlightGroup(state)
  const nodeId = selectedHighlightNodeId(state)

  if (!group || !nodeId) {
    return undefined
  }

  return group.nodes.find((node) => node.id === nodeId)
}

export function selectHighlightSummary(
  state: HighlightState
): { groupId: string | null; nodeId: string | null } {
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
