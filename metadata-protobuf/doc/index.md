# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [proto/Channel.proto](#proto/Channel.proto)
    - [ChannelCategoryMetadata](#.ChannelCategoryMetadata)
    - [ChannelMetadata](#.ChannelMetadata)
  
- [proto/Person.proto](#proto/Person.proto)
    - [PersonMetadata](#.PersonMetadata)
  
- [proto/Playlist.proto](#proto/Playlist.proto)
    - [PlaylistMetadata](#.PlaylistMetadata)
  
- [proto/Series.proto](#proto/Series.proto)
    - [SeasonMetadata](#.SeasonMetadata)
    - [SeriesMetadata](#.SeriesMetadata)
  
- [proto/Storage.proto](#proto/Storage.proto)
    - [DistributionBucketFamilyMetadata](#.DistributionBucketFamilyMetadata)
    - [DistributionBucketOperatorMetadata](#.DistributionBucketOperatorMetadata)
    - [GeoCoordiantes](#.GeoCoordiantes)
    - [NodeLocationMetadata](#.NodeLocationMetadata)
    - [StorageBucketOperatorMetadata](#.StorageBucketOperatorMetadata)
  
- [proto/Video.proto](#proto/Video.proto)
    - [License](#.License)
    - [MediaType](#.MediaType)
    - [PublishedBeforeJoystream](#.PublishedBeforeJoystream)
    - [VideoCategoryMetadata](#.VideoCategoryMetadata)
    - [VideoMetadata](#.VideoMetadata)
  
- [Scalar Value Types](#scalar-value-types)



<a name="proto/Channel.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Channel.proto



<a name=".ChannelCategoryMetadata"></a>

### ChannelCategoryMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [string](#string) | optional | Category Name |






<a name=".ChannelMetadata"></a>

### ChannelMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| title | [string](#string) | optional | Channel Title |
| description | [string](#string) | optional | Channel Description |
| is_public | [bool](#bool) | optional | Wether to display channel to the public |
| language | [string](#string) | optional | ISO_639-1 Language [Code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) |
| cover_photo | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |
| avatar_photo | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |
| category | [uint64](#uint64) | optional | Channel Category Id |





 

 

 

 



<a name="proto/Person.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Person.proto



<a name=".PersonMetadata"></a>

### PersonMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| first_name | [string](#string) | optional |  |
| middle_name | [string](#string) | optional |  |
| last_name | [string](#string) | optional |  |
| about | [string](#string) | optional |  |
| cover_photo | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |
| avatar_photo | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |





 

 

 

 



<a name="proto/Playlist.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Playlist.proto



<a name=".PlaylistMetadata"></a>

### PlaylistMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| title | [string](#string) | optional |  |
| videos | [uint64](#uint64) | repeated | Videos in the playlist |





 

 

 

 



<a name="proto/Series.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Series.proto



<a name=".SeasonMetadata"></a>

### SeasonMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| title | [string](#string) | optional |  |
| description | [string](#string) | optional |  |
| cover_photo | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |
| persons | [uint64](#uint64) | repeated | Person(s) referenced by PersonId involved in this Season |






<a name=".SeriesMetadata"></a>

### SeriesMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| title | [string](#string) | optional |  |
| description | [string](#string) | optional |  |
| cover_photo | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |
| persons | [uint64](#uint64) | repeated | Person(s) referenced by PersonId involved in this Series |





 

 

 

 



<a name="proto/Storage.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Storage.proto



<a name=".DistributionBucketFamilyMetadata"></a>

### DistributionBucketFamilyMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| region | [string](#string) | optional | ID / name of the region covered by the distribution family (ie. us-east-1). Should be unique. |
| description | [string](#string) | optional | Additional, more specific description of the region |
| boundary | [GeoCoordiantes](#GeoCoordiantes) | repeated | Geographical boundary of the region, defined as polygon through array of coordinates (providing [{}] will unset the current value) |






<a name=".DistributionBucketOperatorMetadata"></a>

### DistributionBucketOperatorMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| endpoint | [string](#string) | optional | Root distribution node endpoint (ie. https://example.com/distribution) |
| location | [NodeLocationMetadata](#NodeLocationMetadata) | optional | Information about node&#39;s phisical location (providing {} will unset current value) |
| extra | [string](#string) | optional | Additional information about the node / node operator |






<a name=".GeoCoordiantes"></a>

### GeoCoordiantes



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| latitude | [float](#float) | optional |  |
| longitude | [float](#float) | optional |  |






<a name=".NodeLocationMetadata"></a>

### NodeLocationMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| country_code | [string](#string) | optional | ISO 3166-1 alpha-2 country code (2 letters) |
| city | [string](#string) | optional | City name |
| coordinates | [GeoCoordiantes](#GeoCoordiantes) | optional | Geographic coordinates (providing {} will unset current value) |






<a name=".StorageBucketOperatorMetadata"></a>

### StorageBucketOperatorMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| endpoint | [string](#string) | optional | Root storage node endpoint (ie. https://example.com/storage) |
| location | [NodeLocationMetadata](#NodeLocationMetadata) | optional | Information about node&#39;s phisical location (providing {} will unset current value) |
| extra | [string](#string) | optional | Additional information about the node / node operator |





 

 

 

 



<a name="proto/Video.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Video.proto



<a name=".License"></a>

### License
License types defined by Joystream


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| code | [uint32](#uint32) | optional | License code defined by Joystream. [reference](../src/KnownLicenses.json) |
| attribution | [string](#string) | optional | Text for licenses that require an attribution |
| custom_text | [string](#string) | optional | Text for custom license type |






<a name=".MediaType"></a>

### MediaType
Codec, Container, MIME media-type information


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| codec_name | [string](#string) | optional | Codec corresponding to `name` field from [FFmpeg](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/codec_desc.c) |
| container | [string](#string) | optional | Video container format, eg. &#39;MP4&#39;, &#39;WebM&#39;, &#39;Ogg&#39; [ref](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs) |
| mime_media_type | [string](#string) | optional | MIME Media Type, eg. &#39;video/mp4&#39; [ref](https://www.iana.org/assignments/media-types/media-types.xhtml#video) |






<a name=".PublishedBeforeJoystream"></a>

### PublishedBeforeJoystream
Publication status before joystream


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| is_published | [bool](#bool) | optional | Was video published before joystream platform |
| date | [string](#string) | optional | Date of publication: &#39;YYYY-MM-DD&#39; [ISO-8601](https://www.iso.org/iso-8601-date-and-time-format.html) |






<a name=".VideoCategoryMetadata"></a>

### VideoCategoryMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [string](#string) | optional | Category name |






<a name=".VideoMetadata"></a>

### VideoMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| title | [string](#string) | optional | Video Title |
| description | [string](#string) | optional | Video Description |
| video | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |
| thumbnail_photo | [uint32](#uint32) | optional | index into external [assets array](#.Assets) |
| duration | [uint32](#uint32) | optional | Lengths of video in seconds |
| media_pixel_height | [uint32](#uint32) | optional | Resolution of the video (Height) |
| media_pixel_width | [uint32](#uint32) | optional | Resolution of the video (Width) |
| media_type | [MediaType](#MediaType) | optional | Encoding and Container format used |
| language | [string](#string) | optional | ISO_639-1 Language [Code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) |
| license | [License](#License) | optional | License type for the media |
| published_before_joystream | [PublishedBeforeJoystream](#PublishedBeforeJoystream) | optional | Date of publication |
| has_marketing | [bool](#bool) | optional | Does video have marketing or advertising in the stream |
| is_public | [bool](#bool) | optional | Should video be publicy visible yet |
| is_explicit | [bool](#bool) | optional | Does Video have explicit language or scenes |
| persons | [uint64](#uint64) | repeated | Person(s) referenced by PersonId involved in this video |
| category | [uint64](#uint64) | optional | Video Category Id |





 

 

 

 



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