import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-rose-500 text-white shadow-xs hover:bg-rose-600 dark:bg-rose-600',
        outline: 'text-foreground border-border',
        investment:
          'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300',
        warning:
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
        success:
          'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
