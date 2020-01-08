use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;

#[derive(Encode, Decode, Copy, Clone, Ord, PartialOrd, Eq, PartialEq, Debug)]
pub enum Role {
    StorageProvider,
    ChannelOwner,
    CuratorLead,
    Curator,
}

#[derive(Encode, Decode, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
pub struct ActorInRole<ActorId> {
    pub role: Role,
    pub actor_id: ActorId,
}

impl<ActorId> ActorInRole<ActorId> {
    pub fn new(role: Role, actor_id: ActorId) -> Self {
        ActorInRole { role, actor_id }
    }
}

#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd)]
pub struct ActorInRoleSet<ActorId: Ord + Copy>(BTreeSet<ActorInRole<ActorId>>);

impl<ActorId: Ord + Copy> ActorInRoleSet<ActorId> {
    pub fn new() -> Self {
        Self(BTreeSet::<ActorInRole<ActorId>>::new())
    }

    fn role_instance_count(&self, role: Role) -> usize {
        self.0.iter().fold(0, |count, actor_in_role| {
            if actor_in_role.role == role {
                count + 1
            } else {
                count
            }
        })
    }

    pub fn occupies_role(&self, role: Role) -> bool {
        self.role_instance_count(role) > 0
    }

    pub fn register_role(&mut self, actor_in_role: &ActorInRole<ActorId>) -> bool {
        self.0.insert(*actor_in_role)
    }

    pub fn unregister_role(&mut self, actor_in_role: &ActorInRole<ActorId>) -> bool {
        self.0.remove(actor_in_role)
    }

    pub fn has_registered_role(&self, actor_in_role: &ActorInRole<ActorId>) -> bool {
        self.0.contains(actor_in_role)
    }
}
