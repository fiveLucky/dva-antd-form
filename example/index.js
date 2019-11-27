import dva from "dva";
import createLoading from "dva-loading";
import history from "@config/history";

// 加载全局配置
import "@config";
import "@style/index.less";

import models from "@models";
import router from "./router";

// 1. Initialize
const app = dva({
  history,
  onError() {}
});

// 2. Plugins
app.use(createLoading());

// 3. Model

Object.keys(models).forEach(model => {
  app.model(models[model]);
});

// 4. Router
app.router(router);

// 5. Start
app.start("#main");
