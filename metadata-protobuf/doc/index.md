# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [proto/Council.proto](#proto/Council.proto)
    - [CouncilCandidacyNoteMetadata](#.CouncilCandidacyNoteMetadata)
  
- [proto/Membership.proto](#proto/Membership.proto)
    - [MembershipMetadata](#.MembershipMetadata)
  
- [proto/WorkingGroups.proto](#proto/WorkingGroups.proto)
    - [ApplicationMetadata](#.ApplicationMetadata)
    - [OpeningMetadata](#.OpeningMetadata)
    - [OpeningMetadata.ApplicationFormQuestion](#.OpeningMetadata.ApplicationFormQuestion)
    - [WorkingGroupStatusMetadata](#.WorkingGroupStatusMetadata)
  
    - [OpeningMetadata.ApplicationFormQuestion.InputType](#.OpeningMetadata.ApplicationFormQuestion.InputType)
  
- [Scalar Value Types](#scalar-value-types)



<a name="proto/Council.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Council.proto



<a name=".CouncilCandidacyNoteMetadata"></a>

### CouncilCandidacyNoteMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| header | [string](#string) | optional |  |
| bullet_points | [string](#string) | repeated |  |
| cover_image | [string](#string) | optional |  |
| description | [string](#string) | optional |  |





 

 

 

 



<a name="proto/Membership.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Membership.proto



<a name=".MembershipMetadata"></a>

### MembershipMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [string](#string) | optional |  |
| avatar_uri | [string](#string) | optional |  |
| about | [string](#string) | optional |  |





 

 

 

 



<a name="proto/WorkingGroups.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/WorkingGroups.proto



<a name=".ApplicationMetadata"></a>

### ApplicationMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| answers | [string](#string) | repeated |  |






<a name=".OpeningMetadata"></a>

### OpeningMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| short_description | [string](#string) | required |  |
| description | [string](#string) | required |  |
| hiring_limit | [uint32](#uint32) | required |  |
| expected_duration | [uint32](#uint32) | required |  |
| application_details | [string](#string) | required |  |
| application_form_questions | [OpeningMetadata.ApplicationFormQuestion](#OpeningMetadata.ApplicationFormQuestion) | repeated |  |






<a name=".OpeningMetadata.ApplicationFormQuestion"></a>

### OpeningMetadata.ApplicationFormQuestion



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| question | [string](#string) | required |  |
| type | [OpeningMetadata.ApplicationFormQuestion.InputType](#OpeningMetadata.ApplicationFormQuestion.InputType) | required |  |






<a name=".WorkingGroupStatusMetadata"></a>

### WorkingGroupStatusMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| description | [string](#string) | optional |  |
| about | [string](#string) | optional |  |
| status | [string](#string) | optional | Can also be an enum if we only want a limited set |
| status_message | [string](#string) | optional |  |





 


<a name=".OpeningMetadata.ApplicationFormQuestion.InputType"></a>

### OpeningMetadata.ApplicationFormQuestion.InputType


| Name | Number | Description |
| ---- | ------ | ----------- |
| TEXT | 1 |  |
| TEXTAREA | 2 |  |


 

 

 



## Scalar Value Types

| .proto Type | Notes | C++ | Java | Python | Go | C# | PHP | Ruby |
| ----------- | ----- | --- | ---- | ------ | -- | -- | --- | ---- |
| <a name="double" /> double |  | double | double | float | float64 | double | float | Float |
| <a name="float" /> float |  | float | float | float | float32 | float | float | Float |
| <a name="int32" /> int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="int64" /> int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="uint32" /> uint32 | Uses variable-length encoding. | uint32 | int | int/long | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="uint64" /> uint64 | Uses variable-length encoding. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum or Fixnum (as required) |
| <a name="sint32" /> sint32 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sint64" /> sint64 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="fixed32" /> fixed32 | Always four bytes. More efficient than uint32 if values are often greater than 2^28. | uint32 | int | int | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="fixed64" /> fixed64 | Always eight bytes. More efficient than uint64 if values are often greater than 2^56. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum |
| <a name="sfixed32" /> sfixed32 | Always four bytes. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sfixed64" /> sfixed64 | Always eight bytes. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="bool" /> bool |  | bool | boolean | boolean | bool | bool | boolean | TrueClass/FalseClass |
| <a name="string" /> string | A string must always contain UTF-8 encoded or 7-bit ASCII text. | string | String | str/unicode | string | string | string | String (UTF-8) |
| <a name="bytes" /> bytes | May contain any arbitrary sequence of bytes. | string | ByteString | str | []byte | ByteString | string | String (ASCII-8BIT) |

<!-- 
    This extra documentation will be appended to the generated docs.
-->

## Referencing Assets
<a name=".Assets"></a>

Applications that process messages that contain a `uint32` field that references an asset such as a cover photo or video, should interpret this value as a zero based index into an array/vector that is received external (out of band) to the protobuf message.

Example in context of query-node processing the runtime event `VideoCreated`

```rust
// Runtime event associated with creating a Video
VideoCreated(video_id: VideoId, video: Video, assets: Vec<NewAsset>, params: VideoCreationParameters)

struct VideoCreationParameters {
  in_category: VideoCategoryId,
  // binary serialized VideoMetadata protobuf message
  meta: Vec<u8>,
}

// suppose assets is a vector of two elements. This is the "out of band" array being referenced by the VideoMetadata message
assets = [
    NewAsset::Uri("https://mydomain.net/thumbnail.png"),
    NewAsset::Upload({
       content_id,
       ipfs_hash,
       size,
       ...
    }),
];

meta = VideoMetadata {
    ...
    // refers to second element: assets[1] which is being uploaded to the storage system
    video: 1,
    // refers to the first element assets[0] which is being referneced by a url string.
    thumbnail_photo: 0,
    ...
};
```