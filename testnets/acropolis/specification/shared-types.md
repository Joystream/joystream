
# Shared Types

Here we list shared types which are used across multiple modules in the same runtime in various ways. Most, if not all, these types may eventually be dropped, as we make our modules more isolated, and define new stronger guidelines on runtime architecture, but for now its all listed here.

## GovernanceCurrency

```Rust
pub trait GovernanceCurrency: system::Trait + Sized {
    type Currency: Currency<Self::AccountId>
        + ReservableCurrency<Self::AccountId>
        + LockableCurrency<Self::AccountId, Moment = Self::BlockNumber>;
}
```

## Members

```Rust
pub trait Members<T: system::Trait> {
    type Id: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + As<usize>
        + As<u64>
        + MaybeSerializeDebug
        + PartialEq;

    fn is_active_member(account_id: &T::AccountId) -> bool;

    fn lookup_member_id(account_id: &T::AccountId) -> Result<Self::Id, &'static str>;

    fn lookup_account_by_member_id(member_id: Self::Id) -> Result<T::AccountId, &'static str>;
}
```
