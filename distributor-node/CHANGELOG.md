### 0.1.2
- Fix cache `cache-control: max-age` header for objects served from the filesystem ([`send`](https://www.npmjs.com/package/send) library requires `max-age` to be provided as miliseconds) 

### 0.1.1
- Replace `read-chunk` dependency w/ custom `readFileChunk` implementation in order to fix the issue w/ data object `mime-type` detection (https://github.com/Joystream/joystream/pull/3723)
- Add `version` property to `/status` endpoint result