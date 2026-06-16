import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ExclusiveFilterContextValue = {
  openId: string | null;
  requestOpen: (id: string) => void;
  requestClose: (id: string) => void;
};

const ExclusiveFilterContext = createContext<ExclusiveFilterContextValue | null>(null);

export function ExclusiveFilterGroup({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = useMemo<ExclusiveFilterContextValue>(
    () => ({
      openId,
      requestOpen: (id) => setOpenId(id),
      requestClose: (id) => setOpenId((current) => (current === id ? null : current)),
    }),
    [openId],
  );

  return <ExclusiveFilterContext.Provider value={value}>{children}</ExclusiveFilterContext.Provider>;
}

export function useExclusiveFilterPanel(panelId: string) {
  const context = useContext(ExclusiveFilterContext);
  const [localOpen, setLocalOpen] = useState(false);

  if (!context) {
    return {
      open: localOpen,
      setOpen: setLocalOpen,
      toggle: () => setLocalOpen((current) => !current),
    };
  }

  return {
    open: context.openId === panelId,
    setOpen: (next: boolean) => {
      if (next) {
        context.requestOpen(panelId);
        return;
      }
      context.requestClose(panelId);
    },
    toggle: () => {
      if (context.openId === panelId) {
        context.requestClose(panelId);
        return;
      }
      context.requestOpen(panelId);
    },
  };
}
