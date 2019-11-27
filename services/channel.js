import Request from "@utils/Request";

export const fetchDetail = data =>
  Request.get("", { data }).then(res => res.data);

export const fetchAppList = data =>
  Request.get("", { data }).then(res => res.data);

export const addChannel = data =>
  Request.post("", { data, successTip: true }).then(
    res => res.data
  );
export const updateChannel = data =>
  Request.post("", { data, successTip: true }).then(
    res => res.data
  );
