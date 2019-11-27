import React, { Component } from "react";
import PropTypes from "prop-types";
import { Input, Button } from "antd";
import connect from "@HOC/connect";
import loading from "@HOC/loading";
import Select from "@components/Select";
import Radio from "@components/Radio";
import Form from "@components/Form";
import { parse } from "query-string";
import { STATUS_DATA } from "@const";
import Tree from "@components/Tree";

const { Field } = Form;
const { AuthTree } = Tree;

@connect("channel")
@loading(props => {
  const { effects } = props.loading;
  return effects["channel/updateChannel"] || effects["channel/fetchDetail"];
})
export default class Detail extends Component {
  static propTypes = {
    dispatch: PropTypes.func,
    history: PropTypes.object
  };

  fetchDetail = () => {
    const { dispatch } = this.props;
    const query = parse(location.search);
    if (query.status !== "add") {
      dispatch({
        type: "channel/fetchDetail",
        payload: query.id
      });
    }
  };
  componentWillUnmount() {
    // 清空
    this.props.dispatch({
      type: "channel/resetState"
    });
  }
  onCancel = () => {
    this.props.history.replace("/channel/list");
  };
  onSubmit = () => {
    const query = parse(location.search);
    const type =
      query.status === "edit" ? "channel/updateChannel" : "channel/addChannel";
    this.props.dispatch({
      type,
      payload: {
        callback: this.onCancel
      }
    });
  };
  responseFilter = data =>
    data.map(d => ({
      label: d.app_name,
      value: `${d.app_id}`
    }));

  render() {
    const query = parse(location.search);
    const isView = query.status === "view";
    return (
      <Form
        onSubmit={this.onSubmit}
        actionTypeName="channel/updateDetail"
        fieldName="detail"
        view={isView}
      >
        <Field
          label="用例名称"
          bind="name"
          rules={{ message: "请输入用例名称", required: true }}>
          <Input allowClear placeholder="请输入用例名称" />
          <Field.Text />
        </Field>
        {query.status !== "add" && (
          <Field label="用例ID" bind="channel_id">
            <Field.Text />
          </Field>
        )}
        <Field
          label="应用"
          bind="app_id"
          rules={{ message: "请选择应用", required: true }}>
          <Select
            view={isView}
            placeholder="请选择应用"
            url="/api/app/list"
            responseFilter={this.responseFilter}
            mode="multiple"
          />
        </Field>
        <Field
          label="状态"
          bind="status"
          rules={{
            message: "请选择状态",
            required: true
          }}
        >
          <Radio
            view={isView}
            placeholder="请选择状态"
            dataSource={STATUS_DATA}
          />
        </Field>
        <Field
          label="权限"
          bind="authority"
          rules={{
            message: "请选择权限",
            required: true
          }}
        >
          <AuthTree responseCallback={this.fetchDetail} />
        </Field>
        <Field>
          <div className="margin-top-middle">
            <Button onClick={this.onCancel}>{isView ? "返回" : "取消"}</Button>
            {!isView && (
              <Button
                className="margin-left-middle"
                type="primary"
                htmlType="submit">
                保存
              </Button>
            )}
          </div>
        </Field>
      </Form>
    );
  }
}
