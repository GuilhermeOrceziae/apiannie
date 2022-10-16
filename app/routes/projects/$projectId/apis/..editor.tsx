import {
  Box,
  BoxProps,
  Button,
  Center,
  Checkbox,
  Container,
  Divider,
  Flex,
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
import {
  ApiData,
  ParamType,
  Prisma,
  RequestBodyType,
  RequestParam,
} from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import React, { useCallback, useRef, useState } from "react";
import { BsFillCaretDownFill, BsFillCaretRightFill } from "react-icons/bs";
import { FiEye, FiMinus, FiPlus, FiSettings, FiTrash2 } from "react-icons/fi";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z, ZodTypeDef } from "zod";
import { saveApiData } from "~/models/api.server";
import { JsonNode, JsonNodeType, RequestMethods } from "~/models/type";
import { FormHInput, FormInput } from "~/ui";
import ModalInput from "~/ui/Form/ModalInput";
import { PathInput } from "../apis";
import { loader } from "./details.$apiId";

type JsonNodeFormElem = Omit<
  Partial<JsonNode>,
  "children" | "arrayElem" | "isRequired"
> & {
  isRequired?: string;
};
type JsonNodeForm = JsonNodeFormElem & {
  arrayElem?: JsonNodeForm;
  children?: JsonNodeForm[];
};
type JsonNodeTransformedElem = Omit<JsonNodeFormElem, "isRequired"> & {
  isRequired: boolean;
};
type JsonNodeTransformed = JsonNodeTransformedElem & {
  arrayElem?: JsonNodeTransformed;
  children?: JsonNodeTransformed[];
};

export const saveApiAction = async (apiId: string, formData: FormData) => {
  let result = await validator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  let data = result.data;

  let queryParams: RequestParam[] = formatZodParam(data.queryParams);
  let headers: RequestParam[] = formatZodParam(data.headers);
  let bodyForm: RequestParam[] = formatZodParam(data.bodyForm);
  let bodyJson = formatZodJson(data.bodyJson);
  let responseJson = formatZodJson(data.response);

  let apiData: ApiData = {
    name: data.name,
    path: data.path,
    method: data.method,
    description: data.description || null,
    pathParams: [],
    queryParams: queryParams,
    headers: headers,
    bodyType: data.bodyType,
    bodyForm: bodyForm,
    bodyRaw: {
      example: data.bodyRaw.example,
      description: data.bodyRaw.description,
    },
    bodyJson: bodyJson as unknown as Prisma.JsonValue,
    response: {
      "200": responseJson as unknown as Prisma.JsonValue,
    },
  };

  return saveApiData(apiId, apiData);
};

const JsonNodeZod: z.ZodType<
  JsonNodeTransformedElem,
  ZodTypeDef,
  JsonNodeFormElem
> = z.lazy(() =>
  z.object({
    name: z.string().optional(),
    mock: z.string().optional(),
    example: z.string().optional(),
    isRequired: z
      .string()
      .optional()
      .transform((elem) => elem !== undefined),
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

const zodParam = z
  .object({
    name: z.string().trim().optional(),
    example: z.string().trim().optional(),
    description: z.string().trim().optional(),
    isRequired: z
      .string()
      .optional()
      .transform((arg) => arg !== undefined),
    type: z.nativeEnum(ParamType).optional(),
  })
  .array()
  .optional();

const formatZodParam = (params: z.infer<typeof zodParam>) => {
  return (params || [])
    .filter((obj) => !!obj.name)
    .map((obj) => {
      const { name, example, description, ...rest } = obj;
      invariant(name);
      return {
        name: name,
        example: example || "",
        description: description || "",
        type: obj.type || ParamType.STRING,
        ...rest,
      };
    });
};

const formatZodJson = (json: JsonNodeTransformed): JsonNode => {
  json.name = "root";
  const formatZodJsonRec = (node: JsonNodeTransformed) => {
    let { children, arrayElem, ...rest } = node;
    let { name, description, type, isRequired, mock, example } = rest;

    invariant(type);

    if (!name) {
      return undefined;
    }

    let newChildren: JsonNode[] =
      children
        ?.map((elem) => formatZodJsonRec(elem))
        .filter((elem): elem is JsonNode => !!elem) || [];

    let newArrayElem = arrayElem ? formatZodJsonRec(arrayElem) : undefined;

    let retval: JsonNode = {
      name: name,
      type: type,
      description: description || "",
      example: example || "",
      mock: mock || "",
      isRequired: !!isRequired,
      children: newChildren,
      arrayElem: newArrayElem,
    };
    return retval;
  };

  return formatZodJsonRec(json) as JsonNode;
};

const validator = withZod(
  z.object({
    name: z.string().trim(),
    path: z.string().trim(),
    method: z.enum(RequestMethods),
    description: z.string().trim().optional(),
    pathParams: zodParam,
    queryParams: zodParam,
    headers: zodParam,
    bodyType: z.enum(BodyTypes),
    bodyForm: zodParam,
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

const jsonNodeToForm = (json: JsonNode) => {
  const { type, children, arrayElem, isRequired, ...rest } = json;
  const newChildren = children.map((elem) => jsonNodeToForm(elem));
  const newArrayElem = arrayElem ? jsonNodeToForm(arrayElem) : undefined;
  let retval: JsonNodeForm = {
    type: type,
    children: type === "ARRAY" ? [] : newChildren,
    arrayElem: newArrayElem,
    isRequired: isRequired ? "true" : undefined,
    ...rest,
  };
  return retval;
};

const Editor = () => {
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const gray = useColorModeValue("gray.300", "gray.600");
  const labelWidth = "100px";
  const ref = useRef<HTMLFormElement>(null);
  const { api } = useLoaderData<typeof loader>();
  let { response, bodyJson, ...rest } = api.data;
  let response200 = response ? (response as any)["200"] : undefined;

  let defaultValues = {
    ...rest,
    response: response200
      ? jsonNodeToForm(response200 as unknown as JsonNode)
      : undefined,
    bodyJson: bodyJson
      ? jsonNodeToForm(bodyJson as unknown as JsonNode)
      : undefined,
  };
  // console.log(api);
  // console.log(defaultValues);
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
      defaultValues={defaultValues}
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
                    <JsonEditor
                      defaultValues={defaultValues.bodyJson}
                      prefix="bodyJson"
                      isMock={false}
                    />
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
        <JsonEditor
          prefix="response"
          isMock={true}
          defaultValues={defaultValues.response}
        />
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
                      <FormInput
                        as={Checkbox}
                        id={`${prefix}-${id}-required`}
                        bg={bgBW}
                        name={`${prefix}[${i}].isRequired`}
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

const JsonEditor = ({
  prefix,
  isMock,
  defaultValues,
}: {
  prefix: string;
  isMock: boolean;
  defaultValues?: JsonNodeForm;
}) => {
  return (
    <Box>
      <VStack>
        <JsonRow
          depth={0}
          isParentOpen={true}
          prefix={prefix}
          isMock={isMock}
          defaultValues={defaultValues}
        />
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
  isMock,
  defaultValues,
  ...rest
}: {
  depth: number;
  isParentOpen?: boolean;
  isArrayElem?: boolean;
  onAddSibling?: (id: number) => void;
  onDelete?: (id: number) => void;
  prefix: string;
  keyId?: number;
  isMock: boolean;
  defaultValues?: JsonNodeForm;
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
    defaultValues?.type || (isRoot ? ParamType.OBJECT : ParamType.STRING)
  );
  const [touched, setTouched] = useBoolean(isRoot || !!defaultValues?.name);
  const { ids, pushId, removeId, insertAfterId } = useIds(
    defaultValues?.children?.length || 1
  );
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
            isDisabled={isRoot || isArrayElem}
            value={isRoot ? "root" : isArrayElem ? "items" : undefined}
          />
        </Center>
        <Box>
          <Tooltip label="Required">
            <Center h={8}>
              <FormInput
                as={Checkbox}
                name={`${prefix}.isRequired`}
                bg={bgBW}
                isChecked={isArrayElem ? false : undefined}
                isDisabled={isArrayElem}
                // value="true"
              />
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
          name={`${prefix}.${isMock ? "mock" : "example"}`}
          placeholder={isMock ? "Mock" : "Example"}
          as={ModalInput}
          modal={{ title: "Mock" }}
          isDisabled={type === "ARRAY" || type === "OBJECT"}
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
          isMock={isMock}
          defaultValues={defaultValues?.arrayElem}
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
            isMock={isMock}
            defaultValues={defaultValues?.children?.[i]}
          />
        ))}
    </>
  );
};

export default Editor;