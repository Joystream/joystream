import fs from 'fs'
import { blake2AsHex } from '@polkadot/util-crypto'

type ReplaceLinesInFileParams = {
  filePath: string
  regex: RegExp
  newContent: string
}

export function replaceInFile({ filePath, regex, newContent }: ReplaceLinesInFileParams): void {
  const paramsHash = blake2AsHex(filePath + '|' + regex.source + '|' + newContent)
  const startMark = `/* BEGIN REPLACED CONTENT ${paramsHash} */`
  const endMark = `/* END REPLACED CONTENT ${paramsHash} */`
  const fileContent = fs.readFileSync(filePath).toString()
  if (fileContent.includes(startMark)) {
    return
  }
  fs.writeFileSync(filePath, fileContent.replace(regex, `${startMark}\n${newContent}\n${endMark}`))
}
