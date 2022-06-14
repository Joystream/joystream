import { AxiosError, AxiosResponse } from 'axios'

type ParsedAxiosErrorResponse = Pick<AxiosResponse, 'data' | 'status' | 'statusText' | 'headers'>

type ParsedAxiosError = Pick<AxiosError, 'message' | 'stack'> & {
  response?: ParsedAxiosErrorResponse
}

export function parseAxiosError({ message, stack, response }: AxiosError): ParsedAxiosError {
  const parsedError: ParsedAxiosError = {
    message,
    stack,
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
