import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap",
    },
  ];
}

export default function Home() {
  return (
    <Container minH={"100vh"} maxW={"4xl"}>
      <Stack
        as={Box}
        textAlign={"center"}
        spacing={{ base: 8, md: 14 }}
        py={{ base: 20, md: 36 }}
      >
        <Heading
          fontWeight={600}
          fontSize={{ base: "2xl", sm: "4xl", md: "6xl" }}
          lineHeight={"110%"}
        >
          Lightweight platform
          <br />
          <Text
            fontSize={{ base: "2xl", sm: "4xl", md: "6xl" }}
            as={"span"}
            color={"teal.400"}
          >
            for API development
          </Text>
        </Heading>
        <Text fontSize={{ base: "1xl" }} color={"gray.500"}>
          API documentation, debuging, mocking and testing tool
          <br />
          for frontend developers, backend engineers and QAs
        </Text>
        <Text color={"gray.500"}></Text>
        <Stack
          direction={"column"}
          spacing={3}
          align={"center"}
          alignSelf={"center"}
          position={"relative"}
        >
          <RemixLink to="/home/signup">
            <Button colorScheme={"teal"} px={6}>
              Get Started
            </Button>
          </RemixLink>

          <Button variant={"link"} colorScheme={"blue"} size={"sm"}>
            Learn more
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
