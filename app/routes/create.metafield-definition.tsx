import { ActionFunctionArgs } from "@remix-run/node";
import { shopifyFetch, METAFIELD_VALUES, createMetafieldDefinitionMutation, createMetafieldDefinitionVariable } from "app/lib";

export const action = async ({ request }: ActionFunctionArgs) => {
    const response = await shopifyFetch({
        query: createMetafieldDefinitionMutation,
        variables: createMetafieldDefinitionVariable
    })

    const userErrors = response.body.data.metafieldDefinitionCreate.userErrors

    const doesMetafieldAlreadyExists = userErrors.find((error: { field: string[], message: string, code: string }) =>
        error.code === "TAKEN" && (error.field.includes("definition") && error.field.includes("key"))
    )

    if (userErrors.length > 0) {
        if (doesMetafieldAlreadyExists) {
            return Response.json({ success: true })
        } else {
            return Response.json({ success: false, error: userErrors })
        }
    }

    return Response.json({ success: true })
}