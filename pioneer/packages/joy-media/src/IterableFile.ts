// Based on
// https://gist.github.com/grishgrigoryan/bf6222d16d72cb28620399d27e83eb22

interface IConfig{
    chunkSize:number
}

const DEFAULT_CHUNK_SIZE : number = 64 * 1024; // 64K

export class IterableFile implements AsyncIterable<Buffer>{
    private reader: FileReader;
    private file: File
    private config: IConfig = { chunkSize : DEFAULT_CHUNK_SIZE }

    constructor(file: File, config :Partial<IConfig> = {}) {
        this.file = file
        this.reader = new FileReader();
        Object.assign(this.config, config)
    }

    [Symbol.asyncIterator]() {
        return this.readFile();
    }

    get chunkSize() {
        return this.config.chunkSize;
    }

    get fileSize() {
        return this.file.size;
    }

    readBlobAsBuffer(blob: Blob) : Promise<Buffer>{
        return new Promise((resolve,reject)=>{
            this.reader.onload = (e:any)=>{
                e.target.result && resolve(Buffer.from(e.target.result));
                e.target.error && reject(e.target.error);
            };
            this.reader.readAsArrayBuffer(blob);
        })
    }

    async* readFile() {
        let offset = 0;
        let blob;
        let result;

        while (offset < this.fileSize) {
            blob = this.file.slice(offset, this.chunkSize + offset);
            result = await this.readBlobAsBuffer(blob);
            offset += result.length;
            yield result;
        }
    }
}

// Usage:
//  let iterableFile = new IterableFile(file)
//  for await (const chunk: Buffer of iterableFile) {
//      doSomethingWithBuffer(chunk)
//  }