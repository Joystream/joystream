# WIP: Specification Format

This specification consists of two complementary components

1. The Substrate runtime and consensus system.

2. A collection of peer-to-peer and client-server communication protocol.


## Substrate Modules

**TBD**

should migration stuff be here?



### Extrinsics



**Errors**

All errors have their own precondition. The errors are listed in the order which corresponds to what order they would be invoked if _multiple_ error conditions were satisified simultanously. If this cannot be expressed as a single linear list, the section must reflect this informaiton in some other way in a fully unambigous manner.

Error scenarios, which thus have no side effects, and no events. The section title is used as error message. The full precondition for each case is not only the listed condition in the same row, but also the combined failure of all listed preconditions of prior rows.

**Side effects**

Assume that all error preconditions are simultnaously false, denoted by predicate `NO_ERROR`.

#### Terminiantion
Important to notice that its very deeply specified, where even the order of error triggering in scenarios with mulitple simultanous errors, is commited to up front, compared to a loser standard of saying that, if you have one of these problems, you will get at least one fo these errors,w hich would drop order.

- **pre-condition:** first order predicate in the runtime state and the transaction paramters which must hold _exactly_ for transaction to be accepted. e.g. that proper person has isgned?
- **post-condition**: first order predicate in the runtime state and the transaction parameters which must hold _exactly_ when the transaction is accepted. The value of state variable `X` _after_ a transaction is handled, is denoted by `X'`. Hence, as an example, the condition that an integer variable `foo` has been incremented after a transaction is captured by the following predicate: `foo' == foo + 1`. Notice that blockchain state, like event logs ands o on, are not part of this, hence they are not in post-condition. (perhaps change?). It is OK to use separately defined functions to define this predicate, but these cannot have side effects.

Notice that no _iomplementaiton_ is ever provided, only how transaction generate new state constraints. This allows us to avoid any implementation specific types, and also allows all modules to be defiend in terms of what actual types are instantioned in the parametric `T::` trait, rather than introduce lots of trait abstractions.


cponditionals are basically valid Rust code.

side ffects are pure, no

functions used can only be pure, i.e. only depend on explicit parameters, and also have 0 side effcts.


Always read stroage variables of any module through type, not varible name.

#### Rrsult

Here, all values are either before or after execution, using same tag symbol.

**Events**

Same as result



## Substrate Runtime


- how to find modules toeghet
- what types are actually used
- consensus decisions
- cofngiuration stuff

- migration!

We are speicfying what:

-  explain how to intereprt speciciation, so we understand `map`, build et.
- xxxx


## Communication Protocols

<here we write stuff about how to read and understand our protocols>



-->
