// Required fallback for the @main parallel route (Next.js build fails with
// "Missing required default.js file for parallel route" otherwise). Renders
// nothing for routes the slot does not explicitly cover.
export default function Default() {
  return null;
}
