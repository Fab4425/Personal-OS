import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TrainingDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-9 w-48 rounded-md bg-muted" />
      <Card>
        <CardHeader>
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="mt-2 h-4 w-56 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-5 w-40 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
