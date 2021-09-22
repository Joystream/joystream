import { AxiosError } from 'axios'

export function parseAxiosError(e: AxiosError) {
  return {
    message: e.message,
    stack: e.stack,
    response: {
      data: e.response?.data,
      status: e.response?.status,
      statusText: e.response?.statusText,
      headers: e.response?.headers,
    },
  }
}
