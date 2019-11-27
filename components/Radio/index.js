import React from "react";
import { Radio as R } from "antd";
import PropTypes from "prop-types";

const { Group } = R;

const Radio = React.forwardRef(function(props, ref) {
  const { dataSource = [], view, value, ...nextProps } = props;
  const cur = dataSource.find(d => d.value === value) || {};
  return (
    <Group ref={ref} {...nextProps} value={value}>
      {view ? (
        <span style={{ color: cur.color }}>{cur.label || ""}</span>
      ) : (
        dataSource.map(data => (
          <R style={{ color: data.color }} value={data.value} key={data.value}>
            {data.label}
          </R>
        ))
      )}
    </Group>
  );
});

Radio.propTypes = {
  value: PropTypes.any,
  dataSource: PropTypes.array,
  view: PropTypes.bool
};

export default Radio;
