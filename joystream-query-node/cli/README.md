# cli

Query node cli

USAGE

```sh-session
  $ cli [COMMAND]
```

COMMANDS

```sh-session
  codegen   Generate graphql schema, ormconfig, bindings. Execute warthog
            codegen command
  db        Database management
  event     Generate events from schema
  generate  Use warthog cli and input type definetion to generate
            model/resolver/service.
  help      display help for cli
  indexer   Block indexer
  new       Create grapqhl server and event processor
  typeorm   Typeorm commands
```

# Using CLI

Start use CLI by navigate `joystream/joystream-query-node/cli` directory then:

```sh-session
$ ./bin/run [COMMAND]
```

or

```sh-session
$ yarn link
$ cli [COMMAND]
```

## An Example

Query node use postgresql as data store, before starting make sure you have postgresql installed.

1. Create a new project

```sh-session
$ cli new example
```

This command will generate an `example` directory in the current working directory. Lets see what is inside example directory:

```sh-session
$ cd example
$ ls
joystream-query-node
substrate-query-node
```

**joystream-query-node** directory hosts graphql server
**substrate-query-node** directory hosts block indexer

2. Install requirements for joystream-query-node

```sh-session
$ cd joystream-query-node
$ yarn install
```

3. Add a new type defination to schema.json

Add the type defination below into your joystream-query-node/schema.json file

```JSON
[
	{
		"name": "MemberRegistered",
		"fields": [
			{ "name": "memberId", "type": "int!" },
			{
				"name": "accountId",
				"type": "string!"
			}
		]
	}
]
```

4. Generate database model for warthog from the schema.json

```sh-session
# inside the joystream-query-node dir
$ cli generate
$ yarn warthog codegen
```

5. Now we have database models but the corresponding tables are not created on the database so we need to create them:

```sh-session
$ cli db -g "Created-MemberRegistered-model"
$ cli db --migrate
```

joystream-query-node is ready lets setup substrate-query-node

6. Create block indexer

```sh-session
$ cd substrate-query-node
$ cli indexer --create
$ yarn install
```

7. Block indexer update database with models so we will use typeorm model generator cli to generate models from existing database. Make sure you install typeorm-model-generator globally:

```sh-session
$ yarn global add typeorm-model-generator
$ cli typeorm generate
```

This command generates `entities` folder. Before moving forward open ormconfig.json and replace `"entities": ["entities/*.js"]` with `"entities": ["entities/*.ts"]`

8. We are almost done. Now we are going to add an event handler for joystream members.MemberRegistered event which we create a database model for earlier.

Add the code below into substrate-query-node/src/mappings.ts

```typescript
// New imports
import BN = require('bn.js');
import { MemberRegistereds } from '../entities/MemberRegistereds';

// New function
export function handleMemberRegistered(event: QueryEvent) {
  const member = new MemberRegistereds();

  member.accountId = event.event_params['AccountId'];
  member.memberId = new BN(event.event_params['MemberId']).toNumber();

  insertToDatabase(member);
}
```

Add the code below into substrate-query-node/src/processingPack.ts

```typescript
import { handleExtrinsicSuccess, /*New import*/ handleMemberRegistered } from './mappings';

const processingPack: QueryEventProcessingPack = {
  ExtrinsicSuccess: handleExtrinsicSuccess,
  // New line
  MemberRegistered: handleMemberRegistered,
};
```

9. Run joystream node

```
$ joystream-node --dev
```

Everything is all setup now! Lets run our graphql server and block indexer

```sh-session
$ cd joystream-query-node
$ yarn start:dev
```

```sh-session
$ substrate-query-node
$ yarn start
```

If you didn't get any error then your graphql server and block indexer should be running. Go to http://localhost:4100/graphql the graphql server and from the right most click on docs and you should be able to see queries and mutation related to MemberRegistered event.

10. There is no data on our database. For this we will use joystream integration tests, if you dont have joystream repository clone it and then cd into tests:

```sh-session
$ yarn && yarn test
```

11. Query

Go to http://localhost:4100/graphql and add this code to the editor:

```graphql
query {
  memberRegistereds {
    id
    memberId
    accountId
  }
}
```
