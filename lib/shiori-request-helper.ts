import * as ShioriJK from "shiorijk";

/** SHIORI request() callback */
export type RequestCallback = (request: ShioriJK.Message.Request) => RequestCallbackReturnValue;

/** SHIORI request() callback return value */
export type RequestCallbackReturnValue =
  Promise<string | number | ShioriJK.Message.Response | void> | string | number | ShioriJK.Message.Response | void;

/** default headers */
export interface Headers {
  [name: string]: string;
}

/**
 * complete response struct
 * @param response response
 * @param defaultHeaders default headers
 */
export function completeResponse(response: ShioriJK.Message.Response, defaultHeaders: Headers = {}) {
  const statusLine = response.status_line;
  const headers = response.headers;
  if (!statusLine.version) statusLine.version = "3.0";
  if (!statusLine.code) {
    const value = headers.header.Value;
    statusLine.code = // tslint:disable-next-line triple-equals no-null-keyword no-magic-numbers
      value != null && value.toString().length ? 200 : 204;
  }
  for (const name of Object.keys(defaultHeaders)) {
    // tslint:disable-next-line triple-equals no-null-keyword
    if (headers.header[name] == null) headers.header[name] = defaultHeaders[name];
  }

  return response;
}

/**
 * generate `completeResponse()` with default headers
 * @param defaultHeaders default headers
 */
export function generateCompleteResponseWithDefault(defaultHeaders: Headers) {
  /**
   * complete response struct with default headers
   * @param response response
   */
  return function completeResponseWithDefault(response: ShioriJK.Message.Response) {
    return completeResponse(response, defaultHeaders);
  };
}

/**
 * handle request with lazy callback return
 * @param requestParser request parser
 * @param completeResponseWithDefault `generateCompleteResponseWithDefault()`
 * @param requestCallback lazy request callback
 * @param requestStr request string
 */
export async function handleRequestLazy(
  requestParser: ShioriJK.Shiori.Request.Parser,
  requestCallback: RequestCallback,
  requestStr: string | ShioriJK.Message.Request,
) {
  let _request;
  if (typeof requestStr === "string") {
    try {
      _request = requestParser.parse(requestStr);
    } catch (error) {
      return BadRequest();
    }
  } else {
    _request = requestStr;
  }
  if (/^2/.test(_request.request_line.version as string)) {
    return BadRequest();
  }
  try {
    const response = await requestCallback(_request);
    // tslint:disable-next-line triple-equals no-null-keyword
    if (response == null) {
      return NoContent();
    } else if (typeof response === "string" || typeof response === "number") {
      return OK(response);
    } else {
      return response;
    }
  } catch (error) {
    return InternalServerError();
  }
}

/**
 * wraps request callback
 * @param requestCallback main request callback
 * @param defaultHeaders default headers
 * @return request callback (returns response object)
 */
export function wrapRequestCallback(requestCallback: RequestCallback, defaultHeaders: Headers = {}) {
  const requestParser = new ShioriJK.Shiori.Request.Parser();
  const completeResponseWithDefault = generateCompleteResponseWithDefault(defaultHeaders);

  /**
   * SHIORI request()
   * @param requestStr SHIORI Request
   * @return SHIORI Response
   */
  return async function request(requestStr: string | ShioriJK.Message.Request) {
    return completeResponseWithDefault(await handleRequestLazy(requestParser, requestCallback, requestStr));
  };
}

/**
 * wraps request callback
 * @param requestCallback main request callback
 * @param defaultHeaders default headers
 * @return request callback (returns response string)
 */
export function wrapRequestStringCallback(requestCallback: RequestCallback, defaultHeaders: Headers = {}) {
  const wrappedCallback = wrapRequestCallback(requestCallback, defaultHeaders);

  // tslint:disable-next-line promise-function-async
  return function request(requestStr: string | ShioriJK.Message.Request) {
    return wrappedCallback(requestStr).then((response) => response.toString());
  };
}

/**
 * empty response struct
 * @return empty SHIORI Response
 */
export function Response() {
  return new ShioriJK.Message.Response();
}

/**
 * normal response (200 OK or 204 No Content)
 * @param value Value header content
 * @param to Reference0 header content (for communication)
 * @return SHIORI Response
 */
export function OK(value?: string | number, to?: string) {
  // tslint:disable-next-line triple-equals no-null-keyword
  const valueStr = value == null ? "" : value.toString();
  if (valueStr.length !== 0) {
    const response = new ShioriJK.Message.Response({
      status_line: { code: 200 },
      headers: { Value: valueStr },
    });
    if (to) response.headers.header.Reference0 = to;

    return response;
  } else {
    return NoContent();
  }
}

/**
 * 204 No Content
 * @return SHIORI Response
 */
export const NoContent = () => new ShioriJK.Message.Response({status_line: {code: 204} });

/**
 * 400 Bad Request
 * @return SHIORI Response
 */
export const BadRequest = () => new ShioriJK.Message.Response({status_line: {code: 400} });

/**
 * 500 Internal Server Error
 * @return SHIORI Response
 */
export const InternalServerError = () => new ShioriJK.Message.Response({status_line: {code: 500} });
