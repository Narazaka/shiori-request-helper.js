# [shiori-request-helper.js](https://github.com/Narazaka/shiori-request-helper.js)

[![Greenkeeper badge](https://badges.greenkeeper.io/Narazaka/shiori-request-helper.js.svg)](https://greenkeeper.io/)

[![npm](https://img.shields.io/npm/v/shiori-request-helper.svg)](https://www.npmjs.com/package/shiori-request-helper)
[![npm license](https://img.shields.io/npm/l/shiori-request-helper.svg)](https://www.npmjs.com/package/shiori-request-helper)
[![npm download total](https://img.shields.io/npm/dt/shiori-request-helper.svg)](https://www.npmjs.com/package/shiori-request-helper)
[![npm download by month](https://img.shields.io/npm/dm/shiori-request-helper.svg)](https://www.npmjs.com/package/shiori-request-helper)

[![Dependency Status](https://david-dm.org/Narazaka/shiori-request-helper.js.svg)](https://david-dm.org/Narazaka/shiori-request-helper.js)
[![devDependency Status](https://david-dm.org/Narazaka/shiori-request-helper.js/dev-status.svg)](https://david-dm.org/Narazaka/shiori-request-helper.js#info=devDependencies)
[![Travis Build Status](https://travis-ci.org/Narazaka/shiori-request-helper.js.svg)](https://travis-ci.org/Narazaka/shiori-request-helper.js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/Narazaka/shiori-request-helper.js?svg=true)](https://ci.appveyor.com/project/Narazaka/shiori-request-helper-js)
[![codecov.io](https://codecov.io/github/Narazaka/shiori-request-helper.js/coverage.svg?branch=master)](https://codecov.io/github/Narazaka/shiori-request-helper.js?branch=master)
[![Code Climate](https://codeclimate.com/github/Narazaka/shiori-request-helper.js/badges/gpa.svg)](https://codeclimate.com/github/Narazaka/shiori-request-helper.js)

Ukagaka SHIORI request() handler wrapper and utilities

## Install

npm:
```
npm install shiori-request-helper
```

## Usage

```typescript
import * as ShioriJK from "shiorijk";
import {
    BadRequest,
    InternalServerError,
    NoContent,
    OK,
    Response,
    wrapRequestCallback,
} from "../lib/shiori-request-helper";

function myRequestCallback(request: ShioriJK.Message.Request) {
    switch (request.headers.ID) {
        case "OnBoot": return "\\h\\s[0]hello.\\e";
        case "OnHoge": return OK("\\h\\s[0]hmm.\\e");
        case "OnComm": return OK("\\h\\s[0]how are you?\\e", "sakura");
        case "OnEmpty": return;
        case "OnFoo": return BadRequest();
        case "OnBar": return InternalServerError();
        default: return NoContent();
    }
}

const defaultHeaders = { Charset: "UTF-8", Sender: "foo" };

export default wrapRequestCallback(myRequestCallback, defaultHeaders);
```

## License

This is released under [MIT License](http://narazaka.net/license/MIT?2017).
