use super::*;

/// Represents `Entity`, related to a specific `Class`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Entity<
    ClassId: Default + BaseArithmetic + Clone + Copy,
    MemberId: Default + PartialEq + Clone + Copy,
    Hashed: Default + Clone + Codec,
    EntityId: Default + Clone + Copy + Codec,
    Nonce: Default + BaseArithmetic + Clone + Copy,
> {
    /// Permissions for an instance of an Entity.
    entity_permissions: EntityPermissions<MemberId>,

    /// The class id of this entity.
    class_id: ClassId,

    /// What schemas under which entity of the respective class is available, think
    /// v.2.0 Person schema for John, v3.0 Person schema for John
    /// Unlikely to be more than roughly 20ish, assuming schemas for a given class eventually stableize,
    /// or that very old schema are eventually removed.
    supported_schemas: BTreeSet<SchemaId>, // indices of schema in corresponding class

    /// Values for properties on class that are used by some schema used by this entity
    /// Length is no more than Class.properties.
    values: BTreeMap<PropertyId, StoredPropertyValue<Hashed, EntityId, Nonce>>,

    /// Number of property values referencing current entity
    reference_counter: InboundReferenceCounter,
}

impl<
        ClassId: Default + BaseArithmetic + Clone + Copy,
        MemberId: Default + PartialEq + Clone + Copy,
        Hashed: Default + Clone + Codec,
        EntityId: Default + Clone + Copy + Codec,
        Nonce: Default + BaseArithmetic + Clone + Copy,
    > Entity<ClassId, MemberId, Hashed, EntityId, Nonce>
{
    /// Create new `Entity` instance, related to a given `class_id` with provided parameters,  
    pub fn new(
        controller: EntityController<MemberId>,
        class_id: ClassId,
        supported_schemas: BTreeSet<SchemaId>,
        values: BTreeMap<PropertyId, StoredPropertyValue<Hashed, EntityId, Nonce>>,
    ) -> Self {
        Self {
            entity_permissions: EntityPermissions::<MemberId>::default_with_controller(controller),
            class_id,
            supported_schemas,
            values,
            reference_counter: InboundReferenceCounter::default(),
        }
    }

    /// Get `class_id` of this `Entity`
    pub fn get_class_id(&self) -> ClassId {
        self.class_id
    }

    /// Get Entity supported schemas by mutable reference
    pub fn get_supported_schemas_mut(&mut self) -> &mut BTreeSet<SchemaId> {
        &mut self.supported_schemas
    }

    /// Get `Entity` values by value
    pub fn get_values(self) -> BTreeMap<PropertyId, StoredPropertyValue<Hashed, EntityId, Nonce>> {
        self.values
    }

    /// Get `Entity` values by reference
    pub fn get_values_ref(
        &self,
    ) -> &BTreeMap<PropertyId, StoredPropertyValue<Hashed, EntityId, Nonce>> {
        &self.values
    }

    /// Get `Entity` values by mutable reference
    pub fn get_values_mut(
        &mut self,
    ) -> &mut BTreeMap<PropertyId, StoredPropertyValue<Hashed, EntityId, Nonce>> {
        &mut self.values
    }

    /// Get mutable reference to `Entity` values
    pub fn set_values(
        &mut self,
        new_values: BTreeMap<PropertyId, StoredPropertyValue<Hashed, EntityId, Nonce>>,
    ) {
        self.values = new_values;
    }

    /// Get mutable `EntityPermissions` reference, related to given `Entity`
    pub fn get_permissions_mut(&mut self) -> &mut EntityPermissions<MemberId> {
        &mut self.entity_permissions
    }

    /// Get `EntityPermissions` reference, related to given `Entity`
    pub fn get_permissions_ref(&self) -> &EntityPermissions<MemberId> {
        &self.entity_permissions
    }

    /// Get `EntityPermissions`, related to given `Entity` by value
    pub fn get_permissions(self) -> EntityPermissions<MemberId> {
        self.entity_permissions
    }

    /// Update existing `EntityPermissions` with newly provided
    pub fn update_permissions(&mut self, permissions: EntityPermissions<MemberId>) {
        self.entity_permissions = permissions
    }

    /// Ensure `Schema` under given id is not added to given `Entity` yet
    pub fn ensure_schema_id_is_not_added<T: Config>(
        &self,
        schema_id: SchemaId,
    ) -> Result<(), Error<T>> {
        let schema_not_added = !self.supported_schemas.contains(&schema_id);
        ensure!(schema_not_added, Error::<T>::SchemaAlreadyAddedToTheEntity);
        Ok(())
    }

    /// Ensure provided `property_values` are not added to the `Entity` `values` map yet
    pub fn ensure_property_values_are_not_added<T: Config>(
        &self,
        property_values: &BTreeMap<PropertyId, InputPropertyValue<T>>,
    ) -> Result<(), Error<T>> {
        ensure!(
            property_values
                .keys()
                .all(|key| !self.values.contains_key(key)),
            Error::<T>::EntityAlreadyContainsGivenPropertyId
        );
        Ok(())
    }

    /// Ensure InputPropertyValue under given `in_class_schema_property_id` is Vector
    pub fn ensure_property_value_is_vec<T: Config>(
        &self,
        in_class_schema_property_id: PropertyId,
    ) -> Result<VecStoredPropertyValue<Hashed, EntityId, Nonce>, Error<T>> {
        self.values
            .get(&in_class_schema_property_id)
            // Throw an error if a property was not found on entity
            // by an in-class index of a property.
            .ok_or(Error::<T>::UnknownEntityPropertyId)?
            .as_vec_property_value()
            .cloned()
            // Ensure prop value under given class schema property id is vector
            .ok_or(Error::<T>::PropertyValueUnderGivenIndexIsNotAVector)
    }

    /// Ensure any `InputPropertyValue` from external entity does not point to the given `Entity`
    pub fn ensure_rc_is_zero<T: Config>(&self) -> Result<(), Error<T>> {
        ensure!(
            self.reference_counter.is_total_equal_to_zero(),
            Error::<T>::EntityRcDoesNotEqualToZero
        );
        Ok(())
    }

    /// Ensure any inbound `InputPropertyValue` with `same_owner` flag set points to the given `Entity`
    pub fn ensure_inbound_same_owner_rc_is_zero<T: Config>(&self) -> Result<(), Error<T>> {
        ensure!(
            self.reference_counter.is_same_owner_equal_to_zero(),
            Error::<T>::EntityInboundSameOwnerRcDoesNotEqualToZero
        );
        Ok(())
    }

    /// Get mutable reference to the `Entity`'s `InboundReferenceCounter` instance
    pub fn get_reference_counter_mut(&mut self) -> &mut InboundReferenceCounter {
        &mut self.reference_counter
    }
}

/// Structure, respresenting inbound entity rcs for each `Entity`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Copy)]
pub struct InboundReferenceCounter {
    /// Total number of inbound references from another entities
    pub total: u32,
    /// Number of inbound references from another entities with `SameOwner` flag set
    pub same_owner: u32,
}

impl InboundReferenceCounter {
    /// Create simple `InboundReferenceCounter` instance, based on `same_owner` flag provided
    pub fn new(reference_counter: u32, same_owner: bool) -> Self {
        if same_owner {
            Self {
                total: reference_counter,
                same_owner: reference_counter,
            }
        } else {
            Self {
                total: reference_counter,
                same_owner: 0,
            }
        }
    }

    /// Check if `total` is equal to zero
    pub fn is_total_equal_to_zero(self) -> bool {
        self.total == 0
    }

    /// Check if `same_owner` is equal to zero
    pub fn is_same_owner_equal_to_zero(self) -> bool {
        self.same_owner == 0
    }
}
