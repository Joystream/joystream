use crate::{AccountId, Runtime};
use frame_support::{StorageMap, StorageValue};

// Credential Checker that gives the sudo key holder all credentials
pub struct SudoKeyHasAllCredentials {}
impl versioned_store_permissions::CredentialChecker<Runtime> for SudoKeyHasAllCredentials {
    fn account_has_credential(
        account: &AccountId,
        _credential: <Runtime as versioned_store_permissions::Trait>::Credential,
    ) -> bool {
        <pallet_sudo::Module<Runtime>>::key() == *account
    }
}

// Allow sudo key holder permission to create classes
pub struct SudoKeyCanCreateClasses {}
impl versioned_store_permissions::CreateClassPermissionsChecker<Runtime>
    for SudoKeyCanCreateClasses
{
    fn account_can_create_class_permissions(account: &AccountId) -> bool {
        <pallet_sudo::Module<Runtime>>::key() == *account
    }
}

pub struct ContentLeadOrSudoKeyCanCreateClasses {}
impl versioned_store_permissions::CreateClassPermissionsChecker<Runtime>
    for ContentLeadOrSudoKeyCanCreateClasses
{
    fn account_can_create_class_permissions(account: &AccountId) -> bool {
        ContentLeadCanCreateClasses::account_can_create_class_permissions(account)
            || SudoKeyCanCreateClasses::account_can_create_class_permissions(account)
    }
}

// Allow content working group lead to create classes in content directory
pub struct ContentLeadCanCreateClasses {}
impl versioned_store_permissions::CreateClassPermissionsChecker<Runtime>
    for ContentLeadCanCreateClasses
{
    fn account_can_create_class_permissions(account: &AccountId) -> bool {
        // get current lead id
        let maybe_current_lead_id = content_working_group::CurrentLeadId::<Runtime>::get();
        if let Some(lead_id) = maybe_current_lead_id {
            let lead = content_working_group::LeadById::<Runtime>::get(lead_id);
            lead.role_account == *account
        } else {
            false
        }
    }
}
