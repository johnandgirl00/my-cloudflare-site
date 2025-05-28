var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-MrnR9v/strip-cf-connecting-ip-header.js
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

// node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...r2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((r3, o2, a, s) => (r4, ...c) => t2.push([o2.toUpperCase?.(), RegExp(`^${(s = (e + r4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), c, s]) && a, "get") }), routes: t2, ...r2, async fetch(e2, ...o2) {
  let a, s, c = new URL(e2.url), n = e2.query = { __proto__: null };
  for (let [e3, t3] of c.searchParams) n[e3] = n[e3] ? [].concat(n[e3], t3) : t3;
  e: try {
    for (let t3 of r2.before || []) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break e;
    t: for (let [r3, n2, l, i] of t2) if ((r3 == e2.method || "ALL" == r3) && (s = c.pathname.match(n2))) {
      e2.params = s.groups || {}, e2.route = i;
      for (let t3 of l) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break t;
    }
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  try {
    for (let t3 of r2.finally || []) a = await t3(a, e2.proxy ?? e2, ...o2) ?? a;
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  return a;
} }), "t");
var r = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (r2, o2 = {}) => {
  if (void 0 === r2 || r2 instanceof Response) return r2;
  const a = new Response(t2?.(r2) ?? r2, o2.url ? void 0 : o2);
  return a.headers.set("content-type", e), a;
}, "r");
var o = r("application/json; charset=utf-8", JSON.stringify);
var p = r("text/plain; charset=utf-8", String);
var f = r("text/html");
var u = r("image/jpeg");
var h = r("image/png");
var g = r("image/webp");

// src/utils.js
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 500) {
  return new Response(message, { status });
}
__name(errorResponse, "errorResponse");

// src/cronPrices.js
async function handleCronPrices(request, env) {
  try {
    await env.COINGECKO_DB.prepare(`
      CREATE TABLE IF NOT EXISTS coin_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coin_id TEXT,
        symbol TEXT,
        price_usd REAL,
        fetched_at TEXT
      );
    `).run();
    const apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
    const res = await fetch(apiUrl);
    if (!res.ok) {
      return errorResponse(`CoinGecko API error: ${res.status}`, 502);
    }
    const data = await res.json();
    const db = env.COINGECKO_DB;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const [coinId, info] of Object.entries(data)) {
      await db.prepare(`
          INSERT INTO coin_prices (coin_id, symbol, price_usd, fetched_at)
          VALUES (?, ?, ?, ?)
        `).bind(coinId, coinId.toUpperCase(), info.usd, now).run();
    }
    return jsonResponse({ result: "\u2705 Inserted prices into D1" });
  } catch (err) {
    return errorResponse(err.stack || err.toString(), 500);
  }
}
__name(handleCronPrices, "handleCronPrices");

// src/dataApi.js
async function handleDataApi(request, env) {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
    const rows = await env.COINGECKO_DB.prepare(
      `SELECT fetched_at AS timestamp, price_usd AS price
         FROM coin_prices
         WHERE fetched_at >= ?
         ORDER BY fetched_at ASC`
    ).bind(new Date(oneDayAgo).toISOString()).all();
    return jsonResponse(rows.results);
  } catch (err) {
    return errorResponse(err.stack || err.toString(), 500);
  }
}
__name(handleDataApi, "handleDataApi");

// src/uploadChart.js
async function handleUploadChart(request, env) {
  try {
    const contentType = request.headers.get("Content-Type") || "image/png";
    const key = `chart-${Date.now()}.png`;
    const buf = await request.arrayBuffer();
    await env.CHARTS.put(key, buf, {
      httpMetadata: { contentType }
    });
    return jsonResponse({ url: `/charts/${key}` });
  } catch (err) {
    return errorResponse(err.stack || err.toString(), 500);
  }
}
__name(handleUploadChart, "handleUploadChart");

// src/serveChart.js
async function handleServeChart(request, env, ctx) {
  const { key } = ctx.params;
  const obj = await env.CHARTS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata.contentType,
      "Cache-Control": "public, max-age=31536000"
    }
  });
}
__name(handleServeChart, "handleServeChart");

// src/index.js
var INDEX_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mobile Chart Example</title>
  <style>
    body{margin:0;padding:1rem;font-family:sans-serif;}
    #chart-container{width:100%;max-width:480px;margin:0 auto;}
    canvas{width:100%!important;height:auto!important;}
    #result-img{width:100%;margin-top:1rem;}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
</head>
<body>
  <h2>\uC2E4\uC2DC\uAC04 \uAC00\uACA9 \uCC28\uD2B8</h2>
  <div id="chart-container">
    <canvas id="myChart"></canvas>
    <img id="result-img" alt="Uploaded Chart">
  </div>
  <script>
    (async()=>{
      const dataArr=(await fetch('/api/data')).json();
      const labels=(await dataArr).map(d=>new Date(d.timestamp).toLocaleTimeString());
      const prices=(await dataArr).map(d=>d.price);
      const ctx=document.getElementById('myChart').getContext('2d');
      const chart=new Chart(ctx,{type:'line',data:{labels,datasets:[{data:prices,borderColor:'teal',backgroundColor:'rgba(0,128,128,0.2)',pointRadius:0} ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false}}}});
      const dataURL=chart.toBase64Image();
      const blob=await (await fetch(dataURL)).blob();
      const buffer=await blob.arrayBuffer();
      const {url}=await fetch('/api/upload-chart',{method:'POST',headers:{'Content-Type':'image/png'},body:buffer}).then(r=>r.json());
      document.getElementById('result-img').src=url;
    })();
  <\/script>
</body>
</html>`;
var router = t();
router.get("/cron/prices", handleCronPrices);
router.get("/api/data", handleDataApi);
router.post("/api/upload-chart", handleUploadChart);
router.get("/charts/:key", handleServeChart);
router.get(
  "/",
  () => new Response(INDEX_HTML, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  })
);
router.all("*", () => new Response("Not found", { status: 404 }));
var src_default = {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};

// ../../usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// ../../usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-MrnR9v/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-MrnR9v/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
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
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
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
