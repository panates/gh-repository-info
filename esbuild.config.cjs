const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: [__dirname + '/build/index.js'],
    bundle: true,
    platform: 'node',
    target: 'es2022',
    format: 'esm',
    outfile: __dirname + '/dist/index.js',
    // Fix for https://github.com/evanw/esbuild/pull/2067
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
  })
  .catch(() => process.exit(1));
