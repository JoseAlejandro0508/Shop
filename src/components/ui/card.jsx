import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return <div className={cn('rounded-2xl border border-border bg-card text-card-foreground shadow-xl', className)} {...props} />;
}
