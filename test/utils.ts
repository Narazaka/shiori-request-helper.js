/// <reference types="mocha" />

// tslint:disable no-implicit-dependencies
import * as assert from "assert";
import * as ShioriJK from "shiorijk";
import { BadRequest, InternalServerError, NoContent, OK, Response } from "../lib/shiori-request-helper";

describe("Response", function() {
  it("works", function() {
    assert.deepEqual(Response(), new ShioriJK.Message.Response());
  });
});

describe("OK", function() {
  context("has value", function() {
    it("works", function() {
      assert.deepEqual(OK("hello"), new ShioriJK.Message.Response({
        status_line: {code: 200},
        headers: {Value: "hello"},
      }));
    });
  });
  context("number value", function() {
    it("works", function() {
      // tslint:disable-next-line no-magic-numbers
      assert.deepEqual(OK(42), new ShioriJK.Message.Response({
        status_line: {code: 200},
        headers: {Value: "42"},
      }));
    });
  });
  context("empty value", function() {
    it("works", function() {
      assert.deepEqual(OK(""), new ShioriJK.Message.Response({
        status_line: {code: 204},
      }));
    });
  });
  context("null value", function() {
    it("works", function() {
      // tslint:disable-next-line no-null-keyword no-any
      assert.deepEqual(OK(null as any), new ShioriJK.Message.Response({
        status_line: {code: 204},
      }));
    });
  });
  context("undefined value", function() {
    it("works", function() {
      assert.deepEqual(OK(undefined), new ShioriJK.Message.Response({
        status_line: {code: 204},
      }));
    });
  });
  context("no value", function() {
    it("works", function() {
      assert.deepEqual(OK(), new ShioriJK.Message.Response({
        status_line: {code: 204},
      }));
    });
  });
});

describe("OK (with to)", function() {
  context("has to value", function() {
    it("works", function() {
      assert.deepEqual(OK("hello", "somebody"), new ShioriJK.Message.Response({
        status_line: {code: 200},
        headers: {Value: "hello", Reference0: "somebody"},
      }));
    });
  });
});

describe("NoContent", function() {
  it("works", function() {
    assert.deepEqual(NoContent(), new ShioriJK.Message.Response({
      status_line: {code: 204},
    }));
  });
});

describe("BadRequest", function() {
  it("works", function() {
    assert.deepEqual(BadRequest(), new ShioriJK.Message.Response({
      status_line: {code: 400},
    }));
  });
});

describe("InternalServerError", function() {
  context("no args", function() {
    it("works", function() {
      assert.deepEqual(InternalServerError(), new ShioriJK.Message.Response({
        status_line: {code: 500},
      }));
    });
  });

  context("with string", function() {
    it("works with single line", function() {
      assert.deepEqual(InternalServerError("error string"), new ShioriJK.Message.Response({
        status_line: {code: 500},
        headers: {
          "X-Shiori-Error": "error string",
        },
      }));
    });

    it("works with multi line", function() {
      assert.deepEqual(InternalServerError("error string\r\nnext line"), new ShioriJK.Message.Response({
        status_line: {code: 500},
        headers: {
          "X-Shiori-Error": "error string\\nnext line",
        },
      }));
    });
  });

  context("with Error", function() {
    it("works with stack", function() {
      const error = new Error("an error\nnext line");
      assert.deepEqual(InternalServerError(error), new ShioriJK.Message.Response({
        status_line: {code: 500},
        headers: {
          "X-Shiori-Error": (error.stack as string).replace(/\r?\n/g, "\\n"),
        },
      }));
    });

    it("works with no stack", function() {
      const error = new Error("an error\nnext line");
      error.stack = undefined;
      assert.deepEqual(InternalServerError(error), new ShioriJK.Message.Response({
        status_line: {code: 500},
        headers: {
          "X-Shiori-Error": "an error\\nnext line",
        },
      }));
    });
  });
});
