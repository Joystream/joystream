use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;

pub type RoleId = u32;
pub type ActorId = u32;

#[derive(Encode, Decode, Copy, Clone)]
pub enum Role {
    Publisher,
    CuratorLead,
    Curator,
}

impl From<Role> for RoleId {
    fn from(r: Role) -> RoleId {
        match r {
            Role::Publisher => 0,
            Role::CuratorLead => 1,
            Role::Curator => 2,
        }
    }
}

#[derive(Encode, Decode, Eq, PartialEq, PartialOrd, Ord, Copy, Clone, Debug)]
pub struct ActorInRole {
    role_id: RoleId,
    actor_id: ActorId,
}

impl ActorInRole {
    pub fn new(role: Role, actor_id: ActorId) -> Self {
        ActorInRole {
            role_id: role.into(),
            actor_id,
        }
    }
}

#[derive(Encode, Decode)]
pub struct ActorInRoleSet(BTreeSet<ActorInRole>);

impl ActorInRoleSet {
    pub fn new() -> Self {
        ActorInRoleSet(BTreeSet::new())
    }

    fn role_id_instance_count(&self, role_id: RoleId) -> usize {
        self.0.iter().fold(0, |count, actor_in_role| {
            if actor_in_role.role_id == role_id {
                count + 1
            } else {
                count
            }
        })
    }

    pub fn occupies_role(&self, actor_in_role: ActorInRole) -> bool {
        self.role_id_instance_count(actor_in_role.role_id) > 0
    }

    pub fn register_role(&mut self, actor_in_role: &ActorInRole) -> bool {
        self.0.insert(*actor_in_role)
    }

    pub fn unregister_role(&mut self, actor_in_role: &ActorInRole) -> bool {
        self.0.remove(actor_in_role)
    }
}
