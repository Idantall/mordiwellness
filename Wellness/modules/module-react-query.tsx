import { QueryClient, DefaultOptions, QueryClientConfig, QueryClientProvider } from 'react-query';

const defaultQueryOptions: DefaultOptions = {
  queries: {
    cacheTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    keepPreviousData: true,
  },
  mutations: {
    retry: 3,
  },
};

export const configuredQueryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
} as QueryClientConfig);


export default function ConfiguredQueryClientProvider({ children }: any) {
    return <QueryClientProvider client={configuredQueryClient}>{children}</QueryClientProvider>
}
