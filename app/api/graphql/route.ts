import { NextRequest, NextResponse } from "next/server";
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";
import { createContext } from "@/lib/graphql/context";
import { depthLimitRule } from "@/lib/graphql/depth-limit";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

const schema = makeExecutableSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  context: async (requestContext) => {
    const request = requestContext.request as NextRequest;
    return createContext(request);
  },
  graphqlEndpoint: "/api/graphql",
  landingPage: false,
  validationRules: [depthLimitRule(7)],
});

export async function GET(request: NextRequest) {
  const rateLimit = await rateLimitMiddleware(request, "graphql", RATE_LIMITS.GRAPHQL);
  if (rateLimit) return rateLimit as NextResponse;
  return yoga.fetch(request);
}

export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitMiddleware(request, "graphql", RATE_LIMITS.GRAPHQL);
  if (rateLimit) return rateLimit as NextResponse;
  return yoga.fetch(request);
}
