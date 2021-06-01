import * as express from 'express'

export function upload(req: express.Request, res: express.Response): void {
  console.log(req.body)
  console.log(req.files)

  res.json({
    file: 'received',
  })
}
