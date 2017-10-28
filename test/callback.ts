/// <reference types="mocha" />

// tslint:disable no-implicit-dependencies
import * as ShioriJK from "shiorijk";
import { OK, wrapRequestCallback } from "../lib/shiori-request-helper";

import * as assert from "assert";

// tslint:disable no-null-keyword no-magic-numbers

const request3 = new ShioriJK.Message.Request({request_line: {version: "3.0", method: "GET"}}).toString();
const request2 = new ShioriJK.Message.Request({request_line: {version: "2.6", method: "GET Sentence"}}).toString();

function parseResponse(responseStr: string) {
  return new ShioriJK.Shiori.Response.Parser().parse(responseStr);
}

describe("generateRequestCallback", () => {
  describe("request acceptance", () => {
    context("SHIORI/3.x", () => {
      it("causes OK", async () => assert.equal(
        parseResponse(await wrapRequestCallback(() => 1)(request3)).status_line.code,
        200,
      ));
    });

    context("SHIORI/2.x", () => {
      it("causes Bad Request", async () => assert.equal(
        parseResponse(await wrapRequestCallback(() => 1)(request2)).status_line.code,
        400,
      ));
    });

    context("invalid request", () => {
      it("causes Bad Request", async () => assert.equal(
        parseResponse(await wrapRequestCallback(() => 1)("foo")).status_line.code,
        400,
      ));
    });
  });

  describe("response acceptance", () => {
    const syncCallbacks = {
      string: () => "str",
      emptyString: () => "",
      number: () => 42,
      zeroNumber: () => 0,
      null: () => null,
      undefined: () => undefined,
      // tslint:disable-next-line no-empty
      void: () => { },
      error: () => { throw new Error(); },
      response: () => OK("res"),
    };

    const asyncCallbacks = {
      string: async () => "str",
      emptyString: async () => "",
      number: async () => 42,
      zeroNumber: async () => 0,
      null: async () => null,
      undefined: async () => undefined,
      // tslint:disable-next-line no-empty
      void: async () => { },
      error: async () => { throw new Error(); },
      response: async () => OK("res"),
    };

    function describeCallbacks(type: "sync" | "async", callbacks: typeof syncCallbacks | typeof asyncCallbacks) {
      describe(`${type} callback`, function() {
        it("accepts string value", async () => assert.equal(
          parseResponse(await wrapRequestCallback(callbacks.string)(request3)).headers.get("Value"),
          "str",
        ));
        it("accepts empty string value", async () => assert.equal(
          parseResponse(await wrapRequestCallback(callbacks.emptyString)(request3)).status_line.code,
          204,
        ));
        it("accepts number value", async () => assert.equal(
          parseResponse(await wrapRequestCallback(callbacks.number)(request3)).headers.get("Value"),
          "42",
        ));
        it("accepts zero number value", async () => assert.equal(
          parseResponse(await wrapRequestCallback(callbacks.zeroNumber)(request3)).headers.get("Value"),
          "0",
        ));
        it("accepts null value", async () => assert.equal(
          // tslint:disable-next-line no-any
          parseResponse(await wrapRequestCallback(callbacks.null as any)(request3)).status_line.code,
          204,
        ));
        it("accepts undefined value", async () => assert.equal(
          parseResponse(await wrapRequestCallback(callbacks.undefined)(request3)).status_line.code,
          204,
        ));
        it("accepts void", async () => assert.equal(
          parseResponse(await wrapRequestCallback(callbacks.void)(request3)).status_line.code,
          204,
        ));
        it("accepts error", async () => assert.equal(
          parseResponse(await wrapRequestCallback(callbacks.error)(request3)).status_line.code,
          500,
        ));
        it("accepts response", async () => assert.deepEqual(
          new ShioriJK.Message.Response({
            status_line: {version: "3.0", code: 200},
            headers: {
              Value: "res",
            },
          }),
          parseResponse(await wrapRequestCallback(callbacks.response)(request3)),
        ));
      });
    }
    describeCallbacks("sync", syncCallbacks);
    describeCallbacks("async", asyncCallbacks);
  });

  describe("defaultHeaders", function() {
    context("no default headers", function() {
      it("is same", async () => assert.deepEqual(
        {Value: "1"},
        parseResponse(await wrapRequestCallback(() => 1)(request3)).headers.header),
      );
    });
    context("with default headers", function() {
      context("no same headers in return value", () => {
        const defaultHeaders = {To: "sakura"};
        it("appended", async () => assert.deepEqual(
          {Value: "1", To: "sakura"},
          parseResponse(await wrapRequestCallback(() => 1, defaultHeaders)(request3)).headers.header),
        );
      });
      context("same headers exist in return value", () => {
        const defaultHeaders = {Value: "sakura"};
        it("is not overwrited", async () => assert.deepEqual(
          {Value: "1"},
          parseResponse(await wrapRequestCallback(() => 1, defaultHeaders)(request3)).headers.header),
        );
      });
      describe("rewrite", () => {
        it("changes response", async () => {
          const defaultHeaders = {Charset: "Shift_JIS"};
          const callback = wrapRequestCallback(() => 1, defaultHeaders);
          assert.deepEqual(
            {Value: "1", Charset: "Shift_JIS"},
            parseResponse(await callback(request3)).headers.header,
          );
          defaultHeaders.Charset = "UTF-8";
          assert.deepEqual(
            {Value: "1", Charset: "UTF-8"},
            parseResponse(await callback(request3)).headers.header,
          );
        });
      });
    });
  });
});
