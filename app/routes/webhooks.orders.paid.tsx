import type { ActionFunctionArgs } from "@remix-run/node";
import { getShopQuery, METAFIELD_VALUES, setMetafieldMutation, shopifyFetch } from "app/lib";



export const action = async ({ request }: ActionFunctionArgs) => {
    try {

        const shopResponse = await shopifyFetch({
            query: getShopQuery,
            variables: {
                namespace: METAFIELD_VALUES.METAFIELD_NAMESPACE,
                key: METAFIELD_VALUES.METAFIELD_KEY
            }
        })

        console.log('Shop response:', JSON.stringify(shopResponse, null, 2))

        // Validate the response structure
        if (!shopResponse?.body?.data?.shop) {
            console.error('Invalid shop response: <>', shopResponse);
            return new Response(null, { status: 500 });
        }

        const { body: { data: { shop } } } = shopResponse;

        const shopId = shop.id
        const customerCounts = shop?.metafield?.jsonValue ?? 0
        const customerCountToUpdate = 20 + customerCounts * 40

        const response = await shopifyFetch({
            query: setMetafieldMutation,
            variables: {
                metafields: {
                    ownerId: shopId,
                    value: customerCountToUpdate.toString(),
                    namespace: METAFIELD_VALUES.METAFIELD_NAMESPACE,
                    key: METAFIELD_VALUES.METAFIELD_KEY,
                    type: METAFIELD_VALUES.METAFIELD_TYPE
                }
            }
        })

        return new Response(JSON.stringify(response.body), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error('Error in webhooks.orders.paid: <> ', error);
        // Add more detailed error information
        if (error instanceof Error) {
            console.error('Error details: <>', error.message, error.stack);
        }
        return new Response(null, { status: 500 });
    }
};
