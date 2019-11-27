export function withoutProps(keys, props) {
  const obj = {};
  Object.keys(props).forEach(k => {
    if (!keys.includes(k)) {
      obj[k] = props[k];
    }
  });
  return obj;
}