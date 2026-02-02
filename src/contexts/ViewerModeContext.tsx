import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ViewerModeContextType {
  isViewerMode: boolean;
  canEdit: boolean;
}

const ViewerModeContext = createContext<ViewerModeContextType>({
  isViewerMode: false,
  canEdit: true,
});

export const ViewerModeProvider = ({ children }: { children: ReactNode }) => {
  const { isViewer, isAdmin } = useAuth();
  
  // Viewer mode is active when the user is a viewer (not admin)
  const isViewerMode = isViewer && !isAdmin;
  const canEdit = isAdmin && !isViewer;

  return (
    <ViewerModeContext.Provider value={{ isViewerMode, canEdit }}>
      {children}
    </ViewerModeContext.Provider>
  );
};

export const useViewerMode = () => {
  const context = useContext(ViewerModeContext);
  if (!context) {
    throw new Error("useViewerMode must be used within a ViewerModeProvider");
  }
  return context;
};
