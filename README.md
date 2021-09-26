# connectforce

This is the code for connectforce

# Prerequisites

- [node](https://nodejs.org) >= v16
- [yarn](https://classic.yarnpkg.com) v1
- [mongo](https://www.mongodb.com/what-is-mongodb) >= v4

# Local development setup

1. Copy `.env.example` to `.env` and change the values as needed.

   ```sh
   cp .env.example .env
   ```

2. Install dependencies

   ```sh
   yarn
   ```

3. Start up mongo. If you have docker installed locally, you can run
   `yarn docker:up`, then `yarn docker:down` to spin it down.

4. Run the initial migrations

   ```sh
   yarn migrate:up
   ```

5. Build the client

   ```sh
   yarn build
   ```

6. Start the server

   ```sh
   yarn start:dev
   ```

7. Visit [http://localhost:3000](http://localhost:3000)
