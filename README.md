<h1 align="center">
    <a href="https://apiannie.com">
       <img alt="ApiAnnie" src="https://user-images.githubusercontent.com/4088232/199437591-23d65512-2d66-4ba6-ae77-5f1748e5bdca.png" width="500">
    </a>
    <br><br>
    <small>A lightweight web tool for API documentation and development</small>
</h1>

Api Annie helps your team to co-ordinate easier when developing a product which needs API comunication, by going through the following steps:
1. Define your API documentation
2. Frontend developer makes their prototype by using the mock server automatically generated by Api Annie.
3. Backend developer builds the backend services and test it by sending requests through Api Annie
4. When both frontend and backend development are finished, let frontend switch communication from Api Annie to your backend server URL. 

## Installation
### Cloud service
We recommend using our [cloud service](https://apiannie.com), where you can always access to the latest features.

### Manual installation
If you prefer deploying Api Annie in your own machine, run:
```
git clone git@github.com:apiannie/apiannie.git

cd apiannie
```

Then create a file named `.env`, which should contains the following environment variables:
```
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@HOST/DATABASE"
SESSION_SECRET="replace-it-by-random-string"
```
For more info about connection to MongoDB, please refer to [this doc from Prisma](https://www.prisma.io/docs/concepts/database-connectors/mongodb)

Then install dependency packages, and initalize database:
```
npm install
npx prisma db push
```

or if you are using yarn
```
yarn install
yarn prisma db push
```

Up to now, you have your environment successfully setup, to run Api Annie in dev mode:
```
npm run dev // or `yarn dev`
```

To run in release mode:
```
npm run build
npm start
```
or if you are using yarn
```
yarn build
yarn start
```

## License
This project is licensed under the Apache License 2.0 - see the [LICENSE](https://github.com/apiannie/apiannie/blob/readme-update/LICENSE) file for details.
