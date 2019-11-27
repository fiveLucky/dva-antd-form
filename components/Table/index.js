import React from "react";
import PropTypes from "prop-types";
import { Table as T } from "antd";
import throttle from "lodash/throttle";
import Request from "@utils/Request";
import { withoutProps } from "@utils";

export default class Table extends React.PureComponent {
  static propTypes = {
    pagination: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    onChangePage: PropTypes.func,
    method: PropTypes.string,
    url: PropTypes.string,
    autoLoad: PropTypes.bool,
    searchParam: PropTypes.object
  };
  static defaultProps = {
    method: "get",
    onChangePage: () => {},
    url: "",
    autoLoad: false,
    searchParam: {}
  };
  constructor(props) {
    super(props);
    this.state = {
      scrollY: 0,
      dataSource: [],
      pageValue: {
        page: 1,
        pageSize: 10
      },
      param: props.searchParam,
      total: 0,
      loading: false
    };
    this.handleResize = throttle(this.handleResize, 100);
  }
  fetchData = (param = {}) => {
    // 缓存param，page其他事件发请求携带参数
    this.setState({ param });
    const { pageValue } = this.state;
    const { url, method } = this.props;
    this.setState({ loading: true });
    Request[method](url, {
      data: {
        ...pageValue,
        ...param
      }
    })
      .then(res => {
        this.setState({ loading: false });
        const { list, page } = res.data;
        // 如果接口无分页，前端分页
        if (!list) {
          this.setState({
            dataSource: res.data,
            total: res.data.length
          });
        } else {
          this.setState({
            dataSource: list,
            total: page.count
          });
        }
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  };
  handleResize = () => {
    const table = document.querySelector(".ant-table-wrapper");
    const y = document.body.offsetHeight - table.offsetTop - 54 - 64 - 24;
    this.setState({ scrollY: y });
  };
  componentDidMount() {
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
    if (this.props.autoLoad) {
      this.fetchData();
    }
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  onChangePage = (page, pageSize) => {
    this.props.onChangePage(page, pageSize);
    this.setState({ pageValue: { page, pageSize } }, () => {
      this.fetchData(this.state.param);
    });
  };
  render() {
    const { pagination = {}, ...nextProps } = this.props;
    const props = withoutProps(
      ["url", "autoLoad", "searchParam", "method"],
      nextProps
    );
    const { loading, total, scrollY, dataSource, pageValue } = this.state;
    return (
      <T
        scroll={pageValue.pageSize > 10 ? { y: scrollY } : undefined}
        dataSource={dataSource}
        {...props}
        loading={loading}
        pagination={
          pagination && {
            onShowSizeChange: this.onChangePage,
            // pageSize: 20,
            showTotal: total => `共${total}条`,
            total,
            showSizeChanger: true,
            onChange: this.onChangePage,
            ...pagination
          }
        }
      />
    );
  }
}
