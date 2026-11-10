// tests/support/tsx-loader.mjs
//
// TEST-ONLY Node module hooks so `node --test` can render real React
// components from src/ without adding dependencies:
//   - `.ts`/`.tsx` under src/ are transpiled with the project's own
//     `typescript` (JSX → react/jsx-runtime);
//   - `@/…` resolves to src/…, and extensionless relative imports are probed;
//   - `next/link`, `next/image`, `next/dynamic` and `next/navigation` resolve to small stubs
//     (./stubs) that render plain <a>/<img>/marker elements and expose the
//     props tests care about;
//   - `*.module.css` becomes a proxy that returns the class name it is asked
//     for, so rendered markup shows which module classes were applied.
// Registered from a test file with: register("./support/tsx-loader.mjs", import.meta.url)
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), "../../src");
const STUBS = new URL("./stubs/", import.meta.url);
const PROBE = [".tsx", ".ts", "/index.tsx", "/index.ts"];

function probe(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of PROBE) if (existsSync(base + ext)) return base + ext;
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/link") return { url: new URL("next-link.mjs", STUBS).href, shortCircuit: true };
  if (specifier === "next/image") return { url: new URL("next-image.mjs", STUBS).href, shortCircuit: true };
  if (specifier === "next/dynamic") return { url: new URL("next-dynamic.mjs", STUBS).href, shortCircuit: true };
  if (specifier === "next/navigation") return { url: new URL("next-navigation.mjs", STUBS).href, shortCircuit: true };

  let target = null;
  if (specifier.startsWith("@/") && specifier.endsWith(".json")) {
    target = resolvePath(SRC, specifier.slice(2));
    if (existsSync(target)) return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    target = probe(resolvePath(SRC, specifier.slice(2)));
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    target = probe(resolvePath(dirname(fileURLToPath(context.parentURL)), specifier));
  }
  if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && url.endsWith(".module.css")) {
    return {
      format: "module",
      shortCircuit: true,
      source: 'export default new Proxy({}, { get: (_t, key) => (typeof key === "string" ? key : undefined) });',
    };
  }
  // JSON under src/ (e.g. next-intl message catalogues) — Next bundles these;
  // plain Node would require an import attribute, so expose them as a default export.
  if (url.startsWith("file:") && url.endsWith(".json") && fileURLToPath(url).startsWith(SRC)) {
    const json = await readFile(fileURLToPath(url), "utf8");
    return { format: "module", shortCircuit: true, source: `export default ${JSON.stringify(JSON.parse(json))};` };
  }
  if (url.startsWith("file:") && /\.tsx?$/.test(url) && fileURLToPath(url).startsWith(SRC)) {
    const fileName = fileURLToPath(url);
    const source = await readFile(fileName, "utf8");
    const out = ts.transpileModule(source, {
      fileName,
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    });
    return { format: "module", shortCircuit: true, source: out.outputText };
  }
  return nextLoad(url, context);
}
