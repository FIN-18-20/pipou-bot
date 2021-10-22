# Pipou bot

## Development

### Prerequisites

- Node.js v14
- npm v6
- Redis

### Preparation of the environment

Install the dependencies with npm:

```console
npm ci
```

Copy the file `.env.example`, add the bot token and the redis login address:

```console
cp.env.example .env
```

### Running the bot

```console
npm start
```

This command executes the `src/bot.ts` file, which starts the bot. Changes in the `src` folder are watched by `nodemon` and the bot is restarted automatically.

### Tests

The project contains 3 test scripts that must pass for any commit pushed to the `main` branch. You can run all the tests with the following command:

```console
npm test
```

#### Tests TS

```console
# Run the tests.
npm run test-only

# Run the tests and create a coverage report.
npm run test-coverage
```

The test framework [Jest](https://jestjs.io/) is used to run the tests. These should be written in TypeScript in the `tests` folder. Try to keep the same folder structure as in `src` to organize the tests.

#### Lint

```console
# Running ESLint
npm run lint

# Run ESLint with automatic correction.
npm run lint-fix
```

We use [ESLint](https://eslint.org/) and [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) for static code analysis.

#### TypeScript type checking

```console
npm run check-types
```

This command runs the TypeScript compiler with the `--noEmit` option. It validates types for the entire project, including files that are not tested with Jest.

### Writing features

#### Cron jobs

Each cron job must be written to a file in the `src/crons` folder. This
file must instantiate and export by default an instance of the Cron class,
passing it the following configuration parameters:

- `enabled`: boolean. Can be set to `false` to disable the task.
- `name`: string. Name of the task. Used in the logs.
- `description`: string. Description of what the task does.
- `schedule`: string. Execution program. You can use [crontab guru](https://crontab.guru/) to prepare it.
- `handle`: function. Function executed according to the program. It will receive a `context` argument, with properties:
  - `date`: Theoretical date of execution of the task.
  - `client`: Instance of the discord.js client.
  - `logger`: Instance of the pino logger.

Example:

```ts
import { Cron } from '../framework';

export default new Cron({
  enabled: true,
  name: 'CronJob',
  description: 'Description',
  schedule: '*/30 * * * *',
  async handle(context) {
    // Code executed according to the schedule
  },
});
```