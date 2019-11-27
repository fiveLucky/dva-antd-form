import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button } from "antd";
import Form from "@components/Form";
import Table from "@components/Table";
import A from "@components/A";
import Select from "@components/Select";
import { STATUS_DATA } from "@const";
import connect from "@HOC/connect";

function getColumns(dataSource) {
  return [
    {
      title: "id",
      dataIndex: "id",
      width: "10%"
    },
    {
      title: "用例",
      dataIndex: "name",
      width: "20%"
    },
    {
      title: "应用",
      dataIndex: "app_id",
      render: t => (
        <Select mode="multiple" view dataSource={dataSource} value={t} />
      )
    },
    {
      title: "状态",
      width: "10%",
      dataIndex: "status",
      render: t => <Select view dataSource={STATUS_DATA} value={t} />
    },
    {
      title: "操作",
      width: "15%",
      dataIndex: "operation",
      render: (t, { id }) => (
        <span>
          <A path="./list/detail" data={{ status: "view", id: id }}>
            查看
          </A>
          <A
            className="margin-left-middle"
            path="./list/detail"
            type="edit"
            data={{ status: "edit", id: id }}>
            编辑
          </A>
        </span>
      )
    }
  ];
}

const { Search, Field } = Form;
const ref = React.createRef();

@connect("channel")
export default class List extends Component {
  static propTypes = {
    history: PropTypes.object,
    state: PropTypes.object,
    dispatch: PropTypes.func
  };
  componentDidMount() {
    this.props.dispatch({
      type: "channel/fetchAppList"
    });
  }
  onClick = () => {
    this.props.history.pushWithQuery("./list/detail", { status: "add" });
  };
  onSubmit = values => {
    ref.current.fetchData(values);
  };

  render() {
    const { appList } = this.props.state;
    return (
      <div>
        <Search onSubmit={this.onSubmit} inlineSearch>
          <Field label="应用" bind="app_id">
            <Select placeholder="请选择应用名称" dataSource={appList} />
          </Field>
        </Search>
        <div className="align-left margin-bottom-middle">
          <Button type="primary" onClick={this.onClick}>
            新建用例
          </Button>
        </div>
        <Table
          ref={ref}
          autoLoad
          rowKey="id"
          url=""
          columns={getColumns(appList)}
          pagination={false}
        />
      </div>
    );
  }
}
