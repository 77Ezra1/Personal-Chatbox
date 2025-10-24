import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Edit,
  Trash2,
  MoreVertical,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
  History
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

const StatusBadge = memo(({ status }) => {
  const { translate } = useTranslation()

  const variants = {
    active: { variant: 'default', icon: CheckCircle2, label: translate('agents.status.active', 'Active') },
    inactive: { variant: 'secondary', icon: Clock, label: translate('agents.status.inactive', 'Inactive') },
    idle: { variant: 'secondary', icon: Clock, label: translate('agents.status.idle', 'Idle') },
    busy: { variant: 'default', icon: Loader2, label: translate('agents.status.busy', 'Busy'), spin: true },
    running: { variant: 'default', icon: Loader2, label: translate('agents.status.running', 'Running'), spin: true },
    error: { variant: 'destructive', icon: AlertCircle, label: translate('agents.status.error', 'Error') }
  }

  const config = variants[status] || variants.inactive
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={cn('size-3', config.spin && 'animate-spin')} />
      {config.label}
    </Badge>
  )
})

StatusBadge.displayName = 'StatusBadge'

export const AgentCard = memo(({
  agent,
  onExecute,
  onEdit,
  onDelete,
  onViewDetails,
  onViewHistory,
  className
}) => {
  const { translate } = useTranslation()
  const {
    name,
    description,
    status = 'inactive',
    capabilities = [],
    lastRun,
    successRate = 0,
    totalRuns = 0,
    avgDurationMs = 0
  } = agent || {}

  const isRunning = status === 'running' || status === 'busy'

  const formatAverageDuration = (value) => {
    if (!value && value !== 0) return '—'
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}s`
    }
    return `${Math.round(value)} ms`
  }

  const avgDurationDisplay = formatAverageDuration(avgDurationMs)

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200 hover:border-primary/50",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Bot className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {name || translate('agents.card.untitledAgent', 'Untitled Agent')}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {description || translate('agents.card.noDescription', 'No description available')}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
                <span className="sr-only">{translate('agents.card.openMenu', 'Open menu')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewHistory?.(agent)}>
                <History className="size-4" />
                {translate('agents.actions.viewHistory', 'View History')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewDetails?.(agent)}>
                {translate('agents.actions.viewDetails', 'View Details')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(agent)}>
                <Edit className="size-4" />
                {translate('agents.actions.edit', 'Edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(agent)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                {translate('agents.actions.delete', 'Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {translate('agents.card.status', 'Status')}
          </span>
          <StatusBadge status={status} />
        </div>

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">
              {translate('agents.card.capabilities', 'Capabilities')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {capabilities.slice(0, 3).map((cap, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {cap}
                </Badge>
              ))}
              {capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{capabilities.length - 3} {translate('agents.card.more', 'more')}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {translate('agents.card.totalRuns', 'Total Runs')}
            </div>
            <div className="text-lg font-semibold">{totalRuns}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3" />
              {translate('agents.card.successRate', 'Success Rate')}
            </div>
            <div className="text-lg font-semibold">{successRate}%</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{translate('agents.card.avgDuration', 'Avg duration')}</span>
          <span className="text-sm font-medium text-foreground">{avgDurationDisplay}</span>
        </div>

        {/* Last Run */}
        {lastRun && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {translate('agents.card.lastRun', 'Last run')}: {new Date(lastRun).toLocaleDateString()}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t">
        <Button
          onClick={() => onExecute?.(agent)}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {status === 'busy'
                ? translate('agents.status.busy', 'Busy')
                : translate('agents.status.running', 'Running')
              }...
            </>
          ) : (
            <>
              <Play className="size-4" />
              {translate('agents.actions.executeTask', 'Execute Task')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
})

AgentCard.displayName = 'AgentCard'
