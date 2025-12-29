import { ReactNode, cloneElement, isValidElement } from 'react';
import {
  ContextMenu as RadixContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit, Trash2, Copy, Share2, MoreVertical, Eye, Download, Archive } from 'lucide-react';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
}

interface ContextMenuProps {
  children: ReactNode;
  actions: ContextMenuAction[];
  disabled?: boolean;
}

export default function ContextMenu({ children, actions, disabled }: ContextMenuProps) {
  if (disabled || !actions || actions.length === 0) {
    return <>{children}</>;
  }

  const groupedActions = {
    primary: actions.filter(a => !a.variant || a.variant === 'default'),
    destructive: actions.filter(a => a.variant === 'destructive'),
  };

  // Don't render if no actions available
  if (groupedActions.primary.length === 0 && groupedActions.destructive.length === 0) {
    return <>{children}</>;
  }

  // Clone children to add onContextMenu handler that prevents default
  const childrenWithHandler = isValidElement(children)
    ? cloneElement(children, {
        onContextMenu: (e: React.MouseEvent) => {
          // Prevent browser's default context menu
          e.preventDefault();
          // Call original onContextMenu if it exists
          if (children.props?.onContextMenu) {
            children.props.onContextMenu(e);
          }
        },
      } as any)
    : children;

  return (
    <RadixContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        {childrenWithHandler}
      </ContextMenuTrigger>
        <ContextMenuContent 
          className="w-48 z-50" 
          onCloseAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.stopPropagation()}
        >
          {groupedActions.primary.map((action) => (
            <ContextMenuItem
              key={action.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className="cursor-pointer"
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </ContextMenuItem>
          ))}
          {groupedActions.destructive.length > 0 && groupedActions.primary.length > 0 && (
            <ContextMenuSeparator />
          )}
          {groupedActions.destructive.map((action) => (
            <ContextMenuItem
              key={action.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </RadixContextMenu>
  );
}

