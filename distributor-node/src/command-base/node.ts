import axios from 'axios'
import urljoin from 'url-join'
import DefaultCommandBase, { flags } from './default'
import jwt from 'jsonwebtoken'
import ExitCodes from './ExitCodes'

export default abstract class NodeCommandBase extends DefaultCommandBase {
  static flags = {
    url: flags.string({
      char: 'u',
      description: 'Distributor node operator api base url (ie. http://localhost:3335)',
      required: true,
    }),
    secret: flags.string({
      char: 's',
      description: 'HMAC secret key to use (will default to config.operatorApi.hmacSecret if present)',
      required: false,
    }),
    ...DefaultCommandBase.flags,
  }

  protected abstract reqUrl(): string

  protected reqBody(): Record<string, unknown> {
    return {}
  }

  async run(): Promise<void> {
    const { url, secret } = this.parse(this.constructor as typeof NodeCommandBase).flags

    const hmacSecret = secret || this.appConfig.operatorApi?.hmacSecret

    if (!hmacSecret) {
      this.error('No --secret was provided and no config.operatorApi.hmacSecret is set!', {
        exit: ExitCodes.InvalidInput,
      })
    }

    const reqUrl = this.reqUrl()
    const reqBody = this.reqBody()
    const payload = { reqUrl, reqBody }
    try {
      await axios.post(urljoin(url, reqUrl), reqBody, {
        headers: {
          authorization: `bearer ${jwt.sign(payload, hmacSecret, { expiresIn: 60 })}`,
        },
      })
      this.log('Request successful')
    } catch (e) {
      if (axios.isAxiosError(e)) {
        this.error(`Request failed: ${e.response ? JSON.stringify(e.response.data) : e.message}`, {
          exit: ExitCodes.ApiError,
        })
      }
      this.error(e instanceof Error ? e.message : JSON.stringify(e), { exit: ExitCodes.ApiError })
    }
  }
}
