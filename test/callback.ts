/* eslint-disable func-names */

// tslint:disable no-implicit-dependencies
import * as ShioriJK from "shiorijk";
import * as assert from "assert";
import { OK, wrapRequestCallback, wrapRequestStringCallback } from "../lib/shiori-request-helper";

// tslint:disable no-null-keyword no-magic-numbers

const request3obj = new ShioriJK.Message.Request({ request_line: { version: "3.0", method: "GET" } });
const request3 = request3obj.toString();
const request2 = new ShioriJK.Message.Request({ request_line: { version: "2.6", method: "GET Sentence" } }).toString();

describe("wrapRequestCallback", () => {
  describe("request acceptance", () => {
    context("SHIORI/3.x", () => {
      it("causes OK", async () =>
        assert.strictEqual((await wrapRequestCallback(() => 1)(request3)).status_line.code, 200));
    });

    context("SHIORI/2.x", () => {
      it("causes Bad Request", async () =>
        assert.strictEqual((await wrapRequestCallback(() => 1)(request2)).status_line.code, 400));
    });

    context("invalid request", () => {
      it("causes Bad Request", async () =>
        assert.strictEqual((await wrapRequestCallback(() => 1)("foo")).status_line.code, 400));
    });

    context("SHIORI/3.x object", () => {
      it("causes OK", async () =>
        assert.strictEqual((await wrapRequestCallback(() => 1)(request3obj)).status_line.code, 200));
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
      void: () => {},
      error: () => {
        throw new Error();
      },
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
      void: async () => {},
      error: async () => {
        throw new Error();
      },
      response: async () => OK("res"),
    };

    function describeCallbacks(type: "sync" | "async", callbacks: typeof syncCallbacks | typeof asyncCallbacks) {
      describe(`${type} callback`, function() {
        it("accepts string value", async () =>
          assert.strictEqual((await wrapRequestCallback(callbacks.string)(request3)).headers.get("Value"), "str"));
        it("accepts empty string value", async () =>
          assert.strictEqual((await wrapRequestCallback(callbacks.emptyString)(request3)).status_line.code, 204));
        it("accepts number value", async () =>
          assert.strictEqual((await wrapRequestCallback(callbacks.number)(request3)).headers.get("Value"), "42"));
        it("accepts zero number value", async () =>
          assert.strictEqual((await wrapRequestCallback(callbacks.zeroNumber)(request3)).headers.get("Value"), "0"));
        it("accepts null value", async () =>
          assert.strictEqual(
            // tslint:disable-next-line no-any
            (await wrapRequestCallback(callbacks.null as any)(request3)).status_line.code,
            204,
          ));
        it("accepts undefined value", async () =>
          assert.strictEqual((await wrapRequestCallback(callbacks.undefined)(request3)).status_line.code, 204));
        it("accepts void", async () =>
          assert.strictEqual((await wrapRequestCallback(callbacks.void)(request3)).status_line.code, 204));
        it("accepts error", async () =>
          assert.strictEqual((await wrapRequestCallback(callbacks.error)(request3)).status_line.code, 500));
        it("accepts response", async () =>
          assert.deepStrictEqual(
            new ShioriJK.Message.Response({
              status_line: { version: "3.0", code: 200 },
              headers: {
                Value: "res",
              },
            }),
            await wrapRequestCallback(callbacks.response)(request3),
          ));
      });
    }
    describeCallbacks("sync", syncCallbacks);
    describeCallbacks("async", asyncCallbacks);
  });

  describe("defaultHeaders", function() {
    context("no default headers", function() {
      it("is same", async () =>
        assert.deepStrictEqual({ Value: "1" }, (await wrapRequestCallback(() => 1)(request3)).headers.header));
    });
    context("with default headers", function() {
      context("no same headers in return value", () => {
        const defaultHeaders = { To: "sakura" };
        it("appended", async () =>
          assert.deepStrictEqual(
            { Value: "1", To: "sakura" },
            (await wrapRequestCallback(() => 1, defaultHeaders)(request3)).headers.header,
          ));
      });
      context("same headers exist in return value", () => {
        const defaultHeaders = { Value: "sakura" };
        it("is not overwrited", async () =>
          assert.deepStrictEqual(
            { Value: "1" },
            (await wrapRequestCallback(() => 1, defaultHeaders)(request3)).headers.header,
          ));
      });
      describe("rewrite", () => {
        it("changes response", async () => {
          const defaultHeaders = { Charset: "Shift_JIS" };
          const callback = wrapRequestCallback(() => 1, defaultHeaders);
          assert.deepStrictEqual({ Value: "1", Charset: "Shift_JIS" }, (await callback(request3)).headers.header);
          defaultHeaders.Charset = "UTF-8";
          assert.deepStrictEqual({ Value: "1", Charset: "UTF-8" }, (await callback(request3)).headers.header);
        });
      });
    });
  });
});

describe("wrapRequestStringCallback", () => {
  const callback = () => 1;

  it("same response as wrapRequestCallback", async () =>
    assert.strictEqual(
      (await wrapRequestCallback(callback)(request3)).toString(),
      await wrapRequestStringCallback(callback)(request3),
    ));
});
