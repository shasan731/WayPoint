import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 8_000,
        retry: 2,
        refetchOnWindowFocus: true
      },
      mutations: {
        retry: false
      }
    }
  });
}
