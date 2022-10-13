import {
    Box,
    BoxProps,
    Button,
    Divider,
    Flex,
    FlexProps,
    Grid,
    GridItem,
    Heading,
    HStack,
    Icon,
    IconButton,
    Image,
    List,
    ListIcon,
    ListItem,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Skeleton,
    Spacer,
    Stack,
    Text,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import {ActionArgs, json, LoaderArgs} from "@remix-run/node";
import {
    Link as RemixLink,
    NavLink,
    Outlet,
    useFetcher,
    useLoaderData,
    useMatches,
} from "@remix-run/react";
import {UseDataFunctionReturn} from "@remix-run/react/dist/components";
import {ReactNode, RefObject, useEffect, useRef, useState} from "react";
import {IconType} from "react-icons";
import {
    FiActivity,
    FiBell,
    FiChevronDown,
    FiChevronUp,
    FiGrid,
    FiList,
    FiMenu,
    FiSettings,
} from "react-icons/fi";
import logo from "~/images/logo_128.png";
import {getProjectById, getProjectByIds} from "~/models/project.server";
import {requireUser} from "~/session.server";
import {httpResponse, useUser} from "~/utils";
import ColorModeButton from "../home/..lib/ColorModeButton";
import UserMenuButton from "../home/..lib/UserMenuButton";
import {loader as loadProjects} from "./index";

export const loader = async ({request, params}: LoaderArgs) => {
    let user = await requireUser(request);

    let {projectId} = params;
    if (!projectId) {
        throw httpResponse.NotFound;
    }

    let url = new URL(request.url);
    if (url.pathname === `/projects/${projectId}`) {
        throw httpResponse.NotFound;
    }

    let project = await getProjectById(projectId);

    if (!project) {
        throw httpResponse.NotFound;
    }

    return json({user: user, project: project});
};

export const action = async ({request}: ActionArgs) => {
    let formData = await request.formData();
    let user = await requireUser(request);
    let projects = await getProjectByIds(user.projectIds);

    return json({projects});
};

export default function Layout({children}: { children: ReactNode }) {
    const {isOpen, onOpen, onClose} = useDisclosure();
    const width = 96;
    return (
        <Box h='100vh' bg={useColorModeValue("gray.50", "gray.900")}>
            <SidebarContent/>
        </Box>
    );
}

interface SidebarProps extends BoxProps {
}

const SidebarContent = ({...rest}: SidebarProps) => {
    const {project} = useLoaderData<typeof loader>();
    const matches = useMatches();
    const user = useUser();
    const sideNav = matches[2]?.handle?.sideNav;
    const [sideNavWidth, setSideNavWidth] = useState(304);
    const sideNavDrag = useRef<HTMLDivElement>();
    const lastClientX = useRef(0);
    useEffect(() => {
        const mousedown = (e: MouseEvent) => {
            if (e.target !== sideNavDrag.current) {
                return;
            }
            lastClientX.current = e.clientX;
            const handleMove = ({clientX}: { clientX: number }) => {
                setSideNavWidth(prevState => {
                    const width = prevState + clientX - lastClientX.current;
                    lastClientX.current = clientX;
                    return width < 200 ? 200 : width;
                });
            };
            document.addEventListener("mousemove", handleMove);
            document.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", handleMove);
            });
        };
        document.addEventListener("mousedown", mousedown);
        return () => {
            document.removeEventListener("mousedown", mousedown);
        };
    }, []);
    return (
        <Grid h='100vh' templateColumns={"80px 1fr"} {...rest}>
            <GridItem
                flexDirection={"column"}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderRight='1px'
                borderRightColor={useColorModeValue("gray.200", "gray.600")}
                display={"flex"}
            >
                <RemixLink to={"/projects"}>
                    <Image src={logo} p={5} _hover={{opacity: 0.8}}/>
                </RemixLink>
                <Divider mb={2}/>
                <SubMenuItem
                    to={`/projects/${project.id}/apis`}
                    icon={FiGrid}
                    name='Apis'
                />
                <SubMenuItem
                    to={`/projects/${project.id}/activities`}
                    icon={FiActivity}
                    name='Activities'
                />
                <SubMenuItem
                    to={`/projects/${project.id}/settings`}
                    icon={FiSettings}
                    name='Settings'
                />

                <Spacer/>
            </GridItem>
            <Grid templateColumns={`${sideNavWidth}px 1fr`}>
                <Grid
                    position={"relative"}
                    bg={useColorModeValue("gray.50", "gray.800")}
                    borderRightWidth='1px'
                    borderRightColor={useColorModeValue("gray.200", "gray.700")}
                    templateRows='56px minmax(0, 1fr)'
                    h='100vh'
                >
                    <ProjecChangeButton p={2}/>
                    <Box ref={sideNavDrag as RefObject<HTMLDivElement>} position={"absolute"} right={0} top={0}
                         bottom={0}
                         _hover={{borderColor: "blue.500"}}
                         cursor={"col-resize"}
                         borderRightWidth={"3px"}
                         borderRightColor={"gray.200"}></Box>
                    {sideNav}
                </Grid>
                <GridItem>
                    <Grid h='100vh' templateRows={"52px minmax(0, 1fr)"} bg={useColorModeValue("white", "gray.800")}>
                        <HStack
                            px={{base: 4, md: 4}}
                            height='full'
                            alignItems='center'
                            bg={useColorModeValue("gray.50", "gray.800")}
                            borderBottomWidth='1px'
                            borderBottomColor={useColorModeValue("gray.200", "gray.700")}
                            justifyContent={{base: "space-between", md: "flex-end"}}
                            spacing={{base: "0", md: "6"}}
                        >
                            <ColorModeButton/>
                            <IconButton
                                size='md'
                                variant='ghost'
                                aria-label='open menu'
                                icon={<FiBell/>}
                            />
                            <UserMenuButton avatar={user.avatar || undefined}/>
                        </HStack>
                        <Box overflowY={"auto"}>
                            <Outlet/>
                        </Box>
                    </Grid>
                </GridItem>
            </Grid>
        </Grid>
    );
};

const ProjecChangeButton = (props: BoxProps) => {
    const fetcher = useFetcher<UseDataFunctionReturn<typeof loadProjects>>();
    const {project} = useLoaderData<typeof loader>();
    const {isOpen, onOpen, onClose} = useDisclosure();
    return (
        <Box {...props}>
            <fetcher.Form method='post'>
                <Button w='full' variant='ghost' onClick={onOpen} type='submit'>
                    <Heading whiteSpace={"normal"} maxW={64} size={"md"} noOfLines={1}>
                        {project.name}
                    </Heading>
                    <Flex direction='column' px={1}>
                        <Icon as={FiChevronUp} w={3} h={3}/>
                        <Icon as={FiChevronDown} w={3} h={3}/>
                    </Flex>
                </Button>
            </fetcher.Form>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader textAlign={"center"}>Switch project</ModalHeader>
                    <Divider/>
                    <ModalBody>
                        {fetcher.data ? (
                            fetcher.data.projects.map((project) => (
                                <List spacing={3} key={project.id}>
                                    <ListItem>
                                        <RemixLink to={`/projects/${project.id}/apis`}>
                                            <Box
                                                h='full'
                                                _hover={{
                                                    bg: "cyan.200",
                                                    color: "white",
                                                }}
                                                onClick={onClose}
                                                py={1}
                                            >
                                                <ListIcon as={FiList} color='green.500'/>
                                                {project.name}
                                            </Box>
                                        </RemixLink>
                                    </ListItem>
                                </List>
                            ))
                        ) : (
                            <Stack>
                                <Skeleton height='20px'/>
                                <Skeleton height='20px'/>
                                <Skeleton height='20px'/>
                            </Stack>
                        )}
                    </ModalBody>
                    <Divider/>
                    <ModalFooter>
                        <Button w={36} mx='auto' onClick={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

interface SubMenuItemProps extends BoxProps {
    to: string;
    icon: IconType;
    name: string;
}

const SubMenuItem = ({to, icon, name, ...rest}: SubMenuItemProps) => {
    const color = useColorModeValue("gray.400", "gray.600");
    const activeColor = useColorModeValue("blue.600", "blue.300");
    return (
        <NavLink to={to}>
            {({isActive}) => (
                <Box
                    py={3}
                    textAlign={"center"}
                    color={isActive ? activeColor : color}
                    _hover={{
                        bg: "cyan.200",
                        color: "white",
                    }}
                    {...rest}
                >
                    <Icon w={7} h={7} as={icon}/>
                    <Text fontSize={"12px"}>{name}</Text>
                </Box>
            )}
        </NavLink>
    );
};

interface MobileProps extends FlexProps {
    onOpen: () => void;
}

const MobileNav = ({onOpen, ...rest}: MobileProps) => {
    const user = useUser();

    return (
        <Flex
            px={{base: 4, md: 4}}
            alignItems='center'
            bg={useColorModeValue("teal.50", "gray.800")}
            borderBottomWidth='1px'
            borderBottomColor={useColorModeValue("gray.200", "gray.700")}
            justifyContent={{base: "space-between", md: "flex-end"}}
            {...rest}
        >
            <IconButton
                display={{base: "flex", md: "none"}}
                onClick={onOpen}
                variant='outline'
                aria-label='open menu'
                icon={<FiMenu/>}
            />

            <Text
                display={{base: "flex", md: "none"}}
                fontSize='2xl'
                fontFamily='monospace'
                fontWeight='bold'
            >
                Logo
            </Text>

            <HStack spacing={{base: "0", md: "6"}}>
                <ColorModeButton/>
                <IconButton
                    size='md'
                    variant='ghost'
                    aria-label='open menu'
                    icon={<FiBell/>}
                />
                <UserMenuButton avatar={user.avatar || undefined}/>
            </HStack>
        </Flex>
    );
};
