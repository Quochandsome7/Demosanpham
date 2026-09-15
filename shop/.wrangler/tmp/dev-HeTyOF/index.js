var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-NJVeKN/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-NJVeKN/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout2) => this.#layout = layout2;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(methodName, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) {
            this.#addRoute(methodName, this.#path, handler);
          }
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "_Hono");

// node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class _Node {
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "_Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = /* @__PURE__ */ __name(class _Node2 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "_Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var relaxedCookieNameRegEx = /^[!#-:<>-[\]-~]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = /* @__PURE__ */ __name((value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}, "trimCookieWhitespace");
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !relaxedCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) {
      continue;
    }
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = tryDecodeURIComponent(cookieValue);
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) {
    throw new Error("Invalid cookie name");
  }
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path", "sameSite", "priority"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var generateCookie = /* @__PURE__ */ __name((name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
}, "generateCookie");
var setCookie = /* @__PURE__ */ __name((c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
}, "setCookie");

// src/index.ts
var products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 2899e4,
    originalPrice: 3499e4,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
    description: "iPhone 15 Pro Max v\u1EDBi chip A17 Pro m\u1EA1nh m\u1EBD nh\u1EA5t ch\u1EBF t\xE1c tr\xEAn ti\u1EBFn tr\xECnh 3nm, camera ch\xEDnh 48MP zoom quang h\u1ECDc 5x, khung titan chu\u1EA9n h\xE0ng kh\xF4ng v\u0169 tr\u1EE5 si\xEAu b\u1EC1n nh\u1EB9, m\xE0n h\xECnh Super Retina XDR 6.7 inch ProMotion 120Hz. H\u1ED7 tr\u1EE3 c\u1ED5ng USB-C t\u1ED1c \u0111\u1ED9 cao v\xE0 n\xFAt Action Button ti\u1EC7n l\u1EE3i.",
    category: "\u0110i\u1EC7n tho\u1EA1i",
    rating: 4.9,
    reviews: 2847,
    badge: "B\xE1n ch\u1EA1y",
    chip: "\u26A1 A17 Pro 3nm",
    specs: ["Camera 48MP 5X", "Khung Titan v\u0169 tr\u1EE5", "ProMotion 120Hz"]
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 2599e4,
    originalPrice: 3199e4,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80",
    description: "Samsung Galaxy S24 Ultra trang b\u1ECB chip Snapdragon 8 Gen 3 for Galaxy, quy\u1EC1n n\u0103ng Galaxy AI v\u01B0\u1EE3t tr\u1ED9i, camera 200MP t\xE1i hi\u1EC7n chi ti\u1EBFt s\u1EAFc n\xE9t ngay c\u1EA3 trong b\xF3ng t\u1ED1i, b\xFAt S-Pen quy\u1EC1n n\u0103ng t\xEDch h\u1EE3p b\xEAn trong th\xE2n m\xE1y titan sang tr\u1ECDng, m\xE0n h\xECnh Dynamic AMOLED 2X 6.8 inch 2600 nits.",
    category: "\u0110i\u1EC7n tho\u1EA1i",
    rating: 4.8,
    reviews: 1923,
    badge: "Galaxy AI",
    chip: "\u{1F680} Snapdragon 8 Gen 3",
    specs: ["Camera 200MP AI", "B\xFAt S-Pen t\xEDch h\u1EE3p", "M\xE0n 2600 nits"]
  },
  {
    id: 3,
    name: "MacBook Air M3",
    price: 2749e4,
    originalPrice: 3249e4,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    description: "MacBook Air M3 si\xEAu m\u1ECFng nh\u1EB9 ch\u1EC9 1.24kg, \u0111\u1ED9t ph\xE1 v\u1EDBi chip Apple M3 8-core CPU / 10-core GPU, h\u1ED7 tr\u1EE3 d\xF2 tia t\u1ED1c \u0111\u1ED9 cao b\u1EB1ng ph\u1EA7n c\u1EE9ng v\xE0 Neural Engine 16 l\xF5i x\u1EED l\xFD AI th\xF4ng minh. M\xE0n h\xECnh Liquid Retina 13.6 inch 500 nits v\xE0 th\u1EDDi l\u01B0\u1EE3ng pin huy\u1EC1n tho\u1EA1i l\xEAn t\u1EDBi 18 gi\u1EDD.",
    category: "Laptop",
    rating: 4.7,
    reviews: 1456,
    badge: "M\u1EDBi nh\u1EA5t",
    chip: "\u2728 Apple M3 Chip",
    specs: ["Pin b\u1EC1n 18 gi\u1EDD", "Retina 13.6 inch", "Ch\u1EC9 n\u1EB7ng 1.24kg"]
  },
  {
    id: 4,
    name: "iPad Pro M4",
    price: 2399e4,
    originalPrice: 2899e4,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
    description: "iPad Pro M4 l\xE0 thi\u1EBFt b\u1ECB Apple m\u1ECFng nh\u1EA5t t\u1EEB tr\u01B0\u1EDBc \u0111\u1EBFn nay, trang b\u1ECB m\xE0n h\xECnh c\xF4ng ngh\u1EC7 \u0111\u1ED9t ph\xE1 Ultra Retina XDR Tandem OLED si\xEAu s\xE1ng 1600 nits peak HDR, chip Apple M4 th\u1EBF h\u1EC7 m\u1EDBi cho s\u1EE9c m\u1EA1nh \u0111\u1ED3 h\u1ECDa \u0111\u1EC9nh cao, k\u1EBFt h\u1EE3p ho\xE0n h\u1EA3o c\xF9ng Apple Pencil Pro v\xE0 Magic Keyboard.",
    category: "Tablet",
    rating: 4.8,
    reviews: 987,
    badge: "Si\xEAu m\u1ECFng",
    chip: "\u{1F52E} Apple M4 OLED",
    specs: ["Tandem OLED HDR", "D\xE0y ch\u1EC9 5.1mm", "Apple Pencil Pro"]
  },
  {
    id: 5,
    name: "AirPods Pro 2",
    price: 569e4,
    originalPrice: 679e4,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
    description: "AirPods Pro 2 th\u1EBF h\u1EC7 m\u1EDBi v\u1EDBi chip H2 x\u1EED l\xFD \xE2m thanh th\u1EDDi gian th\u1EF1c, kh\u1EED ti\u1EBFng \u1ED3n ch\u1EE7 \u0111\u1ED9ng ANC g\u1EA5p 2 l\u1EA7n, ch\u1EBF \u0111\u1ED9 Th\xEDch \u1EE9ng Adaptive Audio v\xE0 Nh\u1EADn bi\u1EBFt cu\u1ED9c tr\xF2 chuy\u1EC7n th\xF4ng minh. H\u1ED9p s\u1EA1c chu\u1EA9n USB-C c\xF3 loa \u0111\u1ECBnh v\u1ECB Precision Finding ch\u1ED1ng th\u1EA5t l\u1EA1c.",
    category: "Ph\u1EE5 ki\u1EC7n",
    rating: 4.6,
    reviews: 3241,
    badge: "\xC2m thanh Pro",
    chip: "\u{1F3A7} Apple H2 Audio",
    specs: ["Ch\u1ED1ng \u1ED3n ANC 2X", "Adaptive Sound", "C\u1ED5ng USB-C"]
  },
  {
    id: 6,
    name: "Apple Watch Ultra 2",
    price: 1899e4,
    originalPrice: 2199e4,
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80",
    description: "Apple Watch Ultra 2 ch\u1EBF t\xE1c t\u1EEB v\u1ECF Titan 49mm chu\u1EA9n qu\xE2n \u0111\u1ED9i, m\xE0n h\xECnh s\xE1ng r\u1EF1c r\u1EE1 3000 nits r\xF5 n\xE9t d\u01B0\u1EDBi n\u1EAFng g\u1EAFt, chip SiP S9 m\u1EA1nh m\u1EBD h\u1ED7 tr\u1EE3 c\u1EED ch\u1EC9 ch\u1EA1m hai l\u1EA7n Double Tap k\u1EF3 di\u1EC7u. GPS b\u0103ng t\u1EA7n k\xE9p L1/L5 chu\u1EA9n x\xE1c tuy\u1EC7t \u0111\u1ED1i, l\u1EB7n s\xE2u 40m v\xE0 pin l\xEAn t\u1EDBi 72 gi\u1EDD \u1EDF ch\u1EBF \u0111\u1ED9 ti\u1EBFt ki\u1EC7m.",
    category: "\u0110\u1ED3ng h\u1ED3",
    rating: 4.9,
    reviews: 876,
    badge: "\u0110\u1EC9nh cao",
    chip: "\u{1F9ED} Dual-GPS L1/L5",
    specs: ["V\u1ECF Titan 49mm", "M\xE0n h\xECnh 3000 nits", "Pin t\u1EDBi 72 gi\u1EDD"]
  }
];
var Icons = {
  logo: `<svg class="logo-svg" viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="22" height="22" rx="7" stroke="currentColor"/><rect x="8" y="5" width="12" height="18" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M11 11.5L17 17.5M17 11.5L11 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="14" cy="7.5" r="0.8" fill="currentColor"/></svg>`,
  home: `<svg class="nav-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  cart: `<svg class="nav-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  mapPin: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mail: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  globe: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  eye: `<svg class="action-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  heart: `<svg class="heart-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  heartFilled: `<svg class="heart-svg filled" viewBox="0 0 24 24" width="18" height="18" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  fire: `<svg class="section-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ff6b35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  truck: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  shield: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  refresh: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  check: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  help: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="currentColor"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  box: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`
};
function formatVND(n) {
  return n.toLocaleString("vi-VN") + "\u0111";
}
__name(formatVND, "formatVND");
function discount(original, current) {
  return Math.round((original - current) / original * 100);
}
__name(discount, "discount");
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "\u2605".repeat(full) + (half ? "\xBD" : "") + "\u2606".repeat(empty);
}
__name(renderStars, "renderStars");
function getCart(raw2) {
  if (!raw2)
    return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw2));
    if (Array.isArray(parsed))
      return parsed;
  } catch {
  }
  return [];
}
__name(getCart, "getCart");
function cartCount(cart) {
  return cart.reduce((s, i) => s + i.qty, 0);
}
__name(cartCount, "cartCount");
var CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --primary:#ff6b35;
  --primary-dark:#e55a2b;
  --primary-light:#ff8c61;
  --primary-glow:rgba(255,107,53,.28);
  --cyan:#00f2fe;
  --cyan-dark:#0284c7;
  --cyan-glow:rgba(0,242,254,.35);
  --bg:#f8fafc;
  --card:#ffffff;
  --text:#0f172a;
  --text-secondary:#64748b;
  --border:#e2e8f0;
  --success:#10b981;
  --shadow:0 10px 30px -10px rgba(15,23,42,.08);
  --shadow-hover:0 25px 50px -12px rgba(255,107,53,.25);
  --radius:18px;
  --transition:all .3s cubic-bezier(.4,0,.2,1);
}
html{scroll-behavior:smooth}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}

/* === HEADER === */
header{
  background:linear-gradient(135deg,#ff6b35 0%,#ff8c61 50%,#ff512f 100%);
  background-size:200% 200%;
  animation:gradientShift 8s ease infinite;
  color:#fff;padding:0 32px;height:70px;
  display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:100;
  box-shadow:0 4px 30px rgba(255,107,53,.35);
  backdrop-filter:blur(12px);
}
@keyframes gradientShift{
  0%,100%{background-position:0% 50%}
  50%{background-position:100% 50%}
}
.logo{font-size:1.55rem;font-weight:900;letter-spacing:-.5px;display:flex;align-items:center;gap:12px}
.logo-badge{
  width:40px;height:40px;border-radius:12px;
  background:rgba(255,255,255,.2);
  border:1px solid rgba(255,255,255,.35);
  display:flex;align-items:center;justify-content:center;
  color:#fff;box-shadow:0 4px 15px rgba(0,0,0,.12);
  transition:transform .3s cubic-bezier(.34,1.56,.64,1);
}
.logo:hover .logo-badge{transform:rotate(-6deg) scale(1.08)}
.logo-x{
  background:linear-gradient(135deg,#ffffff 0%,#ffe4d6 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  font-style:normal;
  font-weight:900;
}
nav{display:flex;align-items:center;gap:10px}
.nav-link{
  color:#fff;font-weight:700;font-size:.9rem;
  padding:8px 18px;border-radius:12px;
  transition:var(--transition);display:inline-flex;
  align-items:center;gap:8px;
}
.nav-link:hover{background:rgba(255,255,255,.22);transform:translateY(-1px)}
.cart-link{
  background:rgba(255,255,255,.18);border-radius:14px;
  display:inline-flex;align-items:center;gap:8px;
  padding:8px 18px;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);
  font-weight:700;font-size:.9rem;color:#fff;
  transition:var(--transition);
}
.cart-link:hover{background:rgba(255,255,255,.26);transform:translateY(-1px)}
.badge{
  background:#fff;color:var(--primary);
  font-size:.72rem;font-weight:900;
  min-width:22px;height:22px;
  display:inline-flex;align-items:center;justify-content:center;
  border-radius:11px;
  animation:badgePop .4s cubic-bezier(.68,-.55,.27,1.55);
}
@keyframes badgePop{
  0%{transform:scale(0)}
  100%{transform:scale(1)}
}

/* === TECH TICKER MARQUEE === */
.tech-ticker-wrap{
  background:#090d16;
  border-bottom:1px solid rgba(255,107,53,.3);
  color:#fff;
  overflow:hidden;
  white-space:nowrap;
  padding:10px 0;
  font-size:.8rem;
  font-weight:700;
  letter-spacing:.8px;
  position:relative;
  z-index:20;
}
.tech-ticker{
  display:inline-flex;
  gap:40px;
  animation:tickerScroll 26s linear infinite;
}
.tech-ticker:hover{animation-play-state:paused}
@keyframes tickerScroll{
  0%{transform:translateX(0)}
  100%{transform:translateX(-50%)}
}
.ticker-item{
  display:inline-flex;
  align-items:center;
  gap:10px;
  color:#e2e8f0;
}
.ticker-dot{
  width:6px;height:6px;
  background:var(--primary);
  border-radius:50%;
  box-shadow:0 0 10px var(--primary);
}

/* === HERO SECTION TECH CANVAS === */
.hero{
  background:radial-gradient(ellipse at 50% 20%,#1e1b4b 0%,#0f172a 60%,#020617 100%);
  color:#fff;padding:90px 32px 80px;text-align:center;
  position:relative;overflow:hidden;
}
#tech-canvas{
  position:absolute;top:0;left:0;
  width:100%;height:100%;
  pointer-events:auto;z-index:1;
}
.hero-grid-overlay{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(255,107,53,.07) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,107,53,.07) 1px,transparent 1px);
  background-size:38px 38px;
  mask-image:radial-gradient(ellipse at 50% 50%,black 40%,transparent 80%);
  -webkit-mask-image:radial-gradient(ellipse at 50% 50%,black 40%,transparent 80%);
  pointer-events:none;z-index:2;
}
.hero-content{
  position:relative;z-index:3;
  max-width:760px;margin:0 auto;
  pointer-events:none;
}
.hero-content *{pointer-events:auto}
.hero-pill-badge{
  display:inline-flex;align-items:center;gap:10px;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(0,242,254,.35);
  color:#38bdf8;padding:7px 18px;border-radius:30px;
  font-size:.8rem;font-weight:800;letter-spacing:1px;
  text-transform:uppercase;margin-bottom:20px;
  backdrop-filter:blur(12px);
  box-shadow:0 0 25px rgba(56,189,248,.25);
  animation:heroSlideUp .6s ease-out;
}
.pulse-cyan{
  width:8px;height:8px;border-radius:50%;
  background:#38bdf8;box-shadow:0 0 10px #38bdf8;
  animation:radarPulse 1.8s infinite;
}
@keyframes radarPulse{
  0%{transform:scale(.9);box-shadow:0 0 0 0 rgba(56,189,248,.8)}
  70%{transform:scale(1.1);box-shadow:0 0 0 10px rgba(56,189,248,0)}
  100%{transform:scale(.9);box-shadow:0 0 0 0 rgba(56,189,248,0)}
}
.hero h1{
  font-size:clamp(2.2rem,5.5vw,3.6rem);font-weight:900;
  margin-bottom:16px;letter-spacing:-1.2px;line-height:1.2;
  animation:heroSlideUp .8s ease-out;
}
.gradient-text{
  background:linear-gradient(135deg,#ff8c61 0%,#ff6b35 45%,#00f2fe 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
.hero p{
  font-size:1.15rem;color:rgba(255,255,255,.75);
  margin-bottom:32px;line-height:1.7;
  animation:heroSlideUp .8s ease-out .15s both;
}
.hero-stats{
  display:flex;justify-content:center;gap:45px;
  animation:heroSlideUp .8s ease-out .3s both;
}
.hero-stat{
  text-align:center;
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);
  padding:14px 24px;border-radius:14px;
  backdrop-filter:blur(8px);
  transition:var(--transition);
}
.hero-stat:hover{
  background:rgba(255,255,255,.1);
  transform:translateY(-3px);
  border-color:rgba(255,107,53,.5);
}
.hero-stat-num{font-size:1.9rem;font-weight:900;color:var(--primary-light)}
.hero-stat-label{font-size:.78rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;font-weight:700}
@keyframes heroSlideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

/* === MAIN === */
main{max-width:1200px;margin:0 auto;padding:40px 20px}
.section-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:28px;
}
.section-header h2{font-size:1.5rem;font-weight:700;display:flex;align-items:center;gap:10px}
.section-header h2 span{font-size:1.3rem}

/* === CATEGORIES === */
.categories{
  display:flex;gap:10px;flex-wrap:wrap;margin-bottom:32px;
  animation:fadeInUp .6s ease-out;
}
.cat-tag{
  padding:8px 20px;border-radius:25px;font-size:.85rem;font-weight:600;
  background:var(--card);border:2px solid var(--border);
  cursor:pointer;transition:var(--transition);
  white-space:nowrap;
}
.cat-tag:hover,.cat-tag.active{
  background:var(--primary);color:#fff;border-color:var(--primary);
  transform:translateY(-2px);box-shadow:0 4px 15px var(--primary-glow);
}

/* Card filter animation */
.card.filter-hide{
  opacity:0;transform:scale(.85);
  pointer-events:none;position:absolute;visibility:hidden;
  transition:opacity .3s ease,transform .3s ease;
}
.card.filter-show{
  opacity:1;transform:scale(1) translateY(0) !important;
  position:relative;visibility:visible;
  animation:filterPop .4s cubic-bezier(.4,0,.2,1) both;
}
@keyframes filterPop{
  0%{opacity:0;transform:scale(.85) translateY(20px)}
  100%{opacity:1;transform:scale(1) translateY(0)}
}

/* === GRID & CARDS === */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:28px}
.card{
  background:var(--card);border-radius:var(--radius);overflow:hidden;
  box-shadow:var(--shadow);border:1px solid rgba(226,232,240,.9);
  transition:transform .18s cubic-bezier(.2,0,.2,1),box-shadow .3s ease,border-color .3s ease;
  opacity:0;transform:translateY(40px);
  position:relative;transform-style:preserve-3d;
}
.card.visible{
  opacity:1;transform:translateY(0);
}
.card::after{
  content:'';position:absolute;inset:0;
  border-radius:var(--radius);
  background:radial-gradient(350px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(255,107,53,.14),transparent 75%);
  opacity:0;transition:opacity .3s ease;
  pointer-events:none;z-index:4;
}
.card:hover::after{opacity:1}
.card:hover{
  border-color:rgba(255,107,53,.45);
  box-shadow:0 20px 45px -10px rgba(255,107,53,.22),0 0 25px rgba(255,107,53,.08);
}
.card-img-wrap{
  position:relative;overflow:hidden;height:270px;
  background:radial-gradient(circle at 50% 50%,#f8fafc,#e2e8f0);
}
.card-img-wrap img{
  width:100%;height:100%;object-fit:cover;
  transition:transform .7s cubic-bezier(.2,0,.2,1),filter .4s ease;
}
.card:hover .card-img-wrap img{transform:scale(1.08)}
.card-badge{
  position:absolute;top:14px;left:14px;
  background:linear-gradient(135deg,#ff6b35,#ff8c61);color:#fff;
  padding:5px 14px;border-radius:8px;
  font-size:.75rem;font-weight:800;
  text-transform:uppercase;letter-spacing:.5px;
  animation:badgeSlide .5s ease-out;
  box-shadow:0 4px 15px var(--primary-glow);
  z-index:3;
}
@keyframes badgeSlide{
  from{opacity:0;transform:translateX(-20px)}
  to{opacity:1;transform:translateX(0)}
}
.card-discount{
  position:absolute;top:14px;right:14px;
  background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;
  padding:5px 10px;border-radius:8px;
  font-size:.75rem;font-weight:800;
  box-shadow:0 4px 12px rgba(239,68,68,.3);
  z-index:3;
}
.card-wishlist{
  position:absolute;bottom:14px;right:14px;
  width:40px;height:40px;border-radius:50%;
  background:rgba(255,255,255,.95);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;
  font-size:1.2rem;cursor:pointer;
  transition:var(--transition);
  opacity:0;transform:scale(.8);
  border:1px solid rgba(0,0,0,.06);
  z-index:5;
}
.card:hover .card-wishlist{opacity:1;transform:scale(1)}
.card-wishlist:hover{background:var(--primary);color:#fff;transform:scale(1.15) !important}
.card-body{padding:22px}
.card-meta{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:8px;
}
.card-category{
  font-size:.75rem;font-weight:700;color:var(--primary);
  text-transform:uppercase;letter-spacing:1px;
}
.card-chip-tag{
  font-size:.72rem;font-weight:800;
  padding:3px 9px;border-radius:6px;
  background:rgba(255,107,53,.1);color:var(--primary-dark);
  border:1px solid rgba(255,107,53,.25);
  display:inline-flex;align-items:center;gap:4px;
}
.card-body h3{font-size:1.1rem;font-weight:800;margin-bottom:8px;line-height:1.35}
.card-body h3 a{transition:color .2s}
.card-body h3 a:hover{color:var(--primary)}
.card-specs{
  display:flex;flex-wrap:wrap;gap:6px;
  margin:8px 0 12px;
}
.spec-tag{
  font-size:.72rem;font-weight:600;
  background:#f1f5f9;color:#475569;
  padding:3px 9px;border-radius:6px;
  display:inline-flex;align-items:center;gap:5px;
}
.spec-dot{
  width:4px;height:4px;border-radius:50%;
  background:var(--primary);display:inline-block;
}
.card-stock{
  font-size:.75rem;font-weight:700;
  color:#059669;display:flex;align-items:center;
  gap:7px;margin-bottom:12px;
}
.pulse-beacon{
  width:7px;height:7px;border-radius:50%;
  background:#10b981;box-shadow:0 0 0 0 rgba(16,185,129,.7);
  animation:pulseGreen 2s infinite;display:inline-block;
}
@keyframes pulseGreen{
  0%{box-shadow:0 0 0 0 rgba(16,185,129,.8)}
  70%{box-shadow:0 0 0 7px rgba(16,185,129,0)}
  100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}
}
.card-rating{display:flex;align-items:center;gap:6px;margin-bottom:12px;font-size:.85rem}
.card-rating .stars{color:#fbbf24;font-size:.9rem}
.card-rating .score{font-weight:700;color:var(--text)}
.card-rating .count{color:var(--text-secondary);font-size:.8rem}
.card-prices{display:flex;align-items:baseline;gap:10px;margin-bottom:18px}
.card-price{color:var(--primary);font-weight:900;font-size:1.25rem}
.card-original{color:var(--text-secondary);font-size:.85rem;text-decoration:line-through}
.card-actions{display:flex;gap:10px}

/* === BUTTONS === */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--primary);color:#fff;border:none;
  padding:12px 24px;border-radius:12px;
  font-size:.9rem;font-weight:700;cursor:pointer;
  transition:var(--transition);position:relative;
  overflow:hidden;flex:1;
}
.btn::after{
  content:'';position:absolute;
  width:100%;height:100%;top:0;left:0;
  background:radial-gradient(circle,rgba(255,255,255,.35) 10%,transparent 10.01%);
  transform:scale(10);opacity:0;
  transition:transform .5s,opacity 1s;
}
.btn:active::after{transform:scale(0);opacity:.3;transition:0s}
.btn:hover{
  background:var(--primary-dark);
  transform:translateY(-2px);
  box-shadow:0 8px 25px var(--primary-glow);
}
.btn-cyber{
  background:linear-gradient(135deg,#ff6b35 0%,#ff8c61 100%);
  box-shadow:0 6px 20px rgba(255,107,53,.35);
  position:relative;overflow:hidden;
}
.btn-cyber::before{
  content:'';position:absolute;
  top:0;left:-100%;width:60%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
  transform:skewX(-20deg);transition:.6s;
}
.btn-cyber:hover::before{left:150%}
.btn-cyber:hover{
  transform:translateY(-2px) scale(1.02);
  box-shadow:0 10px 30px rgba(255,107,53,.45);
}
.btn-outline{
  background:transparent;color:var(--primary);
  border:2px solid var(--primary);
}
.btn-outline:hover{background:var(--primary);color:#fff}
.btn-sm{padding:8px 16px;font-size:.8rem;border-radius:8px}
.btn-icon{
  width:44px;height:44px;padding:0;flex:none;
  border-radius:12px;font-size:1.05rem;
}
.btn-ghost{
  background:#f8fafc;color:var(--text-secondary);
  border:2px solid var(--border);
}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);background:#fff}

/* === DETAIL PAGE TECH STYLING === */
.detail-tech-badge-row{
  display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;
}
.detail-chip-pill{
  font-size:.78rem;font-weight:800;padding:4px 14px;border-radius:20px;
  background:rgba(56,189,248,.12);color:#0284c7;
  border:1px solid rgba(56,189,248,.35);
  display:inline-flex;align-items:center;gap:6px;
}
.stock-pulse-detail{
  font-size:.8rem;font-weight:700;color:#059669;
  display:inline-flex;align-items:center;gap:6px;
}
.detail-specs-highlight{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;
  margin:18px 0 22px;padding:16px;
  background:#f8fafc;border-radius:14px;
  border:1px dashed var(--border);
}
.detail-spec-item{
  display:flex;align-items:center;gap:8px;
  font-size:.85rem;font-weight:700;color:var(--text);
}
.detail-spec-item .spec-icon{color:var(--primary)}

/* === DETAIL === */
.breadcrumb{
  display:flex;align-items:center;gap:8px;
  font-size:.85rem;color:var(--text-secondary);
  margin-bottom:24px;
  animation:fadeInUp .5s ease-out;
}
.breadcrumb a:hover{color:var(--primary)}
.breadcrumb .sep{opacity:.4}
.detail{
  display:grid;grid-template-columns:1fr 1fr;gap:48px;
  background:var(--card);border-radius:var(--radius);
  padding:40px;box-shadow:var(--shadow);
  animation:fadeInUp .6s ease-out;
}
.detail-gallery{position:relative;border-radius:12px;overflow:hidden}
.detail-gallery img{
  width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;
  transition:transform .5s ease;
}
.detail-gallery:hover img{transform:scale(1.03)}
.detail-info{display:flex;flex-direction:column}
.detail-badge{
  display:inline-flex;align-items:center;gap:4px;
  background:var(--primary);color:#fff;
  padding:4px 12px;border-radius:6px;
  font-size:.75rem;font-weight:700;
  width:fit-content;margin-bottom:12px;
}
.detail-info h1{font-size:1.8rem;font-weight:800;line-height:1.3;margin-bottom:10px}
.detail-rating{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:.9rem}
.detail-rating .stars{color:#fbbf24;font-size:1rem}
.detail-rating .count{color:var(--text-secondary)}
.detail-prices{
  display:flex;align-items:baseline;gap:12px;
  margin-bottom:8px;
  padding:16px 0;border-bottom:1px solid var(--border);
}
.detail-price{color:var(--primary);font-weight:800;font-size:2rem}
.detail-original{color:var(--text-secondary);font-size:1.1rem;text-decoration:line-through}
.detail-save{
  background:linear-gradient(135deg,#fef3c7,#fde68a);
  color:#92400e;padding:4px 10px;border-radius:6px;
  font-size:.8rem;font-weight:700;
}
.detail-desc{
  color:var(--text-secondary);line-height:1.8;
  margin:20px 0;font-size:.95rem;flex:1;
}
.detail-features{
  display:grid;grid-template-columns:1fr 1fr;gap:10px;
  margin-bottom:24px;
}
.detail-feature{
  display:flex;align-items:center;gap:8px;
  font-size:.85rem;color:var(--text-secondary);
}
.detail-feature .icon{
  width:32px;height:32px;border-radius:8px;
  background:var(--bg);display:flex;align-items:center;
  justify-content:center;font-size:.9rem;
}
.detail-actions{display:flex;gap:12px;margin-top:auto}

/* === CART === */
.cart-container{animation:fadeInUp .6s ease-out}
.cart-layout{display:grid;grid-template-columns:1fr 380px;gap:32px;align-items:start}
.cart-items{
  background:var(--card);border-radius:var(--radius);
  box-shadow:var(--shadow);overflow:hidden;
}
.cart-item{
  display:flex;align-items:center;gap:20px;
  padding:20px 24px;border-bottom:1px solid var(--border);
  transition:var(--transition);
  animation:cartItemSlide .4s ease-out both;
}
.cart-item:hover{background:#fafbfc}
@keyframes cartItemSlide{
  from{opacity:0;transform:translateX(-20px)}
  to{opacity:1;transform:translateX(0)}
}
.cart-item:nth-child(2){animation-delay:.1s}
.cart-item:nth-child(3){animation-delay:.2s}
.cart-item:nth-child(4){animation-delay:.3s}
.cart-item:nth-child(5){animation-delay:.4s}
.cart-item:nth-child(6){animation-delay:.5s}
.cart-item-img{
  width:80px;height:80px;border-radius:12px;
  object-fit:cover;flex-shrink:0;
}
.cart-item-info{flex:1;min-width:0}
.cart-item-name{font-weight:700;font-size:.95rem;margin-bottom:4px}
.cart-item-price{color:var(--primary);font-weight:600;font-size:.9rem}
.cart-item-qty{
  display:flex;align-items:center;gap:0;
  border:2px solid var(--border);border-radius:10px;overflow:hidden;
}
.cart-item-qty button{
  width:36px;height:36px;border:none;
  background:var(--bg);cursor:pointer;
  font-size:1rem;font-weight:700;
  transition:var(--transition);
  display:flex;align-items:center;justify-content:center;
}
.cart-item-qty button:hover{background:var(--primary);color:#fff}
.cart-item-qty span{
  width:40px;text-align:center;font-weight:700;
  font-size:.9rem;
}
.cart-item-subtotal{
  font-weight:700;font-size:1rem;
  min-width:130px;text-align:right;
}
.cart-item-remove{
  width:36px;height:36px;border-radius:8px;
  border:none;background:transparent;
  color:#ef4444;cursor:pointer;font-size:1.1rem;
  transition:var(--transition);
  display:flex;align-items:center;justify-content:center;
}
.cart-item-remove:hover{background:#fef2f2;transform:scale(1.1)}

/* Cart Summary */
.cart-summary{
  background:var(--card);border-radius:var(--radius);
  box-shadow:var(--shadow);padding:28px;
  position:sticky;top:90px;
  animation:fadeInUp .6s ease-out .2s both;
}
.cart-summary h3{font-size:1.1rem;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px}
.summary-row{
  display:flex;justify-content:space-between;
  padding:10px 0;font-size:.9rem;color:var(--text-secondary);
}
.summary-row.total{
  border-top:2px solid var(--border);
  margin-top:10px;padding-top:16px;
  font-size:1.15rem;font-weight:800;
  color:var(--text);
}
.summary-row.total .val{color:var(--primary)}
.summary-row.save{color:var(--success);font-weight:600}
.cart-checkout{width:100%;margin-top:20px;padding:16px;font-size:1rem;border-radius:14px}
.cart-continue{
  width:100%;margin-top:10px;padding:14px;font-size:.9rem;
  text-align:center;display:block;
}

/* === EMPTY === */
.empty{
  text-align:center;padding:80px 20px;
  animation:fadeInUp .6s ease-out;
}
.empty-icon{
  font-size:4rem;margin-bottom:16px;
  animation:emptyBounce 2s ease-in-out infinite;
}
@keyframes emptyBounce{
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-10px)}
}
.empty h3{font-size:1.3rem;font-weight:700;margin-bottom:8px}
.empty p{color:var(--text-secondary);margin-bottom:24px}

/* === SUPPORT PAGES === */
.page-hero{
  text-align:center;padding:40px 20px 30px;
  animation:fadeInUp .5s ease-out;
}
.page-hero-icon-box{
  width:72px;height:72px;border-radius:22px;
  background:rgba(255,107,53,.12);
  border:1px solid rgba(255,107,53,.3);
  color:var(--primary);
  display:inline-flex;align-items:center;justify-content:center;
  margin-bottom:16px;box-shadow:0 10px 25px var(--primary-glow);
  animation:heroFloat 3s ease-in-out infinite;
}
.page-hero-icon-box svg{width:36px;height:36px}
.page-hero h1{font-size:1.8rem;font-weight:900}
.page-body{max-width:800px;margin:0 auto}
.page-section{
  background:var(--card);border-radius:var(--radius);
  padding:28px 32px;margin-bottom:20px;
  box-shadow:var(--shadow);
  animation:fadeInUp .5s ease-out both;
}
.page-section h3{
  font-size:1.1rem;font-weight:700;margin-bottom:14px;
  color:var(--text);padding-bottom:10px;
  border-bottom:2px solid var(--bg);
}
.page-content{color:var(--text-secondary);line-height:1.8;font-size:.92rem}
.page-content ul,.page-content ol{padding-left:20px;margin:8px 0}
.page-content li{padding:5px 0}
.page-content li strong{color:var(--text)}
.page-content p{margin:6px 0}
.policy-table{
  width:100%;border-collapse:collapse;margin:8px 0;
  border-radius:10px;overflow:hidden;
}
.policy-table th{
  background:var(--primary);color:#fff;
  padding:12px 16px;font-weight:600;font-size:.85rem;
  text-align:left;
}
.policy-table td{
  padding:11px 16px;border-bottom:1px solid var(--border);
  font-size:.88rem;
}
.policy-table tr:last-child td{border-bottom:none}
.policy-table tr:hover td{background:var(--bg)}

/* === TOAST === */
.toast{
  position:fixed;bottom:30px;right:30px;z-index:1000;
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  color:#fff;padding:16px 24px;border-radius:14px;
  box-shadow:0 10px 40px rgba(0,0,0,.25);
  display:flex;align-items:center;gap:12px;
  animation:toastSlide .5s cubic-bezier(.68,-.55,.27,1.55),toastFade .5s ease 3s forwards;
  max-width:400px;
}
@keyframes toastSlide{
  from{opacity:0;transform:translateY(30px) scale(.9)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes toastFade{
  to{opacity:0;transform:translateY(10px);pointer-events:none}
}
.toast-icon{font-size:1.5rem}
.toast-msg{font-size:.9rem;font-weight:500}
.toast-msg strong{display:block;font-size:.8rem;color:var(--primary-light);margin-top:2px}

/* === FOOTER === */
footer{
  background:#1a1a2e;color:rgba(255,255,255,.7);
  padding:60px 32px 30px;margin-top:60px;
}
.footer-grid{
  max-width:1200px;margin:0 auto;
  display:grid;grid-template-columns:2fr 1fr 1fr 1.5fr;gap:40px;
  margin-bottom:40px;
}
.footer-brand .logo{color:#fff;margin-bottom:14px;font-size:1.45rem}
.footer-brand p{font-size:.85rem;line-height:1.7;color:rgba(255,255,255,.5)}
.footer-col h4{font-weight:800;margin-bottom:18px;color:#fff;font-size:.88rem;text-transform:uppercase;letter-spacing:1.2px}
.footer-col a{display:block;padding:6px 0;font-size:.85rem;transition:color .2s}
.footer-col a:hover{color:var(--primary-light)}
.footer-link{
  display:flex !important;align-items:center;gap:12px;
  padding:7px 0 !important;font-size:.88rem;
  color:rgba(255,255,255,.75);transition:all .25s ease;
  text-decoration:none;
}
.footer-link:hover{color:#fff !important;transform:translateX(4px)}
.footer-link:hover .footer-icon-box{
  background:var(--primary);color:#fff;
  border-color:var(--primary);
  box-shadow:0 0 14px var(--primary-glow);
  transform:scale(1.06);
}
.footer-icon-box{
  width:32px;height:32px;border-radius:9px;
  background:rgba(255,107,53,.12);
  border:1px solid rgba(255,107,53,.28);
  color:var(--primary-light);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .25s ease;
}
.footer-text{flex:1;word-break:break-all;line-height:1.4}
.footer-bottom{
  max-width:1200px;margin:0 auto;
  border-top:1px solid rgba(255,255,255,.1);
  padding-top:24px;text-align:center;
  font-size:.8rem;color:rgba(255,255,255,.4);
}

/* === ANIMATIONS === */
@keyframes fadeInUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes fadeIn{
  from{opacity:0}
  to{opacity:1}
}
@keyframes slideInLeft{
  from{opacity:0;transform:translateX(-30px)}
  to{opacity:1;transform:translateX(0)}
}
@keyframes scaleIn{
  from{opacity:0;transform:scale(.9)}
  to{opacity:1;transform:scale(1)}
}
@keyframes shimmer{
  0%{background-position:-400px 0}
  100%{background-position:400px 0}
}
.animate-fadeInUp{animation:fadeInUp .6s ease-out both}
.delay-1{animation-delay:.1s}
.delay-2{animation-delay:.2s}
.delay-3{animation-delay:.3s}

/* === RESPONSIVE === */
@media(max-width:900px){
  .detail{grid-template-columns:1fr;gap:28px;padding:24px}
  .cart-layout{grid-template-columns:1fr}
  .footer-grid{grid-template-columns:1fr 1fr;gap:24px}
  .hero-stats{gap:24px}
}
@media(max-width:600px){
  header{padding:0 16px;height:60px}
  .logo{font-size:1.3rem}
  .grid{grid-template-columns:1fr;gap:20px}
  .hero{padding:50px 20px}
  .hero h1{font-size:1.8rem}
  .hero-stats{flex-direction:column;gap:12px}
  .footer-grid{grid-template-columns:1fr}
  .cart-item{flex-wrap:wrap}
  .cart-item-subtotal{min-width:auto}
  .detail-actions{flex-direction:column}
}
`;
var SCRIPTS = `
<script>
// Intersection Observer for card animations
document.addEventListener('DOMContentLoaded',()=>{
  const cards=document.querySelectorAll('.card');
  if(cards.length){
    const obs=new IntersectionObserver((entries)=>{
      entries.forEach((e,i)=>{
        if(e.isIntersecting){
          setTimeout(()=>e.target.classList.add('visible'),i*100);
          obs.unobserve(e.target);
        }
      });
    },{threshold:0.1,rootMargin:'50px'});
    cards.forEach(c=>obs.observe(c));
  }

  // Wishlist heart toggle
  document.querySelectorAll('.card-wishlist').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      btn.textContent=btn.textContent==='\u2661'?'\u2665':'\u2661';
      btn.style.color=btn.textContent==='\u2665'?'#ef4444':'';
    });
  });

  // Category filter
  const catTags=document.querySelectorAll('.cat-tag');
  const allCards=document.querySelectorAll('.card[data-category]');
  function filterByCategory(cat){
    let delay=0;
    allCards.forEach(card=>{
      const match=cat==='T\u1EA5t c\u1EA3'||card.dataset.category===cat;
      if(!match){
        card.classList.remove('filter-show','visible');
        card.classList.add('filter-hide');
      } else {
        setTimeout(()=>{
          card.classList.remove('filter-hide');
          card.classList.add('filter-show','visible');
        },delay);
        delay+=80;
      }
    });
  }
  catTags.forEach(tag=>{
    tag.addEventListener('click',()=>{
      catTags.forEach(t=>t.classList.remove('active'));
      tag.classList.add('active');
      filterByCategory(tag.textContent.trim());
    });
  });

  // Auto-filter from URL ?cat= param (footer links)
  const urlCat=new URLSearchParams(location.search).get('cat');
  if(urlCat && catTags.length){
    catTags.forEach(t=>{
      t.classList.remove('active');
      if(t.textContent.trim()===urlCat) t.classList.add('active');
    });
    setTimeout(()=>filterByCategory(urlCat),400);
    // Scroll to products
    const grid=document.querySelector('.grid');
    if(grid) setTimeout(()=>grid.scrollIntoView({behavior:'smooth',block:'start'}),500);
  }

  // Smooth number counting for hero stats
  document.querySelectorAll('.hero-stat-num[data-count]').forEach(el=>{
    const target=parseInt(el.dataset.count);
    const suffix=el.dataset.suffix||'';
    let current=0;
    const step=Math.ceil(target/40);
    const timer=setInterval(()=>{
      current+=step;
      if(current>=target){current=target;clearInterval(timer)}
      el.textContent=current.toLocaleString('vi-VN')+suffix;
    },30);
  });

  // Interactive 3D Tilt & Dynamic Spotlight on Cards
  const tiltCards=document.querySelectorAll('.card');
  tiltCards.forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const rect=card.getBoundingClientRect();
      const x=e.clientX-rect.left;
      const y=e.clientY-rect.top;
      card.style.setProperty('--mouse-x',x+'px');
      card.style.setProperty('--mouse-y',y+'px');
      const centerX=rect.width/2;
      const centerY=rect.height/2;
      const rotateX=((y-centerY)/centerY)*-6;
      const rotateY=((x-centerX)/centerX)*6;
      card.style.transform=\`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) translateY(-6px) scale3d(1.02,1.02,1.02)\`;
    });
    card.addEventListener('mouseleave',()=>{
      card.style.transform='';
    });
  });

  // Cyber Particle Network Canvas
  const canvas=document.getElementById('tech-canvas');
  if(canvas){
    const ctx=canvas.getContext('2d');
    let w,h,particles=[];
    const mouse={x:null,y:null,radius:120};
    function resize(){
      w=canvas.width=canvas.parentElement.offsetWidth;
      h=canvas.height=canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize',resize);
    canvas.parentElement.addEventListener('mousemove',e=>{
      const rect=canvas.getBoundingClientRect();
      mouse.x=e.clientX-rect.left;
      mouse.y=e.clientY-rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave',()=>{
      mouse.x=null;mouse.y=null;
    });
    const count=Math.min(Math.floor((w*h)/14000),45);
    for(let i=0;i<count;i++){
      particles.push({
        x:Math.random()*w,
        y:Math.random()*h,
        vx:(Math.random()-.5)*.7,
        vy:(Math.random()-.5)*.7,
        size:Math.random()*2+1,
        color:Math.random()>.4?'rgba(255,107,53,':'rgba(0,242,254,'
      });
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(let i=0;i<particles.length;i++){
        const p=particles[i];
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>w)p.vx*=-1;
        if(p.y<0||p.y>h)p.vy*=-1;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=p.color+'.75)';
        ctx.fill();
        for(let j=i+1;j<particles.length;j++){
          const p2=particles[j];
          const dx=p.x-p2.x;
          const dy=p.y-p2.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<90){
            ctx.beginPath();
            ctx.moveTo(p.x,p.y);
            ctx.lineTo(p2.x,p2.y);
            ctx.strokeStyle=\`rgba(255,107,53,\${0.2*(1-dist/90)})\`;
            ctx.lineWidth=.7;
            ctx.stroke();
          }
        }
        if(mouse.x!==null){
          const dx=p.x-mouse.x;
          const dy=p.y-mouse.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<mouse.radius){
            ctx.beginPath();
            ctx.moveTo(p.x,p.y);
            ctx.lineTo(mouse.x,mouse.y);
            ctx.strokeStyle=\`rgba(0,242,254,\${0.35*(1-dist/mouse.radius)})\`;
            ctx.lineWidth=1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // Toast auto-dismiss
  const toast=document.querySelector('.toast');
  if(toast) setTimeout(()=>toast.remove(),3500);
});
<\/script>
`;
function tickerBanner() {
  return `
  <div class="tech-ticker-wrap">
    <div class="tech-ticker">
      <span class="ticker-item"><span class="ticker-dot"></span>\u26A1 CELLPHONE X FUTURE TECH</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F680} GIAO H\u1ECEA T\u1ED0C 2H TO\xC0N QU\u1ED0C</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F6E1}\uFE0F 100% CH\xCDNH H\xC3NG APPLE & SAMSUNG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F48E} B\u1EA2O H\xC0NH VIP 1 \u0110\u1ED4I 1 TRONG 12 TH\xC1NG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F4B3} TR\u1EA2 G\xD3P 0% L\xC3I SU\u1EA4T</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F381} B\u1ED8 QU\xC0 T\u1EB6NG C\xD4NG NGH\u1EC6 X-PRO</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u26A1 CELLPHONE X FUTURE TECH</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F680} GIAO H\u1ECEA T\u1ED0C 2H TO\xC0N QU\u1ED0C</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F6E1}\uFE0F 100% CH\xCDNH H\xC3NG APPLE & SAMSUNG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F48E} B\u1EA2O H\xC0NH VIP 1 \u0110\u1ED4I 1 TRONG 12 TH\xC1NG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F4B3} TR\u1EA2 G\xD3P 0% L\xC3I SU\u1EA4T</span>
      <span class="ticker-item"><span class="ticker-dot"></span>\u{1F381} B\u1ED8 QU\xC0 T\u1EB6NG C\xD4NG NGH\u1EC6 X-PRO</span>
    </div>
  </div>`;
}
__name(tickerBanner, "tickerBanner");
function layout(title, body, cart, opts) {
  const count = cartCount(cart);
  const toastHtml = opts?.toast ? `<div class="toast"><span class="toast-icon">\u2705</span><div class="toast-msg">\u0110\xE3 th\xEAm v\xE0o gi\u1ECF h\xE0ng!<strong>${opts.toast}</strong></div></div>` : "";
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} \u2014 Cellphone X</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<header>
  <a href="/" class="logo">
    <span class="logo-badge">${Icons.logo}</span>
    <span>Cellphone <span class="logo-x">X</span></span>
  </a>
  <nav>
    <a href="/" class="nav-link">${Icons.home} <span>Trang ch\u1EE7</span></a>
    <a href="/cart" class="cart-link">${Icons.cart} <span>Gi\u1ECF h\xE0ng</span>${count > 0 ? ` <span class="badge">${count}</span>` : ""}</a>
  </nav>
</header>
${tickerBanner()}
${body}
${toastHtml}
${SCRIPTS}
</body>
</html>`;
}
__name(layout, "layout");
function heroSection() {
  return `
  <section class="hero">
    <canvas id="tech-canvas"></canvas>
    <div class="hero-grid-overlay"></div>
    <div class="hero-content">
      <div class="hero-pill-badge"><span class="pulse-cyan"></span> TH\u1EBE H\u1EC6 C\xD4NG NGH\u1EC6 2026 M\u1EDAI NH\u1EA4T</div>
      <h1>C\xF4ng ngh\u1EC7 \u0111\u1EC9nh cao<br><span class="gradient-text">Ki\u1EBFn t\u1EA1o t\u01B0\u01A1ng lai</span></h1>
      <p>Kh\xE1m ph\xE1 si\xEAu ph\u1EA9m c\xF4ng ngh\u1EC7 ch\xEDnh h\xE3ng v\u1EDBi hi\u1EC7u n\u0103ng \u0111\u1ED9t ph\xE1, camera chu\u1EA9n cinema v\xE0 AI th\xF4ng minh th\u1EBF h\u1EC7 m\u1EDBi.</p>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-num" data-count="10000" data-suffix="+">0</div>
          <div class="hero-stat-label">Kh\xE1ch h\xE0ng</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-num" data-count="500" data-suffix="+">0</div>
          <div class="hero-stat-label">S\u1EA3n ph\u1EA9m</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-num" data-count="99" data-suffix="%">0</div>
          <div class="hero-stat-label">H\xE0i l\xF2ng</div>
        </div>
      </div>
    </div>
  </section>`;
}
__name(heroSection, "heroSection");
function footerSection() {
  return `
  <footer>
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo">
          <span class="logo-badge">${Icons.logo}</span>
          <span>Cellphone <span class="logo-x">X</span></span>
        </div>
        <p>H\u1EC7 th\u1ED1ng b\xE1n l\u1EBB thi\u1EBFt b\u1ECB c\xF4ng ngh\u1EC7 \u0111\u1EC9nh cao, cam k\u1EBFt 100% s\u1EA3n ph\u1EA9m ch\xEDnh h\xE3ng, tr\u1EA3i nghi\u1EC7m t\u01B0\u01A1ng lai v\xE0 b\u1EA3o h\xE0nh t\u1EADn t\xE2m.</p>
      </div>
      <div class="footer-col">
        <h4>S\u1EA3n ph\u1EA9m</h4>
        <a href="/?cat=\u0110i\u1EC7n tho\u1EA1i">\u0110i\u1EC7n tho\u1EA1i</a>
        <a href="/?cat=Laptop">Laptop</a>
        <a href="/?cat=Tablet">Tablet</a>
        <a href="/?cat=Ph\u1EE5 ki\u1EC7n">Ph\u1EE5 ki\u1EC7n</a>
      </div>
      <div class="footer-col">
        <h4>H\u1ED7 tr\u1EE3</h4>
        <a href="/page/doi-tra">Ch\xEDnh s\xE1ch \u0111\u1ED5i tr\u1EA3</a>
        <a href="/page/bao-hanh">B\u1EA3o h\xE0nh</a>
        <a href="/page/van-chuyen">V\u1EADn chuy\u1EC3n</a>
        <a href="/page/faq">FAQ</a>
      </div>
      <div class="footer-col">
        <h4>Li\xEAn h\u1EC7</h4>
        <a href="/" class="footer-link">
          <span class="footer-icon-box">${Icons.mapPin}</span>
          <span class="footer-text">TP. Th\xE1i Nguy\xEAn</span>
        </a>
        <a href="tel:0969610085" class="footer-link">
          <span class="footer-icon-box">${Icons.phone}</span>
          <span class="footer-text">0969610085</span>
        </a>
        <a href="mailto:nguyendiem1892005@gmail.com" class="footer-link">
          <span class="footer-icon-box">${Icons.mail}</span>
          <span class="footer-text">nguyendiem1892005@gmail.com</span>
        </a>
        <a href="/" class="footer-link">
          <span class="footer-icon-box">${Icons.globe}</span>
          <span class="footer-text">Cellphone X</span>
        </a>
      </div>
    </div>
    <div class="footer-bottom">\xA9 2026 Cellphone X \u2014 Made with \u2764\uFE0F by Qu\u1ED1c Jee. All rights reserved.</div>
  </footer>`;
}
__name(footerSection, "footerSection");
var app = new Hono2();
app.get("/", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const toast = c.req.query("added");
  const categories = ["T\u1EA5t c\u1EA3", ...new Set(products.map((p) => p.category))];
  const catHtml = categories.map(
    (cat, i) => `<span class="cat-tag${i === 0 ? " active" : ""}">${cat}</span>`
  ).join("");
  const cards = products.map(
    (p) => `
    <div class="card" data-category="${p.category}">
      <div class="card-img-wrap">
        <a href="/product/${p.id}"><img src="${p.image}" alt="${p.name}" loading="lazy"></a>
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ""}
        <span class="card-discount">-${discount(p.originalPrice, p.price)}%</span>
        <button class="card-wishlist" onclick="event.preventDefault()">${Icons.heart}</button>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <div class="card-category">${p.category}</div>
          <div class="card-chip-tag">${p.chip}</div>
        </div>
        <h3><a href="/product/${p.id}">${p.name}</a></h3>
        <div class="card-specs">
          ${p.specs.map((s) => `<span class="spec-tag"><span class="spec-dot"></span>${s}</span>`).join("")}
        </div>
        <div class="card-stock">
          <span class="pulse-beacon"></span> S\u1EB5n h\xE0ng h\u1ECFa t\u1ED1c \u2022 Giao 2H
        </div>
        <div class="card-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="score">${p.rating}</span>
          <span class="count">(${p.reviews.toLocaleString("vi-VN")})</span>
        </div>
        <div class="card-prices">
          <span class="card-price">${formatVND(p.price)}</span>
          <span class="card-original">${formatVND(p.originalPrice)}</span>
        </div>
        <div class="card-actions">
          <form method="POST" action="/cart/add" style="flex:1;display:flex">
            <input type="hidden" name="id" value="${p.id}">
            <button class="btn btn-cyber" type="submit">${Icons.cart} <span>Th\xEAm v\xE0o gi\u1ECF</span></button>
          </form>
          <a href="/product/${p.id}" class="btn btn-icon btn-ghost" title="Xem chi ti\u1EBFt">${Icons.eye}</a>
        </div>
      </div>
    </div>`
  ).join("");
  const body = `
    ${heroSection()}
    <main>
      <div class="section-header">
        <h2 style="display:flex;align-items:center;gap:10px">${Icons.fire} <span>Si\xEAu Ph\u1EA9m C\xF4ng Ngh\u1EC7</span></h2>
      </div>
      <div class="categories">${catHtml}</div>
      <div class="grid">${cards}</div>
    </main>
    ${footerSection()}`;
  const addedProduct = toast ? products.find((p) => p.id === Number(toast)) : null;
  return c.html(layout("Trang ch\u1EE7", body, cart, { toast: addedProduct?.name }));
});
app.get("/product/:id", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const id = Number(c.req.param("id"));
  const p = products.find((x) => x.id === id);
  if (!p) {
    const body2 = `<main><div class="empty"><div class="empty-icon">\u{1F622}</div><h3>S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i</h3><p>S\u1EA3n ph\u1EA9m b\u1EA1n t\xECm ki\u1EBFm kh\xF4ng c\xF3 trong h\u1EC7 th\u1ED1ng.</p><a href="/" class="btn">\u2190 V\u1EC1 trang ch\u1EE7</a></div></main>${footerSection()}`;
    return c.html(layout("Kh\xF4ng t\xECm th\u1EA5y", body2, cart, { noHero: true }), 404);
  }
  const savedAmount = p.originalPrice - p.price;
  const body = `
  <main>
    <div class="breadcrumb">
      <a href="/">\u{1F3E0} Trang ch\u1EE7</a> <span class="sep">\u203A</span>
      <span>${p.category}</span> <span class="sep">\u203A</span>
      <span style="color:var(--text)">${p.name}</span>
    </div>
    <div class="detail">
      <div class="detail-gallery">
        <img src="${p.image}" alt="${p.name}">
      </div>
      <div class="detail-info">
        <div class="detail-tech-badge-row">
          ${p.badge ? `<span class="detail-badge">\u{1F3F7}\uFE0F ${p.badge}</span>` : ""}
          <span class="detail-chip-pill">${p.chip}</span>
          <span class="stock-pulse-detail"><span class="pulse-beacon"></span> S\u1EB5n h\xE0ng h\u1ECFa t\u1ED1c t\u1EA1i Th\xE1i Nguy\xEAn</span>
        </div>
        <h1>${p.name}</h1>
        <div class="detail-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span>${p.rating}/5</span>
          <span class="count">\u2022 ${p.reviews.toLocaleString("vi-VN")} \u0111\xE1nh gi\xE1</span>
        </div>
        <div class="detail-prices">
          <span class="detail-price">${formatVND(p.price)}</span>
          <span class="detail-original">${formatVND(p.originalPrice)}</span>
          <span class="detail-save">Ti\u1EBFt ki\u1EC7m ${formatVND(savedAmount)}</span>
        </div>
        <div class="detail-specs-highlight">
          ${p.specs.map((s) => `<div class="detail-spec-item"><span class="spec-icon">\u26A1</span><span>${s}</span></div>`).join("")}
        </div>
        <p class="detail-desc">${p.description}</p>
        <div class="detail-features">
          <div class="detail-feature"><span class="icon">${Icons.truck}</span> Mi\u1EC5n ph\xED v\u1EADn chuy\u1EC3n</div>
          <div class="detail-feature"><span class="icon">${Icons.check}</span> Ch\xEDnh h\xE3ng 100%</div>
          <div class="detail-feature"><span class="icon">${Icons.refresh}</span> \u0110\u1ED5i tr\u1EA3 30 ng\xE0y</div>
          <div class="detail-feature"><span class="icon">${Icons.shield}</span> B\u1EA3o h\xE0nh 12 th\xE1ng</div>
        </div>
        <div class="detail-actions">
          <form method="POST" action="/cart/add" style="flex:1;display:flex">
            <input type="hidden" name="id" value="${p.id}">
            <button class="btn btn-cyber" type="submit" style="flex:1">${Icons.cart} <span>Th\xEAm v\xE0o gi\u1ECF h\xE0ng</span></button>
          </form>
          <a href="/" class="btn btn-outline" style="display:inline-flex;align-items:center;gap:6px">${Icons.arrowLeft} <span>Ti\u1EBFp t\u1EE5c mua</span></a>
        </div>
      </div>
    </div>
  </main>
  ${footerSection()}`;
  return c.html(layout(p.name, body, cart, { noHero: true }));
});
app.get("/cart", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  if (cart.length === 0) {
    const body2 = `<main><div class="empty"><div class="empty-icon" style="color:var(--primary);display:inline-flex;justify-content:center">${Icons.cart}</div><h3>Gi\u1ECF h\xE0ng tr\u1ED1ng</h3><p>B\u1EA1n ch\u01B0a c\xF3 s\u1EA3n ph\u1EA9m n\xE0o trong gi\u1ECF h\xE0ng.</p><a href="/" class="btn" style="display:inline-flex;align-items:center;gap:8px">${Icons.home} <span>Kh\xE1m ph\xE1 s\u1EA3n ph\u1EA9m</span></a></div></main>${footerSection()}`;
    return c.html(layout("Gi\u1ECF h\xE0ng", body2, cart, { noHero: true }));
  }
  let subtotal = 0;
  let totalSaved = 0;
  const items = cart.map((item) => {
    const p = products.find((x) => x.id === item.id);
    if (!p)
      return "";
    const sub = p.price * item.qty;
    subtotal += sub;
    totalSaved += (p.originalPrice - p.price) * item.qty;
    return `
      <div class="cart-item">
        <a href="/product/${p.id}"><img class="cart-item-img" src="${p.image}" alt="${p.name}"></a>
        <div class="cart-item-info">
          <div class="cart-item-name"><a href="/product/${p.id}">${p.name}</a></div>
          <div class="cart-item-price">${formatVND(p.price)}</div>
        </div>
        <div class="cart-item-qty">
          <form method="POST" action="/cart/add" style="display:contents">
            <input type="hidden" name="id" value="${p.id}">
            <input type="hidden" name="action" value="decrease">
            <button type="submit">\u2212</button>
          </form>
          <span>${item.qty}</span>
          <form method="POST" action="/cart/add" style="display:contents">
            <input type="hidden" name="id" value="${p.id}">
            <button type="submit">+</button>
          </form>
        </div>
        <div class="cart-item-subtotal">${formatVND(sub)}</div>
        <form method="POST" action="/cart/add" style="display:contents">
          <input type="hidden" name="id" value="${p.id}">
          <input type="hidden" name="action" value="remove">
          <button class="cart-item-remove" type="submit" title="X\xF3a">\u2715</button>
        </form>
      </div>`;
  }).join("");
  const body = `
  <main class="cart-container">
    <div class="section-header">
      <h2 style="display:flex;align-items:center;gap:10px">${Icons.cart} <span>Gi\u1ECF h\xE0ng c\u1EE7a b\u1EA1n</span></h2>
    </div>
    <div class="cart-layout">
      <div class="cart-items">${items}</div>
      <div class="cart-summary">
        <h3 style="display:flex;align-items:center;gap:8px">${Icons.check} <span>T\xF3m t\u1EAFt \u0111\u01A1n h\xE0ng</span></h3>
        <div class="summary-row"><span>T\u1EA1m t\xEDnh (${cartCount(cart)} s\u1EA3n ph\u1EA9m)</span><span>${formatVND(subtotal)}</span></div>
        <div class="summary-row save"><span>Ti\u1EBFt ki\u1EC7m \u0111\u01B0\u1EE3c</span><span>-${formatVND(totalSaved)}</span></div>
        <div class="summary-row"><span>Ph\xED v\u1EADn chuy\u1EC3n</span><span style="color:var(--success);font-weight:600">Mi\u1EC5n ph\xED</span></div>
        <div class="summary-row total"><span>T\u1ED5ng c\u1ED9ng</span><span class="val">${formatVND(subtotal)}</span></div>
        <button class="btn cart-checkout btn-cyber" onclick="alert('\u{1F389} C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 \u0111\u1EB7t h\xE0ng! \u0110\u01A1n h\xE0ng s\u1EBD \u0111\u01B0\u1EE3c x\u1EED l\xFD trong 24h.')">${Icons.bolt} <span>Thanh to\xE1n ngay</span></button>
        <a href="/" class="btn btn-outline cart-continue" style="display:inline-flex;align-items:center;justify-content:center;gap:8px">${Icons.arrowLeft} <span>Ti\u1EBFp t\u1EE5c mua s\u1EAFm</span></a>
      </div>
    </div>
  </main>
  ${footerSection()}`;
  return c.html(layout("Gi\u1ECF h\xE0ng", body, cart, { noHero: true }));
});
app.post("/cart/add", async (c) => {
  const body = await c.req.parseBody();
  const id = Number(body["id"]);
  const action = body["action"] || "add";
  if (!products.find((p) => p.id === id))
    return c.redirect("/");
  const cart = getCart(getCookie(c, "cart"));
  if (action === "remove") {
    const idx = cart.findIndex((i) => i.id === id);
    if (idx !== -1)
      cart.splice(idx, 1);
  } else if (action === "decrease") {
    const existing = cart.find((i) => i.id === id);
    if (existing) {
      existing.qty--;
      if (existing.qty <= 0) {
        const idx = cart.findIndex((i) => i.id === id);
        if (idx !== -1)
          cart.splice(idx, 1);
      }
    }
  } else {
    const existing = cart.find((i) => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id, qty: 1 });
    }
  }
  setCookie(c, "cart", encodeURIComponent(JSON.stringify(cart)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  if (action === "add") {
    return c.redirect(`/?added=${id}`);
  }
  return c.redirect("/cart");
});
var pages = {
  "doi-tra": {
    title: "Ch\xEDnh s\xE1ch \u0111\u1ED5i tr\u1EA3",
    icon: Icons.refresh,
    sections: [
      {
        heading: "1. \u0110i\u1EC1u ki\u1EC7n \u0111\u1ED5i tr\u1EA3",
        content: `
          <ul>
            <li>S\u1EA3n ph\u1EA9m c\xF2n nguy\xEAn h\u1ED9p, ph\u1EE5 ki\u1EC7n \u0111i k\xE8m \u0111\u1EA7y \u0111\u1EE7</li>
            <li>S\u1EA3n ph\u1EA9m kh\xF4ng c\xF3 d\u1EA5u hi\u1EC7u va \u0111\u1EADp, tr\u1EA7y x\u01B0\u1EDBc do ng\u01B0\u1EDDi d\xF9ng</li>
            <li>C\xF2n trong th\u1EDDi h\u1EA1n <strong>30 ng\xE0y</strong> k\u1EC3 t\u1EEB ng\xE0y mua</li>
            <li>C\xF3 h\xF3a \u0111\u01A1n mua h\xE0ng ho\u1EB7c m\xE3 \u0111\u01A1n h\xE0ng</li>
          </ul>`
      },
      {
        heading: "2. Quy tr\xECnh \u0111\u1ED5i tr\u1EA3",
        content: `
          <ol>
            <li><strong>B\u01B0\u1EDBc 1:</strong> Li\xEAn h\u1EC7 hotline <strong>0969610085</strong> ho\u1EB7c email <strong>nguyendiem1892005@gmail.com</strong></li>
            <li><strong>B\u01B0\u1EDBc 2:</strong> Nh\xE2n vi\xEAn x\xE1c nh\u1EADn y\xEAu c\u1EA7u v\xE0 h\u01B0\u1EDBng d\u1EABn g\u1EEDi h\xE0ng</li>
            <li><strong>B\u01B0\u1EDBc 3:</strong> G\u1EEDi s\u1EA3n ph\u1EA9m v\u1EC1 Cellphone X (mi\u1EC5n ph\xED v\u1EADn chuy\u1EC3n)</li>
            <li><strong>B\u01B0\u1EDBc 4:</strong> Ki\u1EC3m tra s\u1EA3n ph\u1EA9m v\xE0 ho\xE0n ti\u1EC1n/\u0111\u1ED5i m\u1EDBi trong <strong>3-5 ng\xE0y l\xE0m vi\u1EC7c</strong></li>
          </ol>`
      },
      {
        heading: "3. C\xE1c tr\u01B0\u1EDDng h\u1EE3p \u0111\u01B0\u1EE3c \u0111\u1ED5i m\u1EDBi",
        content: `
          <ul>
            <li>S\u1EA3n ph\u1EA9m b\u1ECB l\u1ED7i k\u1EF9 thu\u1EADt do nh\xE0 s\u1EA3n xu\u1EA5t</li>
            <li>S\u1EA3n ph\u1EA9m giao kh\xF4ng \u0111\xFAng m\u1EABu, m\xE0u s\u1EAFc, c\u1EA5u h\xECnh \u0111\xE3 \u0111\u1EB7t</li>
            <li>S\u1EA3n ph\u1EA9m b\u1ECB h\u01B0 h\u1ECFng trong qu\xE1 tr\xECnh v\u1EADn chuy\u1EC3n</li>
          </ul>`
      },
      {
        heading: "4. Ph\u01B0\u01A1ng th\u1EE9c ho\xE0n ti\u1EC1n",
        content: `<p>Ho\xE0n ti\u1EC1n qua chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng trong v\xF2ng <strong>3-5 ng\xE0y l\xE0m vi\u1EC7c</strong> sau khi x\xE1c nh\u1EADn \u0111\u1ED5i tr\u1EA3 th\xE0nh c\xF4ng. V\u1EDBi thanh to\xE1n th\u1EBB t\xEDn d\u1EE5ng, th\u1EDDi gian ho\xE0n ti\u1EC1n t\xF9y thu\u1ED9c v\xE0o ng\xE2n h\xE0ng ph\xE1t h\xE0nh (5-15 ng\xE0y).</p>`
      }
    ]
  },
  "bao-hanh": {
    title: "Ch\xEDnh s\xE1ch b\u1EA3o h\xE0nh",
    icon: Icons.shield,
    sections: [
      {
        heading: "1. Th\u1EDDi gian b\u1EA3o h\xE0nh",
        content: `
          <table class="policy-table">
            <thead><tr><th>Lo\u1EA1i s\u1EA3n ph\u1EA9m</th><th>Th\u1EDDi gian</th><th>H\xECnh th\u1EE9c</th></tr></thead>
            <tbody>
              <tr><td>\u0110i\u1EC7n tho\u1EA1i</td><td>12 th\xE1ng</td><td>H\xE3ng + Cellphone X</td></tr>
              <tr><td>Laptop</td><td>12 th\xE1ng</td><td>H\xE3ng + Cellphone X</td></tr>
              <tr><td>Tablet</td><td>12 th\xE1ng</td><td>H\xE3ng + Cellphone X</td></tr>
              <tr><td>Ph\u1EE5 ki\u1EC7n</td><td>6 th\xE1ng</td><td>Cellphone X</td></tr>
              <tr><td>\u0110\u1ED3ng h\u1ED3</td><td>12 th\xE1ng</td><td>H\xE3ng</td></tr>
            </tbody>
          </table>`
      },
      {
        heading: "2. \u0110i\u1EC1u ki\u1EC7n b\u1EA3o h\xE0nh",
        content: `
          <ul>
            <li>S\u1EA3n ph\u1EA9m c\xF2n trong th\u1EDDi h\u1EA1n b\u1EA3o h\xE0nh</li>
            <li>Tem b\u1EA3o h\xE0nh c\xF2n nguy\xEAn v\u1EB9n, kh\xF4ng b\u1ECB r\xE1ch hay t\u1EA9y x\xF3a</li>
            <li>S\u1EA3n ph\u1EA9m b\u1ECB l\u1ED7i do nh\xE0 s\u1EA3n xu\u1EA5t (kh\xF4ng do t\xE1c \u0111\u1ED9ng b\xEAn ngo\xE0i)</li>
            <li>C\xF3 phi\u1EBFu b\u1EA3o h\xE0nh ho\u1EB7c h\xF3a \u0111\u01A1n mua h\xE0ng</li>
          </ul>`
      },
      {
        heading: "3. Tr\u01B0\u1EDDng h\u1EE3p kh\xF4ng b\u1EA3o h\xE0nh",
        content: `
          <ul>
            <li>S\u1EA3n ph\u1EA9m h\u1EBFt th\u1EDDi h\u1EA1n b\u1EA3o h\xE0nh</li>
            <li>H\u01B0 h\u1ECFng do va \u0111\u1EADp, r\u01A1i v\u1EE1, v\xE0o n\u01B0\u1EDBc</li>
            <li>T\u1EF1 \xFD th\xE1o l\u1EAFp, s\u1EEDa ch\u1EEFa b\u1EDFi b\xEAn th\u1EE9 ba</li>
            <li>L\u1ED7i do s\u1EED d\u1EE5ng sai c\xE1ch, c\xE0i ph\u1EA7n m\u1EC1m \u0111\u1ED9c h\u1EA1i</li>
            <li>Hao m\xF2n t\u1EF1 nhi\xEAn: pin, m\xE0n h\xECnh burn-in</li>
          </ul>`
      },
      {
        heading: "4. Li\xEAn h\u1EC7 b\u1EA3o h\xE0nh",
        content: `<p>Mang s\u1EA3n ph\u1EA9m tr\u1EF1c ti\u1EBFp \u0111\u1EBFn c\u1EEDa h\xE0ng Cellphone X ho\u1EB7c g\u1ECDi hotline <strong>0969610085</strong> \u0111\u1EC3 \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3. Th\u1EDDi gian b\u1EA3o h\xE0nh: <strong>7-14 ng\xE0y l\xE0m vi\u1EC7c</strong> t\xF9y t\xECnh tr\u1EA1ng s\u1EA3n ph\u1EA9m.</p>`
      }
    ]
  },
  "van-chuyen": {
    title: "Ch\xEDnh s\xE1ch v\u1EADn chuy\u1EC3n",
    icon: Icons.truck,
    sections: [
      {
        heading: "1. Ph\u1EA1m vi giao h\xE0ng",
        content: `<p>Cellphone X giao h\xE0ng <strong>to\xE0n qu\u1ED1c</strong> th\xF4ng qua c\xE1c \u0111\u1ED1i t\xE1c v\u1EADn chuy\u1EC3n uy t\xEDn: Giao H\xE0ng Nhanh, Giao H\xE0ng Ti\u1EBFt Ki\u1EC7m, J&T Express, Viettel Post.</p>`
      },
      {
        heading: "2. Th\u1EDDi gian giao h\xE0ng",
        content: `
          <table class="policy-table">
            <thead><tr><th>Khu v\u1EF1c</th><th>Th\u1EDDi gian</th><th>Ph\xED v\u1EADn chuy\u1EC3n</th></tr></thead>
            <tbody>
              <tr><td>N\u1ED9i th\xE0nh TP.HCM, H\xE0 N\u1ED9i</td><td>1-2 ng\xE0y</td><td style="color:var(--success);font-weight:600">Mi\u1EC5n ph\xED</td></tr>
              <tr><td>Ngo\u1EA1i th\xE0nh</td><td>2-3 ng\xE0y</td><td style="color:var(--success);font-weight:600">Mi\u1EC5n ph\xED</td></tr>
              <tr><td>T\u1EC9nh th\xE0nh kh\xE1c</td><td>3-5 ng\xE0y</td><td style="color:var(--success);font-weight:600">Mi\u1EC5n ph\xED</td></tr>
              <tr><td>V\xF9ng s\xE2u, v\xF9ng xa, h\u1EA3i \u0111\u1EA3o</td><td>5-7 ng\xE0y</td><td>30.000\u0111</td></tr>
            </tbody>
          </table>`
      },
      {
        heading: "3. Theo d\xF5i \u0111\u01A1n h\xE0ng",
        content: `<p>Sau khi \u0111\u1EB7t h\xE0ng, b\u1EA1n s\u1EBD nh\u1EADn \u0111\u01B0\u1EE3c m\xE3 v\u1EADn \u0111\u01A1n qua SMS/Email \u0111\u1EC3 theo d\xF5i tr\u1EA1ng th\xE1i giao h\xE0ng realtime tr\xEAn website c\u1EE7a \u0111\u01A1n v\u1ECB v\u1EADn chuy\u1EC3n.</p>`
      },
      {
        heading: "4. Ki\u1EC3m tra h\xE0ng khi nh\u1EADn",
        content: `
          <ul>
            <li>Ki\u1EC3m tra b\xEAn ngo\xE0i ki\u1EC7n h\xE0ng tr\u01B0\u1EDBc khi k\xFD nh\u1EADn</li>
            <li>Quay video unbox \u0111\u1EC3 l\xE0m b\u1EB1ng ch\u1EE9ng n\u1EBFu c\xF3 v\u1EA5n \u0111\u1EC1</li>
            <li>T\u1EEB ch\u1ED1i nh\u1EADn n\u1EBFu h\xE0ng b\u1ECB m\xF3p, r\xE1ch, \u01B0\u1EDBt b\u1EA5t th\u01B0\u1EDDng</li>
            <li>Li\xEAn h\u1EC7 hotline ngay n\u1EBFu s\u1EA3n ph\u1EA9m kh\xF4ng \u0111\xFAng \u0111\u01A1n</li>
          </ul>`
      }
    ]
  },
  faq: {
    title: "C\xE2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p",
    icon: Icons.help,
    sections: [
      {
        heading: "S\u1EA3n ph\u1EA9m t\u1EA1i Cellphone X c\xF3 ch\xEDnh h\xE3ng kh\xF4ng?",
        content: `<p>100% s\u1EA3n ph\u1EA9m t\u1EA1i Cellphone X \u0111\u1EC1u l\xE0 h\xE0ng <strong>ch\xEDnh h\xE3ng</strong>, nh\u1EADp kh\u1EA9u tr\u1EF1c ti\u1EBFp t\u1EEB nh\xE0 ph\xE2n ph\u1ED1i \u1EE7y quy\u1EC1n. M\u1ED7i s\u1EA3n ph\u1EA9m \u0111\u1EC1u c\xF3 tem ch\u1ED1ng gi\u1EA3 v\xE0 phi\u1EBFu b\u1EA3o h\xE0nh \u0111\u1EA7y \u0111\u1EE7.</p>`
      },
      {
        heading: "T\xF4i c\xF3 th\u1EC3 thanh to\xE1n b\u1EB1ng h\xECnh th\u1EE9c n\xE0o?",
        content: `
          <ul>
            <li><strong>Thanh to\xE1n khi nh\u1EADn h\xE0ng (COD)</strong> \u2014 Tr\u1EA3 ti\u1EC1n m\u1EB7t cho shipper</li>
            <li><strong>Chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng</strong> \u2014 Nh\u1EADn th\xF4ng tin sau khi \u0111\u1EB7t h\xE0ng</li>
            <li><strong>V\xED \u0111i\u1EC7n t\u1EED</strong> \u2014 MoMo, ZaloPay, VNPay</li>
            <li><strong>Th\u1EBB t\xEDn d\u1EE5ng/ghi n\u1EE3</strong> \u2014 Visa, Mastercard, JCB</li>
            <li><strong>Tr\u1EA3 g\xF3p 0%</strong> \u2014 Qua th\u1EBB t\xEDn d\u1EE5ng ho\u1EB7c c\xF4ng ty t\xE0i ch\xEDnh</li>
          </ul>`
      },
      {
        heading: "T\xF4i c\xF3 th\u1EC3 h\u1EE7y \u0111\u01A1n h\xE0ng kh\xF4ng?",
        content: `<p>B\u1EA1n c\xF3 th\u1EC3 h\u1EE7y \u0111\u01A1n h\xE0ng <strong>mi\u1EC5n ph\xED</strong> tr\u01B0\u1EDBc khi \u0111\u01A1n h\xE0ng \u0111\u01B0\u1EE3c giao cho \u0111\u01A1n v\u1ECB v\u1EADn chuy\u1EC3n. Sau khi \u0111\xE3 giao cho v\u1EADn chuy\u1EC3n, ph\xED h\u1EE7y \u0111\u01A1n l\xE0 <strong>20.000\u0111</strong> (ph\xED ship 1 chi\u1EC1u).</p>`
      },
      {
        heading: "L\xE0m sao \u0111\u1EC3 li\xEAn h\u1EC7 h\u1ED7 tr\u1EE3?",
        content: `
          <ul>
            <li><strong>Hotline:</strong> 0969610085 (8h-22h h\xE0ng ng\xE0y)</li>
            <li><strong>Live chat:</strong> Tr\u1EF1c ti\u1EBFp tr\xEAn website (8h-22h)</li>
            <li><strong>Email:</strong> nguyendiem1892005@gmail.com (ph\u1EA3n h\u1ED3i trong 24h)</li>
            <li><strong>C\u1EEDa h\xE0ng:</strong> TP. Th\xE1i Nguy\xEAn</li>
          </ul>`
      },
      {
        heading: "S\u1EA3n ph\u1EA9m c\xF3 \u0111\u01B0\u1EE3c d\xF9ng th\u1EED kh\xF4ng?",
        content: `<p>T\u1EA1i c\u1EEDa h\xE0ng Cellphone X, b\u1EA1n c\xF3 th\u1EC3 tr\u1EA3i nghi\u1EC7m tr\u1EF1c ti\u1EBFp t\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m tr\u01B0ng b\xE0y tr\u01B0\u1EDBc khi quy\u1EBFt \u0111\u1ECBnh mua. V\u1EDBi \u0111\u01A1n h\xE0ng online, b\u1EA1n c\xF3 <strong>30 ng\xE0y \u0111\u1ED5i tr\u1EA3</strong> n\u1EBFu kh\xF4ng h\xE0i l\xF2ng.</p>`
      }
    ]
  }
};
app.get("/page/:slug", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const slug = c.req.param("slug");
  const page = pages[slug];
  if (!page) {
    const body2 = `<main><div class="empty"><div class="empty-icon" style="color:var(--text-secondary);display:inline-flex;justify-content:center">${Icons.help}</div><h3>Trang kh\xF4ng t\u1ED3n t\u1EA1i</h3><p>Trang b\u1EA1n t\xECm ki\u1EBFm kh\xF4ng c\xF3 trong h\u1EC7 th\u1ED1ng.</p><a href="/" class="btn" style="display:inline-flex;align-items:center;gap:6px">${Icons.arrowLeft} <span>V\u1EC1 trang ch\u1EE7</span></a></div></main>${footerSection()}`;
    return c.html(layout("Kh\xF4ng t\xECm th\u1EA5y", body2, cart, { noHero: true }), 404);
  }
  const sectionsHtml = page.sections.map(
    (s, i) => `
      <div class="page-section" style="animation-delay:${i * 0.1}s">
        <h3>${s.heading}</h3>
        <div class="page-content">${s.content}</div>
      </div>`
  ).join("");
  const body = `
  <main>
    <div class="breadcrumb">
      <a href="/" style="display:inline-flex;align-items:center;gap:5px">${Icons.home} <span>Trang ch\u1EE7</span></a> <span class="sep">\u203A</span>
      <span>H\u1ED7 tr\u1EE3</span> <span class="sep">\u203A</span>
      <span style="color:var(--text)">${page.title}</span>
    </div>
    <div class="page-hero">
      <div class="page-hero-icon-box">${page.icon}</div>
      <h1>${page.title}</h1>
    </div>
    <div class="page-body">
      ${sectionsHtml}
    </div>
    <div style="text-align:center;margin-top:40px">
      <a href="/" class="btn btn-outline" style="display:inline-flex;align-items:center;gap:6px">${Icons.arrowLeft} <span>V\u1EC1 trang ch\u1EE7</span></a>
    </div>
  </main>
  ${footerSection()}`;
  return c.html(layout(page.title, body, cart, { noHero: true }));
});
var src_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-NJVeKN/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-NJVeKN/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
