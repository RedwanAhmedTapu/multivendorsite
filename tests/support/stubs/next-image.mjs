// TEST-ONLY stand-in for next/image: a plain <img> (Next-only props dropped).
import { createElement } from "react";

export default function Image({ src, alt, fill: _fill, sizes, priority: _priority, unoptimized, ...rest }) {
  return createElement("img", { src, alt, "data-sizes": sizes, "data-unoptimized": String(Boolean(unoptimized)), ...rest });
}
