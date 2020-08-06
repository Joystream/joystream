# GraphQL Entity Relationships

### One-To-One (1:1) Relationships

In One-To-One relation, one entity instance is related to only one instance of another entity. One side of the relationship should always derive.

```graphql
type User @entity {
	name: String!
	profile: Profile! @derivedFrom(field: "user")
}

type Profile @entity {
	avatar: String!
	user: User!
}
```

Database tables:

```
          user
| Column  | Type
----------|-------
| id      | character varying
| name    | character varying
```

```
          profile
| Column  | Type
----------|-------
| id      | character varying
| avatar  | character varying
| userId  | character varying FOREIGN KEY UNIQUE CONSTRAINT
```

### One-To-Many (1:n) Relationships

In One-To-Many relation, one entity instance is related to multiple instance of the other entity.

```graphql
type User @entity {
	name: String
}

type Post @entity {
	title: String
	author: User!
}
```

Database table for the `Post` entity:

```
          post
| Column  | Type
----------|-------
| id      | character varying
| avatar  | character varying
| authorId  | character varying FOREIGN KEY
```

The only difference between `1:1` and `1:n` is the unique constraint that `1:1` has.

### Many-To-Many (n:n) Relationships

Many-To-Many is a relationship where one entity instance is related to many instance of other entity and vice-versa. In this relationship one side of the relation must derive.

```graphql
type User @entity {
	name: String
	books: [Book!] @derivedFrom(field: "authors")
}

type Book @entity {
	title: String
	authors: [User!]
}
```

A junction table is created for n:n relationship.

Database tables:

```
          book
| Column  | Type
----------|-------
| id      | character varying
| title   | character varying
```

```
          book_user
| Column  | Type
----------|-------
| book_id | character varying
| user_id | character varying
```

### Reverse Lookups

Defining reverse lookups on an entity allows you to query other side of the relation. Use `@derivedFrom` directive to add reverse lookup to an entity.

**Example**
If we want to access a user's `posts` from the user entity we should add a derived field to `User` entity:

```graphql
type User @entity {
	name: String
	posts: [Post!] @derivedField(field: "author")
}

type Post @entity {
	title: String
	author: User!
}
```

## Relationships In Mappings

Each GraphQL entity has a corresponding typeorm entity and we use these entities to perform CRUD operations.

**Example**

We will create a new post for an existing user:

```ts
export async function handleNewPost(db: DB, event: SubstrateEvent) {
	const { userId, title } = event.params;
	const user = await db.get(User, { where: { id: userId } });

	const newPost = new Post();
	newPost.title = title;
	newPost.author = user;

	db.save<Post>(newPost);
}
```
