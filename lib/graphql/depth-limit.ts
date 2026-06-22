import { GraphQLError, visit, DocumentNode, ValidationContext } from "graphql";

const MAX_DEPTH = 7;

function depthLimitRule(maxDepth: number) {
  return (context: ValidationContext) => ({
    Document(node: DocumentNode) {
      const depth = calculateDepth(node);
      if (depth > maxDepth) {
        context.reportError(
          new GraphQLError(`Query depth ${depth} exceeds maximum allowed depth of ${maxDepth}`, {
            nodes: [node],
          })
        );
      }
    },
  });
}

function calculateDepth(doc: DocumentNode): number {
  let maxDepth = 0;

  visit(doc, {
    SelectionSet: {
      enter(node, _key, _parent, path) {
        const depth = (path as unknown[]).filter(
          (p) => p === "selectionSet" || p === "selections"
        ).length;
        if (depth > maxDepth) {
          maxDepth = depth;
        }
      },
    },
  });

  return maxDepth;
}

export { depthLimitRule, MAX_DEPTH };
