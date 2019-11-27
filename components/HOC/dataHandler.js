import React, { useEffect, useState } from "react";
import Request from "@utils/Request";
import { Spin } from "antd";
import { withoutProps } from "@utils";
import hoistNonReactStatic from "hoist-non-react-statics";

const DataHandler = hasSpin => WrappedComponent => {
  const Handler = React.forwardRef((param, ref) => {
    const [state, setState] = useState({
      data: [],
      spinning: false
    });
    const {
      dataSource,
      url = "",
      method = "get",
      searchParam,
      responseFilter = r => r
    } = param;
    useEffect(() => {
      if (!url && !dataSource) {
        throw new Error("url 和 dataSorce 必须传一个！");
      }
      if (url) {
        setState({
          data: [],
          spinning: true
        });
        Request[method](url, { data: searchParam }).then(res => {
          const data = responseFilter(res.data || []) || [];
          setState({
            data,
            spinning: false
          });
        });
      }
    }, [url, searchParam]);
    const props = withoutProps(
      ["dataSource", "url", "searchParam", "method"],
      param
    );
    return (
      <Spin spinning={hasSpin && state.spinning}>
        <WrappedComponent
          {...props}
          ref={ref}
          // 默认优先使用dataSource
          dataSource={Array.isArray(dataSource) ? dataSource : state.data}
        ></WrappedComponent>
      </Spin>
    );
  });
  hoistNonReactStatic(Handler, WrappedComponent);
  return Handler;
};
export default DataHandler;
