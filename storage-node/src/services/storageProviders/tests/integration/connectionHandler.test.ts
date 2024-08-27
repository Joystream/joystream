import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { AwsConnectionHandler } from '../../awsConnectionHandler'
import { readFileSync } from 'fs'
import { expect } from '@jest/globals'
/**
 * @group integration
 * Test 1
 *   Arrange : localstack running with S3 bucket 'test-bucket'
 *   Act: Upload file using AwsConnectionHandler './testfile.txt' to the bucket in 'testDir/testfile.txt'
 *   Assert: using aws api download the file and compare hash for equality
 * Test 2
 *   Arrange : localstack running with S3 bucket 'test-bucket'
 *   Act: Upload file './testfile.txt' to the bucket in 'testDir/testfile.txt'
 *   Assert: using aws api download the file and compare hash for equality
 */

const awsOptions = {
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'us-east-1',
  bucketName: 'test-bucket',
}
describe('AwsConnectionHandler full test suite', () => {
  const s3Client = new S3Client({
    region: awsOptions.region,
    credentials: {
      accessKeyId: awsOptions.accessKeyId,
      secretAccessKey: awsOptions.secretAccessKey,
    },
    forcePathStyle: true,
    tls: false,
    endpoint: 'http://localhost:4566',
  })
  const awsConnectionHandler = new AwsConnectionHandler(awsOptions)

  it('upload file content correctly', async () => {
    const filePath = './testfile.txt'
    const bucketPath = 'testDir/testfile.txt'

    await awsConnectionHandler.uploadFileToRemoteBucket(filePath, bucketPath)

    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: awsOptions.bucketName,
        Key: bucketPath,
      })
    )
    const expectedFileContent = readFileSync(filePath)
    const fileContent = await Body?.transformToByteArray()
    expect(fileContent).toEqual(expectedFileContent)
  })
  it('no op upload if file already exists', async () => {
    const filePath = './testfile.txt'
    const bucketPath = 'testDir/testfile.txt'

    await awsConnectionHandler.uploadFileToRemoteBucket(filePath, bucketPath)
  })
})
