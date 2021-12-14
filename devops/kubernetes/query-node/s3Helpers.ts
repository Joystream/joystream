import * as fs from 'fs'
import * as mime from 'mime'

import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

interface FileObject {
  name: string
  path: string
}

export interface FileBucketOpts {
  files: FileObject[]
  policy?: (bucket: aws.s3.Bucket) => pulumi.Output<string>
}

export class FileBucket {
  public readonly bucket: aws.s3.Bucket
  public readonly files: { [key: string]: aws.s3.BucketObject }
  public readonly policy: aws.s3.BucketPolicy | undefined

  private readonly fileContents: { [key: string]: string }

  constructor(bucketName: string, opts: FileBucketOpts) {
    this.bucket = new aws.s3.Bucket(bucketName)
    this.fileContents = {}
    this.files = {}
    for (const file of opts.files) {
      this.fileContents[file.name] = fs.readFileSync(file.path).toString()
      this.files[file.name] = new aws.s3.BucketObject(file.name, {
        bucket: this.bucket,
        source: new pulumi.asset.FileAsset(file.path),
        contentType: mime.getType(file.path) || undefined,
      })
    }

    if (opts.policy !== undefined) {
      // Set the access policy for the bucket so all objects are readable
      this.policy = new aws.s3.BucketPolicy(`bucketPolicy`, {
        bucket: this.bucket.bucket,
        // policy: this.bucket.bucket.apply(publicReadPolicyForBucket)
        policy: opts.policy(this.bucket),
      })
    }
  }

  getUrlForFile(file: string): pulumi.Output<string> {
    if (!(file in this.files)) {
      throw new Error(`Bucket does not have file '${file}'`)
    }

    return pulumi.all([this.bucket.bucketDomainName, this.files[file].id]).apply(([domain, id]) => `${domain}/${id}`)
  }
}

// Create an S3 Bucket Policy to allow public read of all objects in bucket
export function publicReadPolicy(bucket: aws.s3.Bucket): pulumi.Output<string> {
  return bucket.bucket.apply((bucketName) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [
            `arn:aws:s3:::${bucketName}/*`, // policy refers to bucket name explicitly
          ],
        },
      ],
    })
  )
}
