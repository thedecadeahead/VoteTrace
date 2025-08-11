// Lightweight OpenStates GraphQL client (Plural). Used only for state votes to avoid
// breaking federal flows. Requires OPENSTATES_GRAPHQL_ENDPOINT and OPENSTATES_API_KEY.

type GqlRequest = {
  query: string
  variables?: Record<string, any>
}

function getGraphqlConfig() {
  const endpoint = process.env.OPENSTATES_GRAPHQL_ENDPOINT
  const apiKey = process.env.OPENSTATES_API_KEY
  if (!endpoint || !apiKey) return null
  return { endpoint, apiKey }
}

async function gqlFetch<T>(body: GqlRequest): Promise<T> {
  const cfg = getGraphqlConfig()
  if (!cfg) throw new Error('OpenStates GraphQL not configured')
  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': cfg.apiKey,
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  })
  const json = await res.json()
  if (!res.ok || json?.errors) {
    throw new Error(`OpenStates GraphQL error ${res.status}: ${JSON.stringify(json?.errors || json)}`)
  }
  return json as T
}

// Try querying vote events for a specific person in a jurisdiction.
// The schema names vary slightly across deployments. We handle a couple of likely shapes.
export async function fetchVoteEventsByPerson(
  jurisdiction: string,
  personId: string,
  first = 20
): Promise<any[]> {
  const config = getGraphqlConfig()
  if (!config) return []

  // Attempt 1: voteEvents connection with voters filter
  const query1 = `#graphql
    query VoteEvents($jurisdiction: String!, $personId: String!, $first: Int!) {
      voteEvents(
        jurisdiction: $jurisdiction,
        voters_Person_id: $personId,
        first: $first,
        sort: [{ field: date, direction: DESC }]
      ) {
        edges { node { id date motionText bill { identifier } votes { option voter { id } } } }
      }
    }
  `
  try {
    const r: any = await gqlFetch({ query: query1, variables: { jurisdiction, personId, first } })
    const edges = r?.data?.voteEvents?.edges || []
    if (Array.isArray(edges) && edges.length > 0) return edges.map((e: any) => e.node)
  } catch {}

  // Attempt 2: alternate field names (motion, voters)
  const query2 = `#graphql
    query VoteEventsAlt($jurisdiction: String!, $personId: String!, $first: Int!) {
      voteEvents(
        jurisdiction: $jurisdiction,
        voters_Person_id: $personId,
        first: $first,
        sort: [{ field: date, direction: DESC }]
      ) {
        edges { node { id date motion bill { identifier number } voters { vote person { id } } } }
      }
    }
  `
  try {
    const r: any = await gqlFetch({ query: query2, variables: { jurisdiction, personId, first } })
    const edges = r?.data?.voteEvents?.edges || []
    if (Array.isArray(edges) && edges.length > 0) return edges.map((e: any) => e.node)
  } catch {}

  return []
}


