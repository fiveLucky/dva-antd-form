/**
 * loading
 * @description 全局loading组件，整个页面loading
 * @example
 * @loading(props => {
      const { effects } = props.loading;
      return effects["channel/updateChannel"] || effects["channel/fetchDetail"];
    })
 */

import { Spin } from "antd";

const loading = getLoading => WrappedComponent => props => {
  const spinning = getLoading(props) || false;
  return (
    <Spin spinning={spinning}>
      <WrappedComponent {...props}></WrappedComponent>
    </Spin>
  );
};

export default loading;
