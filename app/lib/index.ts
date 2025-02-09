export const METAFIELD_VALUES = {
  METAFIELD_KEY: "customer_count",
  METAFIELD_NAME: "Customer count",
  METAFIELD_NAMESPACE: "custom",
  METAFIELD_OWNER_TYPE: "SHOP",
  METAFIELD_TYPE: "number_integer",
};

export const createMetafieldDefinitionMutation = /* GraphQL */ `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        namespace
        key
        ownerType
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const createMetafieldDefinitionVariable = {
  definition: {
    key: METAFIELD_VALUES.METAFIELD_KEY,
    name: METAFIELD_VALUES.METAFIELD_NAME,
    namespace: METAFIELD_VALUES.METAFIELD_NAMESPACE,
    ownerType: METAFIELD_VALUES.METAFIELD_OWNER_TYPE,
    type: METAFIELD_VALUES.METAFIELD_TYPE,
  },
};

export const setMetafieldMutation = /* GraphQL */ `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const getShopQuery = /* GraphQL */ `
  query getShopDetails($namespace: String!, $key: String!) {
    shop {
      id
      name
      metafield(namespace: $namespace, key: $key) {
        id
        key
        namespace
        ownerType
        value
        jsonValue
      }
    }
  }
`;


const accessToken = process.env.ADMIN_API_KEY;
const graphQlEndPoint = process.env.GRAPHQL_ENDPOINT;

if (!accessToken) throw new Error("accessToken not found");
if (!graphQlEndPoint) throw new Error("graphQlEndPoint not found");

export const shopifyFetch = async ({
  query,
  variables,
}: {
  query: string;
  variables?: { [key: string]: any };
}) => {
  try {
    if (!graphQlEndPoint) throw new Error("graphQlEndPoint not found");
    if (!accessToken) throw new Error("accessToken not found");

    const result = await fetch(graphQlEndPoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables }),
      }),
      cache: "no-store",
    });

    if (result.status !== 200) {
      console.log('Shopify fetch: <>', result.body)
      console.log('Shopify fetch failed with status <>', result.status)
      throw new Error(`Shopify fetch failed with status ${result.status}`);
    }

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return { status: result.status, body };

  } catch (error) {
    console.error(error);
    throw {
      error,
      query,
    };
  }
};
