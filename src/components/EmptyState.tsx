import { LucideIcon, Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
}

export function EmptyState({ 
  icon: Icon = Package, 
  title, 
  description, 
  action,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="rounded-2xl bg-secondary p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <button onClick={action.onClick} className="btn-primary">
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button 
            onClick={secondaryAction.onClick} 
            className="btn-secondary flex items-center justify-center gap-2"
            disabled={secondaryAction.loading}
          >
            {secondaryAction.loading ? (
              <>
                <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              secondaryAction.label
            )}
          </button>
        )}
      </div>
    </div>
  );
}
