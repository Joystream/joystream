# JSON Data Signing

As serializing and deserializing JSON is not deterministic, but may depend
on the order in which keys are added or even the system's collation method,
signing JSON cryptographically is fraught with issues. We circumvent them
by wrapping any JSON to be signed in another JSON object:

* `version` contains the version of the wrapper JSON, currently always `1`.
* `serialized` contains the serialized version of the data, currently this
  will be the base64 encoded, serialized JSON payload.
* `signature` contains the base64 encoded signature of the `serialized` field
  value prior to its base64 encoding.
* `payload` [optional] contains the deserialized JSON object corresponding
  to the `serialized` payload.

#### Signing Process

Given some structured data:

1. Serialize the structured data into a JSON string.
1. Create a signature over the serialized JSON string.
1. Create a new structured data with the appropriate `version` field.
1. Add a base64 encoded version of the serialized JSON string as the `serialized` field.
1. Add a base64 encoded version of the signature as the `signature` field.
1. Optionally add the original structured data as the `payload` field.

#### Verification Process

1. Verify data contains a `version`, `serialized` and `signature` field.
1. Currently, verify that the `version` field's value is `1`.
1. Try to base64 decode the `serialized` and `signature` fields.
1. Verify that the decoded `signature` is valid for the decoded `serialized`
  field.
1. JSON deserialize the decoded `serialized` field.
1. Add the resulting structured data as the `payload` field, and return the
  modified object.
