'use client';

import React, { createContext, useContext } from 'react';
import type { CompanyConfig } from '@/lib/companies';
import { companies } from '@/lib/companies';

const CompanyContext = createContext<CompanyConfig>(companies.default);

export function CompanyProvider({
  company,
  children,
}: {
  company: CompanyConfig;
  children: React.ReactNode;
}) {
  return (
    <CompanyContext.Provider value={company}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyConfig {
  return useContext(CompanyContext);
}
