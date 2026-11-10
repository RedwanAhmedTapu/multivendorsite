// TEST-ONLY stand-in for next/link: a plain <a>, exposing `prefetch` as data-prefetch.
import { createElement } from "react";

export default function Link({ href, prefetch, children, ...rest }) {
  return createElement("a", { href, "data-prefetch": String(prefetch), ...rest }, children);
}
