// TEST-ONLY stand-in for next/dynamic: renders a marker instead of loading
// the real component (e.g. the login modal), exposing the props tests check.
import { createElement } from "react";

export default function dynamic() {
  return function DynamicStub(props) {
    return createElement("div", { "data-dynamic-stub": "", "data-open": String(Boolean(props.isOpen)) });
  };
}
