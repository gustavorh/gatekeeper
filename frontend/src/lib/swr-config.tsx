"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";
import { apiClient } from "@/lib/api";

export const swrFetcher = async <T,>(endpoint: string): Promise<T> => {
  const response = await apiClient.get<T>(endpoint);
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || "API request failed");
  }
  return response.data;
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        dedupingInterval: 30_000,
        errorRetryCount: 2,
        shouldRetryOnError: (err) => {
          const status = (err as { status?: number }).status;
          return !status || (status >= 500 && status !== 501);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
