"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CopyrightSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
}

const CopyrightSearchContext = createContext<
  CopyrightSearchContextType | undefined
>(undefined);

export function CopyrightSearchProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    // This function will be called by individual components
    // Each component will implement its own search logic
    setIsSearching(true);
  };

  return (
    <CopyrightSearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        handleSearch,
        isSearching,
        setIsSearching,
      }}
    >
      {children}
    </CopyrightSearchContext.Provider>
  );
}

export function useCopyrightSearch() {
  const context = useContext(CopyrightSearchContext);
  if (context === undefined) {
    throw new Error(
      "useCopyrightSearch must be used within a CopyrightSearchProvider"
    );
  }
  return context;
}
