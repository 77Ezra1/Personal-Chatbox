import { useState, useMemo, memo } from 'react'
import { WorkflowCard } from './WorkflowCard'
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
  Download,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const EmptyState = memo(({ onCreateWorkflow, translate }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="rounded-full bg-muted p-6 mb-4">
      <Search className="size-12 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{translate('workflows.noWorkflows')}</h3>
    <p className="text-muted-foreground text-center max-w-md mb-6">
      {translate('workflows.noWorkflowsDescription')}
    </p>
    <Button onClick={onCreateWorkflow}>
      <Plus className="size-4" />
      {translate('workflows.createWorkflow')}
    </Button>
  </div>
))

EmptyState.displayName = 'EmptyState'

export const WorkflowList = memo(({
  workflows = [],
  onCreateWorkflow,
  onExecute,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  onImport,
  onExport,
  loading = false,
  className,
  translate
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('name')

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {
    let filtered = workflows.filter(workflow => {
      // Search filter
      const matchesSearch = !searchQuery ||
        workflow.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Status filter
      const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter

      return matchesSearch && matchesStatus
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
  }, [workflows, searchQuery, statusFilter, sortBy])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    return count
  }, [statusFilter])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{translate('workflows.title')}</h2>
          <p className="text-muted-foreground">
            {translate('workflows.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onImport}>
            <Upload className="size-4" />
            {translate('workflows.import')}
          </Button>
          <Button onClick={onCreateWorkflow}>
            <Plus className="size-4" />
            {translate('workflows.createWorkflow')}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={translate('workflows.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={translate('workflows.statusLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate('workflows.filters.allStatus')}</SelectItem>
            <SelectItem value="draft">{translate('workflows.filters.draft')}</SelectItem>
            <SelectItem value="active">{translate('workflows.filters.active')}</SelectItem>
            <SelectItem value="running">{translate('workflows.filters.running')}</SelectItem>
            <SelectItem value="paused">{translate('workflows.filters.paused')}</SelectItem>
            <SelectItem value="error">{translate('workflows.filters.error')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SlidersHorizontal className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{translate('workflows.sort.name')}</SelectItem>
            <SelectItem value="lastRun">{translate('workflows.sort.lastRun')}</SelectItem>
            <SelectItem value="successRate">{translate('workflows.sort.successRate')}</SelectItem>
            <SelectItem value="totalRuns">{translate('workflows.sort.totalRuns')}</SelectItem>
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
          <span className="text-muted-foreground">{translate('workflows.activeFilters')}</span>
          {statusFilter !== 'all' && (
            <Badge variant="secondary">
              {translate('workflows.statusLabel')}: {translate(`workflows.filters.${statusFilter}`)}
              <button
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate('workflows.showing')
            .replace('{count}', filteredWorkflows.length)
            .replace('{total}', workflows.length)}
        </div>
        {filteredWorkflows.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="size-4" />
            {translate('workflows.exportAll')}
          </Button>
        )}
      </div>

      {/* Workflow Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <EmptyState onCreateWorkflow={onCreateWorkflow} translate={translate} />
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-3"
          )}
        >
          {filteredWorkflows.map(workflow => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onExecute={onExecute}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
})

WorkflowList.displayName = 'WorkflowList'
