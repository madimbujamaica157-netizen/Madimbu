import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

type Child = { id: string; name: string; age: number; device: string; battery: number; online: boolean };

type Ctx = {
  children: Child[];
  selected: Child | null;
  setSelected: (c: Child) => void;
  refresh: () => Promise<void>;
};

const ChildContext = createContext<Ctx | null>(null);

export function ChildProvider({ children: ui }: { children: ReactNode }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState<Child | null>(null);

  async function refresh() {
    const list = await api.children();
    setChildren(list);
    if (list.length && (!selected || !list.find((c: Child) => c.id === selected.id))) {
      setSelected(list[0]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <ChildContext.Provider value={{ children, selected, setSelected, refresh }}>
      {ui}
    </ChildContext.Provider>
  );
}

export function useChildren() {
  const c = useContext(ChildContext);
  if (!c) throw new Error("ChildProvider missing");
  return c;
}
