import { useState, useMemo, memo } from 'react'
import { AgentCard } from './AgentCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  SlidersHorizontal,
  Grid3x3,
  List,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAgentStatusLabel } from '@/lib/agentsUtils'

const brandButtonClasses = 'border border-transparent bg-[#4F6DFF] text-white shadow-sm hover:bg-[#3D58D4] hover:shadow-md focus-visible:ring-[#4F6DFF]/50'

const EmptyState = memo(({ translate, onCreateAgent }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="rounded-full bg-muted p-6 mb-4">
      <Search className="size-12 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">
      {translate('agents.noAgents', 'No agents found')}
    </h3>
    <p className="text-muted-foreground text-center max-w-md mb-6">
      {translate('agents.noAgentsDescription', 'Create your first AI agent to automate tasks and workflows')}
    </p>
    <Button onClick={onCreateAgent} className={cn('gap-2', brandButtonClasses)}>
      <Plus className="size-4" />
      {translate('agents.createAgent', 'Create Agent')}
    </Button>
  </div>
))

EmptyState.displayName = 'EmptyState'

export const AgentList = memo(({
  agents = [],
  onCreateAgent,
  onExecute,
  onEdit,
  onDelete,
  onViewDetails,
  onViewHistory,
  loading = false,
  className,
  translate = (key, fallback) => fallback
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name')
  const [selectedCapabilities, setSelectedCapabilities] = useState([])

  // Extract all unique capabilities
  const allCapabilities = useMemo(() => {
    const caps = new Set()
    agents.forEach(agent => {
      agent.capabilities?.forEach(cap => caps.add(cap))
    })
    return Array.from(caps)
  }, [agents])

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let filtered = agents.filter(agent => {
      // Search filter
      const matchesSearch = !searchQuery ||
        agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter

      // Capability filter
      const matchesCapabilities = selectedCapabilities.length === 0 ||
        selectedCapabilities.some(cap => agent.capabilities?.includes(cap))

      return matchesSearch && matchesStatus && matchesCapabilities
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'lastRun':
          return new Date(b.lastRun || 0) - new Date(a.lastRun || 0)
        case 'successRate':
          return (b.successRate || 0) - (a.successRate || 0)
        case 'totalRuns':
          return (b.totalRuns || 0) - (a.totalRuns || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [agents, searchQuery, statusFilter, selectedCapabilities, sortBy])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    if (selectedCapabilities.length > 0) count++
    return count
  }, [statusFilter, selectedCapabilities])

  const statusFilterLabel = useMemo(() => {
    if (statusFilter === 'all') {
      return translate('agents.filters.allStatus', 'All Status')
    }
    return getAgentStatusLabel(translate, statusFilter)
  }, [statusFilter, translate])

  let content
  if (loading) {
    content = (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  } else if (filteredAgents.length === 0) {
    content = (
      <div className="h-full overflow-y-auto">
        <div className="flex h-full items-center justify-center">
          <EmptyState translate={translate} onCreateAgent={onCreateAgent} />
        </div>
      </div>
    )
  } else {
    content = (
      <div className="h-full overflow-y-auto pr-1">
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-3'
          )}
        >
          {filteredAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onExecute={onExecute}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {translate('agents.title', 'AI Agents')}
          </h2>
          <p className="text-muted-foreground">
            {translate('agents.subtitle', 'Manage and execute your intelligent agents')}
          </p>
        </div>
        <Button onClick={onCreateAgent} className={cn('gap-2', brandButtonClasses)}>
          <Plus className="size-4" />
          {translate('agents.createAgent', 'Create Agent')}
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={translate('agents.searchPlaceholder', 'Search agents...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={translate('agents.filters.allStatus', 'All Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate('agents.filters.allStatus', 'All Status')}</SelectItem>
            <SelectItem value="active">{translate('agents.filters.active', 'Active')}</SelectItem>
            <SelectItem value="inactive">{translate('agents.filters.inactive', 'Inactive')}</SelectItem>
            <SelectItem value="busy">{translate('agents.filters.busy', 'Busy')}</SelectItem>
            <SelectItem value="error">{translate('agents.filters.error', 'Error')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Capability Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="size-4" />
              {translate('agents.filters.capabilities', 'Capabilities')}
              {selectedCapabilities.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 size-5 p-0 flex items-center justify-center"
                >
                  {selectedCapabilities.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{translate('agents.filters.filterBy', 'Filter by')} {translate('agents.filters.capabilities', 'Capabilities')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allCapabilities.map(cap => (
              <DropdownMenuCheckboxItem
                key={cap}
                checked={selectedCapabilities.includes(cap)}
                onCheckedChange={(checked) => {
                  setSelectedCapabilities(prev =>
                    checked
                      ? [...prev, cap]
                      : prev.filter(c => c !== cap)
                  )
                }}
              >
                {cap}
              </DropdownMenuCheckboxItem>
            ))}
            {allCapabilities.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {translate('agents.filters.noCapabilitiesFound', 'No capabilities found')}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SlidersHorizontal className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{translate('agents.filters.name', 'Name')}</SelectItem>
            <SelectItem value="lastRun">{translate('agents.filters.lastRun', 'Last Run')}</SelectItem>
            <SelectItem value="successRate">{translate('agents.filters.successRate', 'Success Rate')}</SelectItem>
            <SelectItem value="totalRuns">{translate('agents.filters.totalRuns', 'Total Runs')}</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setViewMode('list')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{translate('agents.activeFilters', 'Active filters:')}</span>
          {statusFilter !== 'all' && (
            <Badge variant="secondary">
              {translate('agents.filters.statusLabel', 'Status')}: {statusFilterLabel}
              <button
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedCapabilities.map(cap => (
            <Badge key={cap} variant="secondary">
              {cap}
              <button
                onClick={() => setSelectedCapabilities(prev => prev.filter(c => c !== cap))}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {translate('common.showing', 'Showing {count} of {total}')
          .replace('{count}', filteredAgents.length)
          .replace('{total}', agents.length)} {translate('agents.agents', 'agents')}
      </div>

      <div className="flex-1 min-h-0">
        {content}
      </div>
    </div>
  )
})

AgentList.displayName = 'AgentList'
