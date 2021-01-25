# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [proto/Channel.proto](#proto/Channel.proto)
    - [ChannelMetadata](#.ChannelMetadata)
  
- [proto/Video.proto](#proto/Video.proto)
    - [License](#.License)
    - [MediaType](#.MediaType)
    - [PublishedBeforeJoystream](#.PublishedBeforeJoystream)
    - [VideoMetadata](#.VideoMetadata)
  
- [Scalar Value Types](#scalar-value-types)



<a name="proto/Channel.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Channel.proto



<a name=".ChannelMetadata"></a>

### ChannelMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| title | [string](#string) | optional |  |
| description | [string](#string) | optional |  |
| is_public | [bool](#bool) | optional |  |
| language | [int32](#int32) | optional |  |





 

 

 

 



<a name="proto/Video.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## proto/Video.proto



<a name=".License"></a>

### License
Joystream Specific License type


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| code | [int32](#int32) | optional | License code defined by Joystream |
| attribution | [string](#string) | optional | Text for licenses that require an attribution |
| custom_text | [string](#string) | optional | Text for custom license type |






<a name=".MediaType"></a>

### MediaType
Rich format description of video media type

enum AVCodecID from FFmpeg: libavcodec/codec_id.h
optional int32 codec_id = 1;


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| codec_name | [string](#string) | optional | string name field from FFmpeg libavcodec/codec_desc.c |
| container | [string](#string) | optional | Video container format (eg. &#39;MP4&#39;, &#39;WebM&#39;, &#39;Ogg&#39; ...) https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs |
| mime_media_type | [string](#string) | optional | MIME Media Type https://www.iana.org/assignments/media-types/media-types.xhtml#video eg. &#39;video/mp4&#39; |






<a name=".PublishedBeforeJoystream"></a>

### PublishedBeforeJoystream



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| is_published | [bool](#bool) | optional |  |
| timestamp | [uint32](#uint32) | optional |  |






<a name=".VideoMetadata"></a>

### VideoMetadata



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| title | [string](#string) | optional |  |
| description | [string](#string) | optional |  |
| duration | [int32](#int32) | optional | Duration in seconds of the video |
| media_pixel_height | [int32](#int32) | optional | Resolution of the video |
| media_pixel_width | [int32](#int32) | optional |  |
| media_type | [MediaType](#MediaType) | optional | Rich media type information about the media format |
| language | [string](#string) | optional | ISO_639-1 code: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes useful: npm package https://www.npmjs.com/package/iso-639-1 |
| license | [License](#License) | optional | License type for the media |
| published_before_joystream | [PublishedBeforeJoystream](#PublishedBeforeJoystream) | optional |  |
| has_marketing | [bool](#bool) | optional | Set to true if video has marketing/adverts in the stream |
| is_public | [bool](#bool) | optional | Set to true if it should be visiable to public |
| is_explicit | [bool](#bool) | optional | Set to true if video has explicit language or scenes Should this be a curator managed property instead? |





 

 

 

 



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

