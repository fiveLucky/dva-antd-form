import Request from "@utils/Request";
import notification from "@components/Notification";
import { INVALID_TOKEN } from "@const";
import { gotoLogin, trimSearchData } from "@utils";

// notification 全局配置
notification.config({
  duration: 3
});

Request.use("send", function trimRequestHook(next) {
  const { req } = this;
  req.data = trimSearchData(req.data, 0);
  next();
});

// 使用业务自己的公用钩子
Request.use("receive", function messageResponseHook(next, done) {
  const { req, res } = this;
  // 判断请求成功失败的钩子
  if (res.status !== 200) {
    const error = new Error(res.msg || "请求失败");
    error.response = res;
    done(error);
  } else if (req.successTip) {
    const message =
      typeof req.successTip === "string" ? req.successTip : "操作成功";
    notification.success({ message });
  }

  // 注意: send 和 receive 钩子必须 next 或者 done！
  next();
});

Request.use("error", function displayErrorTipHook(error) {
  const { req } = this;
  if (error.response) {
    if (req.errorTip) {
      notification.error({ message: error.message });
    }
  }
});
