import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

/**
 * Reusable Skeleton Component
 * 骨架屏基础组件
 */
export function Skeleton({ className = '', width, height }) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
      style={style}
    />
  );
}

/**
 * Card View Skeleton Loader
 * 卡片视图骨架屏
 */
export function CardViewSkeleton() {
  return (
    <div className="p-6 overflow-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="gap-2 border-t pt-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * List View Skeleton Loader
 * 列表视图骨架屏
 */
export function ListViewSkeleton() {
  return (
    <div className="p-6 overflow-auto h-full">
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-6" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Kanban View Skeleton Loader
 * 看板视图骨架屏
 */
export function KanbanViewSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-40 ml-auto" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {[1, 2, 3].map((col) => (
            <div
              key={col}
              className="flex flex-col w-80 bg-muted/30 rounded-lg border"
            >
              <div className="flex items-center justify-between p-4 border-b bg-background/50">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-8" />
              </div>
              <div className="flex-1 p-3 space-y-3">
                {[1, 2, 3].map((card) => (
                  <Card key={card}>
                    <CardHeader className="p-4 pb-2">
                      <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Table View Skeleton Loader
 * 表格视图骨架屏
 */
export function TableViewSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Table header */}
      <div className="border-b p-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 flex-1" />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex gap-2 border-b pb-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <Skeleton key={j} className="h-12 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
