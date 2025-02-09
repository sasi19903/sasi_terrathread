import React, { useCallback, useState } from 'react';
import { Page, Card, TextField, Button, Text, BlockStack, InlineGrid, InlineStack, ButtonGroup } from '@shopify/polaris';
import { EditIcon } from '@shopify/polaris-icons';
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { authenticate } from 'app/shopify.server';
import { getShopQuery, METAFIELD_VALUES, setMetafieldMutation } from 'app/lib';

type LoaderData = {
  shopId: string;
  customerCounts: number | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, } = await authenticate.admin(request)

  const response = await admin.graphql(getShopQuery, {
    variables: {
      namespace: METAFIELD_VALUES.METAFIELD_NAMESPACE,
      key: METAFIELD_VALUES.METAFIELD_KEY
    }
  })

  const responseJson = await response.json()

  const shopId = responseJson?.data?.shop?.id ?? null
  const customerCounts = responseJson?.data?.shop?.metafield?.jsonValue ?? null

  return { shopId, customerCounts }

}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const customerCount = formData.get("customerCount")
  const shopId = formData.get("shopId")

  const { admin, } = await authenticate.admin(request)

  const response = await admin.graphql(setMetafieldMutation, {
    variables: {
      metafields: {
        ownerId: shopId,
        value: customerCount,
        namespace: METAFIELD_VALUES.METAFIELD_NAMESPACE,
        key: METAFIELD_VALUES.METAFIELD_KEY,
        type: METAFIELD_VALUES.METAFIELD_TYPE
      }
    }
  })

  const responseJson = await response.json()


  return { responseJson };
}

export default function New() {

  const { shopId, customerCounts } = useLoaderData<LoaderData>()

  const submit = useSubmit();
  const [customerCount, setCustomerCount] = useState(customerCounts ? customerCounts : 0);
  const [isEditing, setIsEditing] = useState(true);
  const shopify = useAppBridge()

  const handleEditClick = (bool: boolean) => {
    setIsEditing(bool);
  };

  const handleCustomerCount = useCallback(
    (value: string) => setCustomerCount(Number(value)),
    [],
  );

  const handleProceed = () => {
    const formData = new FormData();
    formData.append("customerCount", customerCount.toString());
    formData.append("shopId", shopId);
    submit(formData, { method: "post" });
    shopify.modal.hide("my-modal");
    handleEditClick(false)
  };

  return (<>
    <Modal id="my-modal">
      <p style={{ marginBlock: "20px", marginInline: "10px" }}>Are you sure you want to update the count? This action cannot be undone.</p>
      <TitleBar title='Update count confirmation' >
        <button onClick={() => shopify.modal.hide('my-modal')}>Cancel</button>
        <button variant="primary" onClick={handleProceed} >Proceed</button>
      </TitleBar>
    </Modal>
    <Page title="Customer Counting">
      <BlockStack gap={"400"} >
        <Card roundedAbove="sm">
          <BlockStack gap="400">
            <BlockStack gap="200">
              <InlineGrid columns="1fr auto">
                <Text as="h3" variant="headingSm" fontWeight="medium">
                  Total customer count till now:
                </Text>
                <Button
                  icon={EditIcon}
                  variant="tertiary"
                  onClick={() => { handleEditClick(true) }}
                  accessibilityLabel="Edit"
                />
              </InlineGrid>
              <Text as="p" variant="headingLg" fontWeight='regular'>
                {customerCounts ? customerCounts : 0}
              </Text>
              {isEditing && <BlockStack gap={"300"} >
                <TextField autoComplete='off' label="Edit customer count" type='number' onChange={handleCustomerCount} value={customerCount.toString()} />
                <InlineStack align="end">
                  <ButtonGroup>
                    <Button onClick={() => { handleEditClick(false) }} accessibilityLabel="Fulfill items">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => shopify.modal.show('my-modal')}
                      accessibilityLabel="Create shipping label"
                    >
                      Update
                    </Button>
                  </ButtonGroup>
                </InlineStack>
              </BlockStack>}
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  </>
  )
}
