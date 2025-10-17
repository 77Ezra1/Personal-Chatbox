import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Workflow,
  Clock,
  CheckCircle2,
  AlertCircle,
  Box,
  Activity
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const StatusBadge = memo(({ status }) => {
  const variants = {
    draft: { variant: 'secondary', icon: Clock, label: 'Draft' },
    active: { variant: 'default', icon: CheckCircle2, label: 'Active' },
    running: { variant: 'default', icon: Activity, label: 'Running' },
    paused: { variant: 'outline', icon: Pause, label: 'Paused' },
    error: { variant: 'destructive', icon: AlertCircle, label: 'Error' }
  }

  const config = variants[status] || variants.draft
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
})

StatusBadge.displayName = 'StatusBadge'

export const WorkflowCard = memo(({
  workflow,
  onExecute,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  className
}) => {
  const {
    id,
    name,
    description,
    status = 'draft',
    nodeCount = 0,
    lastRun,
    successRate = 0,
    totalRuns = 0,
    tags = []
  } = workflow || {}

  const isRunning = status === 'running'

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
            <Workflow className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{name || 'Untitled Workflow'}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {description || 'No description available'}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(workflow)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(workflow)}>
                <Edit className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(workflow)}>
                <Copy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(workflow)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Nodes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <Badge variant="outline" className="gap-1">
              <Box className="size-3" />
              {nodeCount} nodes
            </Badge>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Runs</div>
            <div className="text-lg font-semibold">{totalRuns}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Success Rate</div>
            <div className="text-lg font-semibold">{successRate}%</div>
          </div>
        </div>

        {/* Last Run */}
        {lastRun && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            Last run: {new Date(lastRun).toLocaleDateString()}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t gap-2">
        <Button
          onClick={() => onEdit?.(workflow)}
          variant="outline"
          className="flex-1"
        >
          <Edit className="size-4" />
          Edit
        </Button>
        <Button
          onClick={() => onExecute?.(workflow)}
          disabled={isRunning}
          className="flex-1"
        >
          {isRunning ? (
            <>
              <Pause className="size-4" />
              Running...
            </>
          ) : (
            <>
              <Play className="size-4" />
              Run
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
})

WorkflowCard.displayName = 'WorkflowCard'
