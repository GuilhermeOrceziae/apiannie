import {
  Box,
  Button,
  Grid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getApiById } from "~/models/api.server";
import { httpResponse } from "~/utils";
import Editor, { saveApiAction } from "./..editor";
import Postman from "./..postman";

export const loader = async ({ request, params }: LoaderArgs) => {
  let { apiId } = params;
  invariant(apiId);

  let api = await getApiById(apiId);

  if (!api) {
    throw httpResponse.BadRequest;
  }

  return json({ api, url: request.url });
};

export const action = async ({ request, params }: ActionArgs) => {
  let { apiId } = params;
  invariant(apiId);
  let formData = await request.formData();

  if (formData.get("_action") === "test") {
    throw httpResponse.NotFound;
  }

  await saveApiAction(apiId, formData);

  return json({});
};

export default function ApiInfo() {
  const { apiId } = useParams();
  return (
    <Tabs
      key={apiId}
      display={"grid"}
      as={Grid}
      gridTemplateRows="48px 1fr"
      h="full"
    >
      <TabList px={2}>
        <Tab>Info</Tab>
        <Tab>Edit</Tab>
        <Tab>Exec</Tab>
        <Tab>Mock</Tab>
      </TabList>

      <TabPanels overflowY={"auto"}>
        <TabPanel>
          <Box>
            <Form method="post" replace>
              <Button type="submit" name="_action" value="test">
                Test
              </Button>
            </Form>
          </Box>
        </TabPanel>
        <TabPanel>
          <Editor />
        </TabPanel>
        <TabPanel h="full" p={0}>
          <Postman />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
