/**
 * connect
 * @author five
 * @description 高阶组件
 * @feature
 *  - 简化组件使用方式
 *  - 自动注入state
 *    - namespace是数组，eg：connect(['user','group']),
 *      component的props.state = { user:{}, group:{} }
 *      注意!!! 默认使用第一个 name 作为表单双绑的 model
 *    - namespace是字符串，eg：connect('user'), component的props.state = {}
 *    - namespace是 ALL_STATE，eg：connect('ALL_STATE')，component的props.state 拥有所有的state
 *  - 提供 Consumer 高阶组件，无限制层级传递props，让 wrappedComponent 拥有更多属性
 */

import { connect } from "dva";
import React from "react";

const { Provider, Consumer: C } = React.createContext();

export default namespace => WrappedComponent => {
  function mapStateToProps(state) {
    if (!namespace) {
      throw new Error("namespace 必须传入！");
    }
    let stateValue = {};
    if (Array.isArray(namespace)) {
      stateValue = namespace.reduce((pre, cur) => {
        pre[cur] = state[cur];
        return pre;
      }, {});
    } else {
      stateValue = state[namespace];
    }
    if (namespace === "ALL_STATE") {
      stateValue = state;
    }
    return { state: { ...stateValue }, loading: state.loading } || {};
  }
  const Com = props => (
    <Provider value={{ ...props, namespace }}>
      <WrappedComponent {...props}></WrappedComponent>
    </Provider>
  );
  return connect(namespace ? mapStateToProps : null)(Com);
};

export const Consumer = WrappedComponent => props => (
  <C>{values => <WrappedComponent {...values} {...props} />}</C>
);
