import queryString from "query-string";

const { stringify } = queryString;

const { Headers } = window;

/**
 * 构思一套新的中间件形式
 *
 * Request.use((next, done, ...args) => {
 *   next(args); // 表示把 data 传给下一个
 *   done(args); // 表示阻塞所有中间件直接结束
 * })
 */

function loopAsync(middleware, callback, ...data) {
  let currentTurn = 0;
  let isDone = false;
  let hasNext = false;
  const len = middleware.length;
  const self = this;

  function done(...args) {
    isDone = true;
    callback.call(self, ...args);
  }

  function next(...args) {
    if (isDone) return;
    hasNext = true;

    while (!isDone && currentTurn < len && hasNext) {
      hasNext = false;
      /* eslint-disable no-plusplus */
      middleware[currentTurn++].call(self, next, done, ...args);
    }

    if (currentTurn >= len && hasNext) {
      isDone = true;
      hasNext = false;
      callback.call(self, ...args);
    }
  }

  next(...data);
}

const makeStuct = () => ({
  // 请求体中间件
  sendHooks: [],
  // 响应体体中间件
  receiveHooks: [],
  // 错误处理中间件
  errorHooks: []
});

const publicHooks = makeStuct();

const afterPrivateHooks = makeStuct();

const useHook = hookMap => (type, hook) => {
  const key = `${type}Hooks`;

  if (typeof hook === "function") {
    hookMap[key].push(hook);
  } else {
    throw new Error("hook 必须是函数");
  }

  return () => {
    hookMap[key] = hookMap[key].filter(v => v !== hook);
  };
};

const mergeHooks = (first, ...rest) => {
  const hooks = {};

  Object.keys(first).forEach(key => {
    hooks[key] = rest.reduce((p, n) => p.concat(n[key]), first[key]);
  });

  return hooks;
};

const appendUrl = (url, str) =>
  `${url}${url.indexOf("?") > -1 ? "&" : "?"}${str}`;

export default class Request {
  hooks = makeStuct();

  beforePublicHooks = makeStuct();

  use = useHook(this.hooks);
  useBeforePublicHooks = useHook(this.beforePublicHooks);

  /**
   * 暴露给用户的 options 方法是这样的
   * {
   *   data: {},         // 要传输的数据
   *   headers: {},      // 请求头
   *   form: false,      // 请求数据格式
   *   errorTip: true,   // 显示错误提示
   *   successTip: true, // 显示成功提示
   *   onlyOnce: true,   // 禁止重复请求
   * }
   *
   * @param {String} url
   * @param {Object} params
   */
  fetch(url, params) {
    /**
     * 对于公共钩子来说，要有放置到 Private 最后的能力；
     * 对于私有钩子来说，要有放置到 Public 最前的能力；
     *
     *                  +-----------------+
     *                  |                 |
     *          +------>|  Before Public  |
     *          |       |                 |
     *          |       +-----------------+
     *          |       +-----------------+
     *          |       |                 |
     *   before Public  |   Public Hook   +-------+
     *          |       |                 |       |
     *          |       +-----------------+       |
     *          |       +-----------------+       |
     *          |       |                 |       |
     *          +-------+  Private Hook   |  after Private
     *                  |                 |       |
     *                  +-----------------+       |
     *                  +-----------------+       |
     *                  |                 |       |
     *                  |  After Private  |<------+
     *                  |                 |
     *                  +-----------------+
     */

    const h = mergeHooks(
      publicHooks,
      this.hooks,
      this.beforePublicHooks,
      afterPrivateHooks
    );

    const options = {
      url,
      errorTip: true,
      successTip: false,
      onlyOnce: false,
      ...params
    };

    options.headers = new Headers(options.headers || {});
    return new Promise((resolve, reject) => {
      const reqContext = { req: options, res: {} };
      loopAsync.call(reqContext, h.sendHooks, (e, block) => {
        if (e) {
          reject(e);
          return;
        }

        // 处理一下 onlyOnce 阻断的情况
        if (block) {
          return;
        }

        fetch(reqContext.req.url, reqContext.req)
          .then(
            d =>
              new Promise((res, rej) => {
                const resContext = { req: options, res: d };
                loopAsync.call(resContext, h.receiveHooks, ret => {
                  if (ret) rej(ret);

                  if (resContext.res) {
                    // 尽量将原始的返回值注入到返回的对象上
                    resContext.res.$context = resContext;
                  }
                  res(resContext.res);
                });
              })
          )
          .then(resolve)
          .catch(err => {
            const resContext = { req: options, res: err };
            // 异常处理没有异步一说了
            h.errorHooks.forEach(func => func.call(resContext, err));
            reject(err);
          });
      });
    });
  }
}

// 为了放置用户构造很多实例，搞一个单例大家用着
export const request = new Request();

Request.instance = () => new Request();

Request.get = (url, options) =>
  request.fetch(url, { ...options, method: "get" });

Request.post = (url, options) =>
  request.fetch(url, { ...options, method: "post" });

/**
 * 这里 use 的是公共钩子，实例的 use 是私有钩子
 *
 * 公共钩子永远在私有钩子前执行
 */
Request.use = useHook(publicHooks);

/**
 * 运行在私有钩子之后的公共钩子，比如对参数的最终处理
 */
Request.useAfterPrivateHooks = useHook(afterPrivateHooks);

/**
 * 用于卸载钩子
 */
Request.unuse = {};

// mock 钩子
Request.unuse.mockRequestHook = Request.use("send", function mockRequestHook(
  next
) {
  // const { req } = this;

  // if (window.WE_NEED_MOCK) {
  //   Cookie.set('project_id_cookie', config.MOCK_PROJECT_ID, { path: '/' });
  //   req.url = `/${config.APP_SOURCE}${req.url}`;
  //   req.headers.set('Mock-Request', 'bingo');
  // }

  next();
});

// onlyOnce 钩子
const uniqueRequestMap = {};

// 处理 onlyOnce 的请求体
Request.unuse.onlyOnceRequestHook = Request.use(
  "send",
  function onlyOnceRequestHook(next, done) {
    const { req } = this;

    const { url, method, body, form, onlyOnce } = req;
    if (onlyOnce) {
      const unique =
        method === "get"
          ? url
          : `${url}${form ? stringify(body) : JSON.stringify(body) || ""}`;

      req.uniqueMapKey = unique;

      if (uniqueRequestMap[unique]) {
        done(null, true);
      } else {
        uniqueRequestMap[unique] = true;
        req.url = appendUrl(req.url, `_time=${+new Date()}`);
        next();
      }
    } else {
      next();
    }
  }
);

/**
 * 请求体设置钩子
 *
 * 由于本钩子实际上最终生成了数据形式，为了方便业务操作
 * 本钩子置于所有请求请中间件之后
 */
Request.unuse.contentTypeRequestHook = Request.useAfterPrivateHooks(
  "send",
  function contentTypeRequestHook(next) {
    const { req } = this;

    if (/^get$/i.test(req.method)) {
      req.url = appendUrl(req.url, stringify(req.data));
    } else if (req.form) {
      req.headers.set(
        "Content-Type",
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      req.body = stringify(req.data);
    } else {
      req.headers.set("Content-Type", "application/json;charset=UTF-8");
      req.body = JSON.stringify(req.data);
    }
    req.credentials = "same-origin";

    next();
  }
);

// 处理 onlyOnce 的响应体
Request.unuse.onlyOnceResponseHook = Request.use(
  "receive",
  function onlyOnceResponseHook(next) {
    const { req } = this;

    if (req.onlyOnce) {
      delete uniqueRequestMap[req.uniqueMapKey];
    }

    next();
  }
);

// 处理 onlyOnce 失败的请求
Request.unuse.onlyOnceErrorHook = Request.use(
  "error",
  function onlyOnceErrorHook() {
    const { req } = this;

    if (req.onlyOnce) {
      delete uniqueRequestMap[req.uniqueMapKey];
    }
  }
);

const NEXT_REJECT = "@@Request/NextReject";
const NO_NEXT = "@@Request/NoNext";
const directNext = payload => Promise.reject({ action: NEXT_REJECT, payload });
const isDirect = d => {
  if (d && d.action === NEXT_REJECT) {
    return d.payload;
  }
  return NO_NEXT;
};

// 响应体设置钩子
Request.unuse.jsonResponseHook = Request.use(
  "receive",
  function jsonResponseHook(next, done) {
    const { res } = this;
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      const isJSONType =
        contentType && contentType.indexOf("application/json") > -1;
      res
        .json()
        .then(d => directNext(d))
        .catch(err => {
          const d = isDirect(err);
          if (d !== NO_NEXT || isJSONType) {
            // 以下两种情况需要透传下去
            // 1. 表示从上面的 directNext 过来的
            // 2. 表示 JSON 解析出错
            return Promise.reject(err);
          }
          // 否则需要做进一步处理
          return null;
        })
        .then(() => res.text())
        .then(d => directNext(d))
        .catch(err => {
          const d = isDirect(err);
          if (d !== NO_NEXT) {
            // 表示从上面的 directNext 过来的
            this.res = d;
            next();
          } else {
            err.response = res;
            done(err);
          }
        });
    } else {
      const err = new Error(
        `服务端异常! 状态码: ${res.status}, 异常信息: ${res.statusText}`
      );
      err.response = res;

      done(err);
    }
  }
);
