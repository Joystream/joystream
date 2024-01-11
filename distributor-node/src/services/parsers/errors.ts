import { AxiosError, AxiosResponse } from 'axios'

type ParsedAxiosErrorResponse = Pick<AxiosResponse, 'data' | 'status' | 'statusText' | 'headers'>

type ParsedAxiosError = Pick<AxiosError, 'message' | 'stack'> & {
  response?: ParsedAxiosErrorResponse
  requestUrl?: string
}

export function parseAxiosError({ message, stack, response, config }: AxiosError): ParsedAxiosError {
  const parsedError: ParsedAxiosError = {
    message,
    stack,
  }
  if (config) {
    parsedError.requestUrl = config.url
  }
  if (response) {
    const { data, status, statusText, headers } = response
    parsedError.response = {
      data,
      status,
      statusText,
      headers,
    }
  }
  return parsedError
}
