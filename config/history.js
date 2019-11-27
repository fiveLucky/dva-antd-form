import { createBrowserHistory } from "history";
import queryString from "query-string";

const history = createBrowserHistory();

function stringify(path, param) {
  return param ? `${path}?${queryString.stringify(param)}` : path;
}
function push(path, param) {
  const url = stringify(path, param);
  history.push(url);
}
function replace(path, param) {
  const url = stringify(path, param);
  history.replace(url);
}

history.pushWithQuery = push;
history.replaceWithQuery = replace;

export default history;
