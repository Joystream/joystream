use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;

pub type ActorId = u32;

#[derive(Encode, Decode, Copy, Clone, Ord, PartialOrd, Eq, PartialEq, Debug)]
pub enum Role {
    Publisher,
    CuratorLead,
    Curator,
}

#[derive(Encode, Decode, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
pub struct ActorInRole {
    pub role: Role,
    pub actor_id: ActorId,
}

impl ActorInRole {
    pub fn new(role: Role, actor_id: ActorId) -> Self {
        ActorInRole { role, actor_id }
    }
}

#[derive(Encode, Decode)]
pub struct ActorInRoleSet(BTreeSet<ActorInRole>);

impl ActorInRoleSet {
    pub fn new() -> Self {
        ActorInRoleSet(BTreeSet::new())
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

    pub fn register_role(&mut self, actor_in_role: &ActorInRole) -> bool {
        self.0.insert(*actor_in_role)
    }

    pub fn unregister_role(&mut self, actor_in_role: &ActorInRole) -> bool {
        self.0.remove(actor_in_role)
    }

    pub fn has_registered_role(&self, actor_in_role: &ActorInRole) -> bool {
        self.0.contains(actor_in_role)
    }
}
