"use client";

import { createClient, fetchExchange } from "@urql/core";
import { cacheExchange } from "@urql/exchange-graphcache";

export const graphqlClient = createClient({
  url: "/api/graphql",
  exchanges: [
    cacheExchange({
      keys: {
        VehicleConnection: () => null,
        HireRequestConnection: () => null,
        VendorDashboard: () => null,
        BatchPublishResult: () => null,
      },
    }),
    fetchExchange,
  ],
  fetchOptions: () => ({
    credentials: "include",
  }),
});
