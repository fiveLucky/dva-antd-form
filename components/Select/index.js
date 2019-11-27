import { Select } from "antd";
import React from "react";
import PropTypes from "prop-types";

import dataHandler from "@HOC/dataHandler";

const { Option } = Select;

function renderViewLabel(value = {}) {
  if (Array.isArray(value)) {
    return value.map(i => i.label).join(",");
  }
  return <span style={{ color: value.color }}>{value.label}</span>;
}

const S = React.forwardRef(function(props, ref) {
  const { value, dataSource, view, filter = r => r, ...nextProps } = props;
  let cur = dataSource.find(i => `${i.value}` === `${value}`);

  if (dataSource.length && nextProps.mode && Array.isArray(value)) {
    const map = dataSource.reduce((pre, cur) => {
      pre[cur.value] = cur;
      return pre;
    }, {});
    cur = value.map(i => map[i]).filter(Boolean);
  }
  return view ? (
    <span>{renderViewLabel(cur)}</span>
  ) : (
    <Select value={filter(value)} ref={ref} {...nextProps}>
      {dataSource.map(l => (
        <Option key={l.value} value={l.value}>
          {l.label}
        </Option>
      ))}
    </Select>
  );
});

S.propTypes = {
  value: PropTypes.any,
  dataSource: PropTypes.array,
  view: PropTypes.bool,
  filter: PropTypes.func
};

export default dataHandler(false)(S);
