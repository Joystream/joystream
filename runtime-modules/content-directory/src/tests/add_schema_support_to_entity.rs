use super::*;

#[test]
fn add_schema_support_to_entity_success() {
    with_test_externalities(|| {
        // Add entity schemas support
        let (first_entity, second_entity) = add_entity_schemas_support();

        // Ensure supported schemas set and properties of first entity updated succesfully
        assert_eq!(first_entity, entity_by_id(FIRST_ENTITY_ID));

        // Ensure reference counter of second entity updated succesfully
        assert_eq!(second_entity, entity_by_id(SECOND_ENTITY_ID));
    })
}
