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
 * wraps request callback
 * @param requestCallback main request callback
 * @param defaultHeaders default headers
 * @return request callback
 */
export function wrapRequestCallback(requestCallback: RequestCallback, defaultHeaders: Headers = {}) {
  const requestParser = new ShioriJK.Shiori.Request.Parser();

  function buildResponse(response: ShioriJK.Message.Response) {
    const statusLine = response.status_line;
    const headers = response.headers;
    if (!statusLine.version) statusLine.version = "3.0";
    if (!statusLine.code) {
      statusLine.code = // tslint:disable-next-line triple-equals no-null-keyword no-magic-numbers
        headers.header.Value != null && headers.header.Value.toString().length ? 200 : 204;
    }
    for (const name of Object.keys(defaultHeaders)) {
      // tslint:disable-next-line triple-equals no-null-keyword
      if (headers.header[name] == null) headers.header[name] = defaultHeaders[name];
    }

    return response.toString();
  }

  /**
   * SHIORI request()
   * @param requestStr SHIORI Request
   * @return SHIORI Response
   */
  return async function request(requestStr: string | ShioriJK.Message.Request) {
    let _request;
    if (typeof requestStr === "string") {
      try {
        _request = requestParser.parse(requestStr);
      } catch (error) {
        return buildResponse(BadRequest());
      }
    } else {
      _request = requestStr;
    }
    if (/^2/.test(_request.request_line.version as string)) {
      return buildResponse(BadRequest());
    }
    try {
      const response = await requestCallback(_request);
      // tslint:disable-next-line triple-equals no-null-keyword
      if (response == null) {
        return buildResponse(NoContent());
      } else if (typeof response === "string" || typeof response === "number") {
        return buildResponse(OK(response));
      } else {
        return buildResponse(response);
      }
    } catch (error) {
      return buildResponse(InternalServerError());
    }
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
