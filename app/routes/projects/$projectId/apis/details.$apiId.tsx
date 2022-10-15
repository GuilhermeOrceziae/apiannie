import {
  Box,
  BoxProps,
  Button,
  Center,
  Checkbox,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  HeadingProps,
  HStack,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Radio,
  RadioGroup,
  RadioProps,
  Select,
  Tab,
  Table,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBoolean,
  useColorModeValue,
  useDisclosure,
  useMultiStyleConfig,
  useTab,
  VStack,
} from "@chakra-ui/react";
import { ApiData, ParamType, RequestBodyType } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import React, { useCallback, useRef, useState } from "react";
import { BsFillCaretDownFill, BsFillCaretRightFill } from "react-icons/bs";
import { FiEye, FiMinus, FiPlus, FiSettings, FiTrash2 } from "react-icons/fi";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getApiById } from "~/models/api.server";
import { JsonNode, JsonNodeType, RequestMethods } from "~/models/type";
import { FormHInput, FormInput } from "~/ui";
import ModalInput from "~/ui/Form/ModalInput";
import { httpResponse } from "~/utils";
import { PathInput } from "../apis";

export const loader = async ({ request, params }: LoaderArgs) => {
  let { apiId } = params;
  invariant(apiId);

  let api = await getApiById(apiId);

  if (!api) {
    throw httpResponse.BadRequest;
  }

  return json({ api });
};

export const action = async ({ request, params }: ActionArgs) => {
  let { apiId } = params;
  invariant(apiId);
  let formData = await request.formData();

  if (formData.get("_action") === "test") {
    throw httpResponse.NotFound;
  }

  saveApiAction(apiId, formData);

  return json({});
};

export const saveApiAction = async (apiId: string, formData: FormData) => {
  let result = await validator.validate(formData);

  console.log(result.submittedData);
  console.log(result.data);
  console.log(result.error);
  if (result.error) {
    return validationError(result.error);
  }

  let data = result.data;
  let apiData: ApiData = {
    name: data.name,
    path: data.path,
    method: data.method,
    description: data.description || null,
    pathParams: [],
    queryParams: [],
    headers: [],
    bodyType: data.bodyType,
    bodyForm: [],
    bodyRaw: {
      example: data.bodyRaw.example,
      description: data.bodyRaw.description,
    },
    bodyJson: {},
    response: {},
  };
};

export default function ApiInfo() {
  return (
    <Tabs display={"grid"} as={Grid} gridTemplateRows="48px 1fr" h="full">
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
          <Edit />
        </TabPanel>
        <TabPanel>
          <p>three!</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

const zodParam = (additionalData?: { [key: string]: z.ZodTypeDef }) => {
  return z
    .object({
      name: z.string().trim().optional(),
      example: z.string().trim().optional(),
      description: z.string().trim().optional(),
      isRequired: z.string().optional(),
      ...additionalData,
    })
    .array()
    .optional();
};

const JsonNodeZod: z.ZodType<Omit<JsonNode, "children">> = z.lazy(() =>
  z.object({
    name: z.string().optional(),
    mock: z.string().optional(),
    isRequired: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(JsonNodeType),
    children: z.array(JsonNodeZod).optional(),
    arrayElem: JsonNodeZod.optional(),
  })
);

const BodyTypes = [
  RequestBodyType.FORM,
  RequestBodyType.JSON,
  RequestBodyType.RAW,
] as const;

const validator = withZod(
  z.object({
    name: z.string().trim(),
    path: z.string().trim(),
    method: z.enum(RequestMethods),
    description: z.string().trim().optional(),
    pathParams: zodParam(),
    queryParams: zodParam(),
    headers: zodParam(),
    bodyType: z.enum(BodyTypes),
    bodyForm: zodParam({ type: z.enum([ParamType.STRING, ParamType.FILE]) }),
    bodyJson: JsonNodeZod,
    bodyRaw: z.object({
      example: z.string().trim(),
      description: z.string().trim(),
    }),
    response: JsonNodeZod,
  })
);

const Header = (props: HeadingProps) => {
  return (
    <Heading
      borderLeft={"3px solid #2395f1"}
      pl={2}
      size={"md"}
      mb={4}
      {...props}
    />
  );
};

const RadioTab = React.forwardRef<HTMLInputElement, RadioProps>(
  (props, ref) => {
    const bgBW = useColorModeValue("white", "inherit");
    const tabProps = useTab({ ...props, ref });
    const isSelected = !!tabProps["aria-selected"];
    const styles = useMultiStyleConfig("Tabs", tabProps);
    const { children, ...rest } = tabProps;
    const { name, value, defaultChecked } = props;
    return (
      <Box {...rest}>
        <Flex as="label">
          <Radio
            bg={bgBW}
            ref={ref}
            isChecked={isSelected}
            __css={styles.tab}
            name={name}
            value={value}
            defaultChecked={defaultChecked}
          />
          <Box ml={2}>{children}</Box>
        </Flex>
      </Box>
    );
  }
);

const Edit = () => {
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const gray = useColorModeValue("gray.300", "gray.600");
  const labelWidth = "100px";
  const ref = useRef<HTMLFormElement>(null);

  return (
    <Box
      position={"relative"}
      as={ValidatedForm}
      method="patch"
      p={2}
      pb={10}
      validator={withZod(z.object({}))}
      formRef={ref}
      replace={true}
    >
      <Header>General</Header>
      <Box bg={bg} p={4}>
        <Container maxW="container.lg">
          <Box py={2}>
            <FormHInput
              isRequired
              bg={bgBW}
              labelWidth={labelWidth}
              name="name"
              label="Name"
              size="sm"
              as={Input}
              autoComplete="off"
            />
          </Box>
          <Box py={2}>
            <FormHInput
              isRequired
              bg={bgBW}
              labelWidth={labelWidth}
              name="path"
              label="Path"
              as={PathInput}
              autoComplete="off"
              size="sm"
            />
          </Box>
          <Box py={2}>
            <FormHInput
              bg={bgBW}
              labelWidth={labelWidth}
              name="description"
              label="Description"
              as={Textarea}
              autoComplete="off"
              size="sm"
              rows={5}
            />
          </Box>
        </Container>
      </Box>

      <Header mt={6}>Request</Header>
      <Box bg={bg} py={4}>
        <Tabs variant="solid-rounded" colorScheme="cyan">
          <TabList display={"flex"} justifyContent="center">
            <Tab flexBasis={"100px"}>Query</Tab>
            <Tab flexBasis={"100px"}>Body</Tab>
            <Tab flexBasis={"100px"}>Headers</Tab>
          </TabList>
          <Divider my={2} borderColor={gray} />
          <TabPanels>
            <TabPanel>
              <ParamTable prefix="queryParams" />
            </TabPanel>
            <TabPanel>
              <Tabs>
                <RadioGroup px={4} defaultValue={RequestBodyType.FORM}>
                  <TabList border={"none"} display={"flex"} gap={4}>
                    <RadioTab name="bodyType" value={RequestBodyType.FORM}>
                      form-data
                    </RadioTab>
                    <RadioTab name="bodyType" value={RequestBodyType.JSON}>
                      json
                    </RadioTab>
                    <RadioTab name="bodyType" value={RequestBodyType.RAW}>
                      raw
                    </RadioTab>
                  </TabList>
                </RadioGroup>
                <TabPanels mt={4}>
                  <TabPanel p={0}>
                    <ParamTable
                      prefix="bodyForm"
                      types={[ParamType.STRING, ParamType.FILE]}
                    />
                  </TabPanel>
                  <TabPanel>
                    <JsonEditor prefix="bodyJson" />
                  </TabPanel>
                  <TabPanel>
                    <Box>
                      <FormInput
                        bg={bgBW}
                        as={Textarea}
                        name="bodyRaw.example"
                        label="Example"
                        container={{
                          mb: 6,
                        }}
                      />
                      <FormInput
                        bg={bgBW}
                        as={Textarea}
                        name="bodyRaw.description"
                        label="Description"
                      />
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </TabPanel>
            <TabPanel>
              <ParamTable prefix="headers" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <Header mt={6}>Response</Header>
      <Box bg={bg} p={8}>
        <JsonEditor prefix="response" />
      </Box>
      <Button
        position={"fixed"}
        top={"60px"}
        right={4}
        type="submit"
        colorScheme="blue"
        size="sm"
      >
        Save
      </Button>
      <Center mt={12}>
        <Button w="240px" type="submit" colorScheme="blue">
          Save
        </Button>
      </Center>
    </Box>
  );
};

const useIds = (initialValue?: number | null | undefined) => {
  let initial: number[] = [];
  let currentId = useRef(initialValue || 0);

  if (initialValue === null || initialValue === undefined) {
    // nothing to do
  } else if (Array.isArray(initialValue)) {
    initial = initialValue;
  } else {
    initial = Array<number>(initialValue)
      .fill(0)
      .map((_, i) => i + 1);
  }

  const [ids, setIds] = useState(initial);

  const pushId = useCallback(() => {
    setIds([...ids, ++currentId.current]);
  }, [ids]);

  const removeId = useCallback(
    (id: number) => {
      let value = ids.filter((current) => current !== id);
      if (value.length === 0) {
        value.push(++currentId.current);
      }
      setIds(value);
    },
    [ids]
  );

  const insertAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= ids.length) {
        pushId();
        return;
      }
      let value = [...ids];
      value.splice(index, 0, ++currentId.current);
      setIds(value);
    },
    [ids]
  );

  const insertAfterId = useCallback(
    (elem: number) => {
      let value = [...ids];
      let index = value.findIndex((v) => v === elem);
      if (index === -1) {
        pushId();
        return;
      }
      value.splice(index + 1, 0, ++currentId.current);
      setIds(value);
    },
    [ids]
  );

  return { ids, pushId, removeId, insertAt, insertAfterId };
};

const ParamTable = ({
  prefix,
  types,
}: {
  prefix: string;
  types?: string[];
}) => {
  const bgBW = useColorModeValue("white", "gray.900");
  const { ids, pushId, removeId } = useIds(1);
  return (
    <TableContainer>
      <Table size={"sm"} colorScheme="teal">
        <Thead>
          <Tr>
            <Th width={"20%"}>Name</Th>
            {types && <Th>Type</Th>}
            <Th width={"25%"}>Example</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody verticalAlign={"baseline"}>
          {ids.map((id, i) => (
            <Tr key={id}>
              <Td>
                <HStack alignItems={"flex-start"}>
                  <FormInput
                    id={`${prefix}-${id}-name`}
                    bg={bgBW}
                    size="sm"
                    name={`${prefix}[${i}].name`}
                  />
                  <Tooltip label="Required">
                    <Center h={8}>
                      <Checkbox
                        id={`${prefix}-${id}-required`}
                        bg={bgBW}
                        name={`${prefix}[${i}].isRequired`}
                        value="true"
                      />
                    </Center>
                  </Tooltip>
                </HStack>
              </Td>
              {types && (
                <Td>
                  <Select bg={bgBW} size="sm" name={`${prefix}[${i}].type`}>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type.toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Td>
              )}
              <Td>
                <FormInput
                  id={`${prefix}-${id}-example`}
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}[${i}].example`}
                />
              </Td>
              <Td>
                <HStack>
                  <FormInput
                    id={`${prefix}-${id}-description`}
                    bg={bgBW}
                    size="sm"
                    name={`${prefix}[${i}].description`}
                    as={ModalInput}
                    modal={{ title: "Description" }}
                  />
                  <Button size="sm" onClick={() => removeId(id)}>
                    <Icon as={FiTrash2} />
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Box textAlign={"center"} mt={4}>
        <Button
          size="sm"
          colorScheme="blue"
          variant={"outline"}
          onClick={pushId}
        >
          <Icon as={FiPlus} /> Add
        </Button>
      </Box>
    </TableContainer>
  );
};

const JsonEditor = ({ prefix }: { prefix: string }) => {
  return (
    <Box>
      <VStack>
        <JsonRow depth={0} isParentOpen={true} prefix={prefix} />
      </VStack>
      <Center mt={8}>
        <Button colorScheme={"blue"} variant="outline" size="sm">
          <Icon as={FiEye} />
          <Text ml={2}>View Example</Text>
        </Button>
      </Center>
    </Box>
  );
};

const JsonRow = ({
  depth,
  isParentOpen,
  isArrayElem,
  keyId,
  onAddSibling,
  onDelete,
  prefix,
  ...rest
}: {
  depth: number;
  isParentOpen?: boolean;
  isArrayElem?: boolean;
  onAddSibling?: (id: number) => void;
  onDelete?: (id: number) => void;
  prefix: string;
  keyId?: number;
} & BoxProps) => {
  const types = [
    ParamType.OBJECT,
    ParamType.ARRAY,
    ParamType.STRING,
    ParamType.INT,
    ParamType.FLOAT,
    ParamType.BOOLEAN,
  ];
  const bgBW = useColorModeValue("white", "gray.900");
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  });
  const isRoot = depth === 0;
  const [type, setType] = useState<ParamType>(
    isRoot ? ParamType.OBJECT : ParamType.STRING
  );
  const [touched, setTouched] = useBoolean(isRoot);
  const { ids, pushId, removeId, insertAfterId } = useIds(1);
  const blue = useColorModeValue("blue.500", "blue.200");
  return (
    <>
      <HStack w="full" {...rest} alignItems="flex-start">
        <Center pl={`${depth * 24}px`} flex="0 0 320px">
          <Center w={4} h={4} cursor="pointer" onClick={onToggle}>
            {type === ParamType.OBJECT || type === ParamType.ARRAY ? (
              <Icon
                fontSize={10}
                as={isOpen ? BsFillCaretDownFill : BsFillCaretRightFill}
              />
            ) : undefined}
          </Center>
          <FormInput
            minW={16}
            size="sm"
            name={`${prefix}.name`}
            placeholder="Name"
            bg={bgBW}
            disabled={isRoot}
            value={isRoot ? "root" : undefined}
          />
        </Center>
        <Box>
          <Tooltip label="Required">
            <Center h={8}>
              <Checkbox bg={bgBW} />
            </Center>
          </Tooltip>
        </Box>
        <Select
          onChange={(e) => {
            setTouched.on();
            setType(e.target.value as ParamType);
          }}
          bg={bgBW}
          size="sm"
          flex="0 0 100px"
          defaultValue={type}
          name={`${prefix}.type`}
        >
          {types.map((type) => (
            <option key={type} value={type}>
              {type.toLowerCase()}
            </option>
          ))}
        </Select>
        <FormInput
          bg={bgBW}
          size="sm"
          name={`${prefix}.mock`}
          placeholder="Mock"
          as={ModalInput}
          modal={{ title: "Mock" }}
        />
        <FormInput
          bg={bgBW}
          size="sm"
          name={`${prefix}.description`}
          placeholder="Description"
          as={ModalInput}
          modal={{ title: "Description" }}
        />
        {isArrayElem ? (
          <Box flexBasis={"64px"} flexShrink={0} flexGrow={0} />
        ) : (
          <Flex flexBasis={"64px"} flexShrink={0} flexGrow={0}>
            {isRoot ? (
              <Button p={0} size="sm" colorScheme={"green"} variant="ghost">
                <Icon as={FiSettings} />
              </Button>
            ) : (
              <Button
                p={0}
                size="sm"
                colorScheme={"red"}
                variant="ghost"
                onClick={(e) => onDelete?.(keyId as number)}
              >
                <Icon as={FiMinus} />
              </Button>
            )}
            {depth === 0 || type !== ParamType.OBJECT ? (
              <Button
                p={0}
                size="sm"
                colorScheme={"blue"}
                variant="ghost"
                onClick={(e) => {
                  if (depth === 0) {
                    pushId();
                  } else {
                    onAddSibling?.(keyId as number);
                  }
                }}
              >
                <Icon as={FiPlus} />
              </Button>
            ) : (
              <Menu size={"sm"} colorScheme={"blue"}>
                <MenuButton
                  p={0}
                  as={IconButton}
                  icon={<FiPlus />}
                  colorScheme="blue"
                  size="sm"
                  variant={"ghost"}
                />
                <MenuList zIndex={5}>
                  <MenuItem onClick={pushId}>Add child node</MenuItem>
                  <MenuItem onClick={(e) => onAddSibling?.(keyId as number)}>
                    Add sibling node
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>
        )}
      </HStack>
      {touched && (
        <JsonRow
          isParentOpen={isParentOpen && isOpen}
          depth={depth + 1}
          hidden={!isParentOpen || !isOpen || type !== ParamType.ARRAY}
          isArrayElem
          onAddSibling={insertAfterId}
          onDelete={removeId}
          prefix={`${prefix}.arrayElem`}
        />
      )}
      {touched &&
        ids.map((id, i) => (
          <JsonRow
            key={id}
            keyId={id}
            isParentOpen={isParentOpen && isOpen}
            depth={depth + 1}
            hidden={!isParentOpen || !isOpen || type !== ParamType.OBJECT}
            onAddSibling={insertAfterId}
            onDelete={removeId}
            prefix={`${prefix}.children[${i}]`}
          />
        ))}
    </>
  );
};
