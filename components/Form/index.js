/**
 * Form 组件
 * @author five
 * @description 基于antd二次开发的Form组件
 * @feature
 *  - 支持表单双向绑定
 *  - 支持两种布局方式
 *  - Form 实例提供了所有 this.props.form 的属性和方法
 * @props (特有的属性)
 *  From：
 *    - fieldName：【双向绑定】 在 model.state中的字段名称 作为整个表单的数据对象
 *    - actionTypeName：【双向绑定】 更新数据的 action name，dva 的 namespace 原则
 *    - view：【编辑 & 查看】状态控制 结合 Field 组件 渲染不同元素
 *    - ...antd.Form.props
 *  Field：
 *    - bind：【双向绑定】字段名称
 *    - rules：校验规则，支持对象形式
 *    - options：getFieldDecorator的option
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { Form as F, Button } from "antd";
import { Consumer as C } from "../HOC/connect";
import { withoutProps } from "@utils";

import styles from "./index.less";

const FormItem = F.Item;
const { Provider, Consumer } = React.createContext();

@C
@F.create({
  mapPropsToFields(props) {
    const { fieldName, namespace } = props;
    const state = {};
    if (fieldName) {
      let model = {};
      if (Array.isArray(namespace)) {
        model = props.state[namespace[0]][fieldName];
      } else {
        model = props.state[fieldName];
      }
      if (!model) {
        throw new Error(
          `CustomFormError：name is called ${fieldName} state is undefined, please check your model.state`
        );
      }
      Object.keys(model).forEach(k => {
        state[k] = F.createFormField({
          value: model[k]
        });
      });
      return state;
    }
  },
  onValuesChange(props, curValue, allValues) {
    const { dispatch, actionTypeName } = props;
    if (dispatch && actionTypeName) {
      dispatch({
        type: actionTypeName,
        payload: allValues
      });
    }
  }
})
export default class Form extends Component {
  static propTypes = {
    form: PropTypes.object,
    onSubmit: PropTypes.func,
    children: PropTypes.node,
    className: PropTypes.string,
    view: PropTypes.bool,
    type: PropTypes.string,
    withSearch: PropTypes.bool,
    inlineSearch: PropTypes.bool
  };
  constructor(props) {
    super(props);
    Object.assign(this, props.form);
  }
  onSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onSubmit(values);
      }
    });
  };
  onClear = () => {
    this.props.form.resetFields();
  };
  render() {
    const {
      children,
      className,
      type = "normal", // inline normal
      withSearch = false,
      inlineSearch = false,
      form,
      view = false,
      ...nextProps
    } = this.props;
    const props = withoutProps(
      [
        "fieldName",
        "actionTypeName",
        "onSubmit",
        "staticContext",
        "dispatch",
        "state",
        "view",
        "history",
        "match",
        "location",
        "loading"
      ],
      nextProps
    );
    const value = {
      ...form,
      type,
      view
    };
    // 默认布局样式
    const labelCol = type === "inline" ? { span: 8, offset: 0 } : { span: 3 };
    return (
      <Provider value={value}>
        <F
          labelCol={labelCol}
          wrapperCol={{ span: type === "inline" ? 12 : 6 }}
          onSubmit={this.onSubmit}
          className={`${styles.form} ${className}`}
          {...props}>
          {[].concat(
            children,
            withSearch && inlineSearch ? (
              <Field key="field">
                <div>
                  <Button onClick={this.onClear}>清空</Button>
                  <Button
                    className="margin-left-middle"
                    type="primary"
                    htmlType="submit">
                    搜索
                  </Button>
                </div>
              </Field>
            ) : null
          )}
          {withSearch && !inlineSearch ? (
            <div className={styles.btnWrapper}>
              <Button onClick={this.onClear}>清空</Button>
              <Button
                className="margin-left-middle"
                type="primary"
                htmlType="submit">
                搜索
              </Button>
            </div>
          ) : null}
        </F>
      </Provider>
    );
  }
}

function Field(props) {
  const {
    bind,
    rules = { required: false },
    children,
    options = {},
    label = " ",
    show = true,
    ...nextProps
  } = props;
  // label最多支持8个字长度
  if (label === " ") {
    nextProps.colon = false;
  }

  return (
    <Consumer>
      {contextProps => {
        const { type, getFieldDecorator, view } = contextProps || {};
        let child = children;
        // React.Children.toArray(children);
        if (React.Children.count(children) > 1) {
          child = view ? child.slice(1, 2)[0] : child.slice(0, 1)[0];
        }
        return (
          show && (
            <div className={`${type === "inline" && styles.inlineStyle}`}>
              <FormItem label={label} {...nextProps}>
                {contextProps && bind
                  ? getFieldDecorator(bind, {
                      rules: [].concat(rules),
                      ...options
                    })(child)
                  : child}
              </FormItem>
            </div>
          )
        );
      }}
    </Consumer>
  );
}
Field.propTypes = {
  bind: PropTypes.string,
  label: PropTypes.string,
  initialValue: PropTypes.any,
  rules: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  children: PropTypes.node,
  options: PropTypes.object,
  show: PropTypes.bool
};

Field.Text = React.forwardRef(function Text(param, ref) {
  const { filter = r => r } = param;
  return (
    <span ref={ref} {...param}>
      {filter(param.value)}
    </span>
  );
});
Form.Field = Field;

function Search(props) {
  return (
    <div className={styles.search}>
      <Form type="inline" withSearch {...props}>
        {props.children}
      </Form>
    </div>
  );
}

Search.propTypes = {
  children: PropTypes.node
};

Form.Search = Search;

Form.Consumer = Com => props => (
  <Consumer>
    {contextProps => <Com {...props} form={contextProps}></Com>}
  </Consumer>
);
