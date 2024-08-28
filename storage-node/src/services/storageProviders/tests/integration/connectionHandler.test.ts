import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { AwsConnectionHandler } from '../../awsConnectionHandler'
import { readFileSync } from 'fs'
import { expect, beforeAll, afterAll } from '@jest/globals'
import path from 'path'

const awsOptions = {
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'us-east-1',
  bucketName: 'test-bucket',
}
describe('AwsConnectionHandler', () => {
  let s3Client: S3Client
  let awsConnectionHandler: AwsConnectionHandler

  beforeAll(() => {
    s3Client = new S3Client({
      region: awsOptions.region,
      credentials: {
        accessKeyId: awsOptions.accessKeyId,
        secretAccessKey: awsOptions.secretAccessKey,
      },
      forcePathStyle: true,
      tls: false,
      endpoint: 'http://localhost:4566',
    })
    awsConnectionHandler = new AwsConnectionHandler(awsOptions)

    const fs = require('fs')
    const path = require('path')

    // Create testfile.txt
    const testfile1Path = path.join(__dirname, 'testfile.txt')
    fs.writeFileSync(testfile1Path, 'This is the content of testfile.txt')

    // Create testfile2.txt
    const testfile2Path = path.join(__dirname, 'testfile2.txt')
    fs.writeFileSync(testfile2Path, 'This is the content of testfile2.txt')
  })
  afterAll(() => {
    const fs = require('fs')
    const path = require('path')

    // Clean up function to remove test files after tests
    fs.unlinkSync(path.join(__dirname, 'testfile.txt'))
    fs.unlinkSync(path.join(__dirname, 'testfile2.txt'))
  })

  describe('upload file1 flow: upload,uploadExisting,remove', () => {
    it('upload file content correctly', async () => {
      const filePath = path.join(__dirname, 'testfile.txt')
      const key = 'testDir/testfile.txt'

      await awsConnectionHandler.uploadFileToRemoteBucket(key, filePath)

      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: awsOptions.bucketName,
          Key: key,
        })
      )
      expect(Body).toBeDefined()
      const expectedFileContentByteArray = new Uint8Array(readFileSync(filePath))
      const fileContent = await Body?.transformToByteArray()
      expect(fileContent).toEqual(expectedFileContentByteArray)
    })
    it('no op upload if file already exists', async () => {
      const filePath = path.join(__dirname, 'testfile.txt')
      const key = 'testDir/testfile.txt'

      const result = await awsConnectionHandler.uploadFileToRemoteBucketIfNotExists(key, filePath)
      expect(result.alreadyExists).toBe(true)
    })
    it('should remove file successfully', async () => {
      const key = 'testDir/testfile.txt'

      await awsConnectionHandler.removeObject(key)

      try {
        await s3Client.send(
          new HeadObjectCommand({
            Bucket: awsOptions.bucketName,
            Key: key,
          })
        )
      } catch (error) {
        expect(error.$metadata.httpStatusCode).toBe(404)
      }
    })
  })
  describe('upload files flow: upload,uploadExisting,list', () => {
    it('should upload files correctly', async () => {
      const filePath = path.join(__dirname, 'testfile.txt')
      const key = 'testDir/testfile.txt'

      const response = await awsConnectionHandler.uploadFileToRemoteBucketIfNotExists(key, filePath)

      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: awsOptions.bucketName,
          Key: key,
        })
      )

      const expectedFileContentByteArray = new Uint8Array(readFileSync(filePath))
      const fileContent = await Body?.transformToByteArray()
      expect(fileContent).toEqual(expectedFileContentByteArray)
      expect(response.alreadyExists).toBe(false)
    })
    it('should upload other file correctly', async () => {
      const filePath = path.join(__dirname, 'testfile2.txt')
      const key = 'testDir/testfile2.txt'

      await awsConnectionHandler.uploadFileToRemoteBucketIfNotExists(key, filePath)

      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: awsOptions.bucketName,
          Key: key,
        })
      )
      const expectedFileContentByteArray = new Uint8Array(readFileSync(filePath))
      const fileContent = await Body?.transformToByteArray()
      expect(fileContent).toEqual(expectedFileContentByteArray)
    })
    it('should list files correctly', async () => {
      const files = await awsConnectionHandler.listFilesOnRemoteBucket()
      expect(files).toEqual(['testDir/testfile.txt', 'testDir/testfile2.txt'])
    })
  })
})
