import { graphql } from '@octokit/graphql';

export async function fetchTags(args: {
  owner: string;
  repo: string;
  token: string;
  limit?: number;
}) {
  const query = `
query($owner: String!, $repo: String!, $first: Int!) {
  repository(owner: $owner, name: $repo) {
    refs(refPrefix: "refs/tags/", first: $first, orderBy: {field: TAG_COMMIT_DATE, direction: DESC}) {
      edges {
        node {
          name
          target {
            __typename
            ... on Commit {
              oid
              committedDate
            }
            ... on Tag {
              target {
                __typename
                ... on Commit {
                  oid
                  committedDate
                }
              }
            }
          }
        }
      }
    }
  }
}
  `;

  const variables = {
    owner: args.owner,
    repo: args.repo,
    first: args.limit || 30,
  };

  const response = await graphql<any>(query, {
    ...variables,
    headers: {
      authorization: `token ${args.token}`,
    },
  });

  return response.repository.refs.edges.map(edge => ({
    name: edge.node.name,
    commitSha: edge.node.target.oid || edge.node.target.target.oid,
    committedDate:
      edge.node.target.committedDate || edge.node.target.target.committedDate,
  }));
}
