import { Button, ButtonProps } from "@/components/ui/button";
import { useViewerMode } from "@/contexts/ViewerModeContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminActionButtonProps extends ButtonProps {
  children: React.ReactNode;
}

/**
 * A button component that is automatically disabled in viewer mode.
 * Use this for all create, edit, delete, and save actions in admin components.
 */
export const AdminActionButton = ({ children, className, disabled, ...props }: AdminActionButtonProps) => {
  const { isViewerMode } = useViewerMode();
  
  const isDisabled = disabled || isViewerMode;
  
  if (isViewerMode) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button 
                className={cn("opacity-50 cursor-not-allowed", className)} 
                disabled={true}
                {...props}
              >
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editing disabled in demo mode</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Button className={className} disabled={isDisabled} {...props}>
      {children}
    </Button>
  );
};
