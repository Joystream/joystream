/* global api, hashing, keyring, types, util, joy */

// run this script with:
// yarn script initNewContentDir
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js

const script = async ({ api, keyring }) => {
  // Get sudo addr
  const sudoAddress = (await api.query.sudo.key()).toString()
  let sudo
  if (typeof window === 'undefined') {
    // In node, get the keyPair if the keyring was provided
    sudo = keyring.getPair(sudoAddress)
  } else {
    // Pioneer: let the UI Signer handle it
    sudo = sudoAddress
  }

  let nonce = (await api.query.system.account(sudoAddress)).nonce.toNumber()

  const NEW_OPENING_ID = await api.query.contentDirectoryWorkingGroup.nextOpeningId()
  const NEW_CLASS_ID = await api.query.contentDirectory.nextClassId()
  const ALICE_MEMBER_ID = 0 // We assume it exists

  const sudoCall = (tx) => api.tx.sudo.sudo(tx).signAndSend(sudo, { nonce: nonce++ })

  // Create curator lead opening
  await sudoCall(
    api.tx.contentDirectoryWorkingGroup.addOpening(
      { CurrentBlock: null }, // activate_at
      { commitment: { max_review_period_length: 9999 } }, // OpeningPolicyCommitment
      'api-examples curator opening', // human_readable_text
      { Leader: null } // opening_type
    )
  )

  // Apply to lead opening
  await api.tx.contentDirectoryWorkingGroup
    .applyOnOpening(
      ALICE_MEMBER_ID, // member id
      NEW_OPENING_ID, // opening id
      sudoAddress, // address
      null, // opt role stake
      null, // opt appl. stake
      'api-examples curator opening appl.' // human_readable_text
    )
    .signAndSend(sudo, { nonce: nonce++ })

  // Begin review period
  await sudoCall(api.tx.contentDirectoryWorkingGroup.beginApplicantReview(NEW_OPENING_ID))

  // Fill opening
  await sudoCall(
    api.tx.contentDirectoryWorkingGroup.fillOpening(
      NEW_OPENING_ID, // opening id
      [ALICE_MEMBER_ID], // succesful applicants
      null // reward policy
    )
  )

  // Create person class
  await api.tx.contentDirectory
    .createClass(
      'Person',
      'A class describing a person',
      // ClassPermissions
      {
        any_member: true,
        entity_creation_blocked: false,
        all_entity_property_values_locked: false,
        maintainers: [],
      },
      10, // maximum_entities_count
      5 // default_entity_creation_voucher_upper_bound
    )
    .signAndSend(sudo, { nonce: nonce++ })

  // Add schema to person class
  await api.tx.contentDirectory
    .addClassSchema(
      NEW_CLASS_ID,
      [], // existing_properties
      // new_properties:
      [
        {
          property_type: { Single: { Text: 64 } },
          required: true,
          unique: false,
          name: 'firstname',
          description: "Person's first name",
          locking_policy: { is_locked_from_maintainer: false, is_locked_from_controller: false },
        },
        {
          property_type: { Single: { Text: 64 } },
          required: true,
          unique: false,
          name: 'lastname',
          description: "Person's last name",
          locking_policy: { is_locked_from_maintainer: false, is_locked_from_controller: false },
        },
        {
          property_type: { Single: { Uint16: null } },
          required: true,
          unique: false,
          name: 'age',
          description: "Person's age",
          locking_policy: { is_locked_from_maintainer: false, is_locked_from_controller: false },
        },
        {
          property_type: { Vector: { vec_type: { Text: 32 }, max_length: 10 } },
          required: false,
          unique: false,
          name: 'hobbys',
          description: "Person's hobbys",
          locking_policy: { is_locked_from_maintainer: false, is_locked_from_controller: false },
        },
      ]
    )
    .signAndSend(sudo, { nonce: nonce++ })

  // Add another schema to person class
  await api.tx.contentDirectory
    .addClassSchema(
      NEW_CLASS_ID,
      [0, 1, 2, 3], // This still has to be in the right order (BTreeSet is part of the extrinsic metadata)
      // new_properties:
      [
        {
          property_type: { Single: { Text: 64 } },
          required: true,
          unique: true,
          name: 'uniqueIdentifier',
          description: "Person's unique identifier",
          locking_policy: { is_locked_from_maintainer: false, is_locked_from_controller: false },
        },
      ]
    )
    .signAndSend(sudo, { nonce: nonce++ })

  // Create person entity via "transaction" extrinsic
  await api.tx.contentDirectory
    .transaction(
      { Member: ALICE_MEMBER_ID }, // actor
      // operations:
      [
        { CreateEntity: { class_id: NEW_CLASS_ID } },
        {
          AddSchemaSupportToEntity: {
            entity_id: { InternalEntityJustAdded: 0 },
            schema_id: 1,
            parametrized_property_values: [
              {
                in_class_index: 0,
                value: { InputPropertyValue: { Single: { Text: 'John' } } },
              },
              {
                in_class_index: 1,
                value: { InputPropertyValue: { Single: { Text: 'Doe' } } },
              },
              {
                in_class_index: 2,
                value: { InputPropertyValue: { Single: { Uint16: 20 } } },
              },
              {
                in_class_index: 3,
                value: { InputPropertyValue: { Vector: { Text: ['blockchain', 'cryptocurrencies'] } } },
              },
              {
                in_class_index: 4,
                value: { InputPropertyValue: { Single: { Text: 'john_doe_unique_identifier' } } },
              },
            ],
          },
        },
      ]
    )
    .signAndSend(sudo, { nonce: nonce++ })
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
