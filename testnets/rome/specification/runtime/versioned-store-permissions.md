# Versioned Store Permissions Module

## Table of Contents

- [Name](#name)
- [Design](#design)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchables](#dispatchables)
- [Non-dispatchables](#non-dispatchables)
  - [create_class](#create_class)
  - [add_class_property](#add_class_property)
  - [add_class_schema](#add_class_schema)
  - [update_entity](#update_entity)
  - [delete_entity](#delete_entity)

## Name

`VersionedStorePermissions`

## Motivation

Assume one has to use the versioned store in a context where runtime upgrades are not available every time one adds a new schema or a new class or entity. In this case the rules for how to regulate who can update these objects has to already exist in the runtime to begin with. This permissions module attempts to be such a generalised rule system which has sufficient flexibility to model some core constraints required for the currently conceived use case for the versioned store in the Joystream Rome testnet, namely a store of the content directory data.

Notice that the inability to do runtime upgrades need not rule add adding new custom rules per schema, class or entity as they are added, if a smart contract abstraction exists. In this case there is no requirement to commit to a fixed model of updating rules up front.

## Design

Actions on and ownership in the versioned store are done through a two major actor personae types, a _base principal_ and a _entity principal_. These personae are meant to lift the actor model to a level of abstraction that allows for dynamic groups of participants to act in under shared set of privileges, if needed.

A base principal type comes in varieties

- **System:** Root origin in the runtime as an actor
- **Account:** an account directly behaving as an actor
- **Group Member:** member of one among a set of externally defined actor groups

An entity principal is either a base principal, or the owner of a given entity relevant to the context at hand.

All actions on the underlying version store require the actor to provide the personae under which they are acting.

The permissions themselves come in three levels. First, the permission to create classes. The ability to do this, and as a consequence define the permissions for the relevant classses created, is a high powered permissions meant for very few actors at any given time.

Second, are _class permissions_ which are specific to a given class, and which define what base personaes have the auhtority to peform the stanard set of actiosn available on a class, as well as update the permissions themselves, which are limited to so called _class admins_. There are also some base integrity constraints for how references can be used with this class.

Third, are _entity permissions_ which refers both to the set of base principal currently designated as the _entity owner_, and to the sets of base entity principals which are allowed to update an entity property value, or delete the entity.
## Usage

Is meant to sit in front of the versioned store, gating all updates, and to have some complementary governance mechanism to adjudicate who has the top level permissions to create classes, and what accounts belong to what external groups at what time.

## Dependencies

- `VersionedStore`

## Concepts

```Rust

trait GroupMembershipChecker {
   type GroupId: INTEGER_TRAIT_CONSTRAINTS;
   fn account_is_in_group(account: AccountId, group: Self::GroupId) -> bool;
}

//module trait
trait Trait {
    type GroupMembershipChecker : GroupMembershipChecker
}

enum BasePrincipal {
  System,
  Account(AccountId),
  GroupMember(GroupMembershipChecker:GroupId),
}

enum EntityPrincipal {
  Base(BasePrincipal)
  Owner
}


// Represents instance of a Class in the versioned store
struct ClassPermissions {
  // concrete permissions
  entity_permissions: EntityPermissions, // or just Vec<BasePrincipal>
  entities_can_be_created: bool,
  add_schemas: Vec<BasePrincipal>,
  create_entities: Vec<BasePrincipal>,
  can_only_be_ref_by: Vec<(ClassId, int)>

  // admins can only be set by root origin
  // admins can update all concrete permissions
  admins: Vec<BasePrincipal>,

  // Block where permissions were changed (including `admins`)
  last_permissions_update: BlockNumber
}

struct EntityPermissions {
  update: Vec<EntityPrincipal>,
  delete: Vec<EntitytPrincipal>,
}
```

## State

- `create_classes : Vec<BasePrincipal>`: this group of users can be considered the schema admins.
- `classPermissions: map ClassId => ClassPermissions`: ...
- `entityOwners: map EntityId => BasePrincipal`: ...

## Events

**TBD**

## Dispatchables


### create_class

Creates a new class with given name, description, properties and class schemas.

### add_class_property

Adds a property to a given class.

### add_class_schema

Adds a schema to a given class.

### create_entity

Creates an entity, under a given class, which supports a specific given first schema.

### update_entity

Updates all fields in an entity.

### delete_entity

Deletes a given entity.

## Non-dispatchables

**TBD**
