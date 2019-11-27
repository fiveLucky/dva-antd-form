/**
 * notification 通知组件
 * @author five
 * @feature 支持callback
 */

import { notification } from "antd";
import { NOTIFICATION_DELAY } from "@const";

const note = { ...notification };

const names = ["success", "error", "info", "warning", "warn"];

names.forEach(key => {
  note[key] = (param, callback) => {
    const timeout = param.duration || NOTIFICATION_DELAY;
    notification[key](param);
    setTimeout(callback, timeout * 1000);
  };
});

export default note;
