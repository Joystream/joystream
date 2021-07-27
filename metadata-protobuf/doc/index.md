# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [proto/Storage.proto](#proto/Storage.proto)
    - [DistributionBucketFamilyMetadata](#.DistributionBucketFamilyMetadata)
    - [DistributionBucketOperatorMetadata](#.DistributionBucketOperatorMetadata)
    - [GeoCoordiantes](#.GeoCoordiantes)
    - [NodeLocationMetadata](#.NodeLocationMetadata)
    - [StorageBucketOperatorMetadata](#.StorageBucketOperatorMetadata)
  
- [Scalar Value Types](#scalar-value-types)



<a name="proto/Storage.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Storage.proto



<a name=".DistributionBucketFamilyMetadata"></a>

### DistributionBucketFamilyMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| region | [string](#string) | optional | ID / name of the region covered by the distribution family (ie. us-east-1). Should be unique. |
| description | [string](#string) | optional | Additional, more specific description of the region |
| boundary | [GeoCoordiantes](#GeoCoordiantes) | repeated | Geographical boundary of the region, defined as polygon through array of coordinates |






<a name=".DistributionBucketOperatorMetadata"></a>

### DistributionBucketOperatorMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| endpoint | [string](#string) | optional | Root distribution node endpoint (ie. https://example.com/distribution) |
| location | [NodeLocationMetadata](#NodeLocationMetadata) | optional | Information about node&#39;s phisical location |
| extra | [string](#string) | optional | Additional information about the node / node operator |






<a name=".GeoCoordiantes"></a>

### GeoCoordiantes



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| latitude | [float](#float) | required |  |
| longitude | [float](#float) | required |  |






<a name=".NodeLocationMetadata"></a>

### NodeLocationMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| country_code | [string](#string) | optional | ISO 3166-1 alpha-2 country code (2 letters) |
| city | [string](#string) | optional | City name |
| coordinates | [GeoCoordiantes](#GeoCoordiantes) | optional | Geographic coordinates |






<a name=".StorageBucketOperatorMetadata"></a>

### StorageBucketOperatorMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| endpoint | [string](#string) | optional | Root storage node endpoint (ie. https://example.com/storage) |
| location | [NodeLocationMetadata](#NodeLocationMetadata) | optional | Information about node&#39;s phisical location |
| extra | [string](#string) | optional | Additional information about the node / node operator |





 

 

 

 



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

