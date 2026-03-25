import fs from 'node:fs';
import module from 'node:module';
import path from 'node:path';
import glob from 'fast-glob';
import * as jsonc from 'jsonc-parser';
import type { PackageInfo } from '../interfaces/repository-info.interface.js';

const require = module.createRequire(import.meta.url);

export function processTsConfig(
  project: PackageInfo,
  rootDir: string,
  pkgJson: any,
) {
  const files = glob.sync(path.join('tsconfig*build*.json'), {
    cwd: path.join(rootDir, project.directory),
  });
  if (!files.length) files.push('tsconfig.json');
  const file = files[0];
  if (!file) return;
  const fileName = path.join(rootDir, project.directory, file);
  if (!fs.existsSync(fileName)) return;
  try {
    /** Read tsconfig */
    const tsConfig = readTsConfig(fileName, rootDir);
    if (tsConfig.compilerOptions?.outDir) {
      const buildDir = tsConfig.compilerOptions.outDir;

      /** Find an entry point */
      const _exports = pkgJson.exports?.['.'];
      let main = pkgJson.main;
      let x = _exports?.require || _exports?.default;
      if (!main && x) {
        main = typeof x === 'string' ? x : x.default;
      }
      if (!main) {
        main = pkgJson.module;
        x = _exports?.import || _exports?.default;
        if (!main && x) {
          main = typeof x === 'string' ? x : x.default;
        }
      }
      main = main || './index.js';
      project.buildDir = path.join(
        buildDir,
        '.'.repeat(path.dirname(main).split('/').length),
      );
    } else project.buildDir = '.';
  } catch (error: any) {
    throw new Error(
      `Error processing tsconfig file (${fileName}). ${error.message}`,
      // @ts-ignore
      { cause: error },
    );
  }
}

function readTsConfig(filename: string, rootDir: string) {
  if (!(filename.startsWith('.') || filename.startsWith('/'))) {
    filename = require.resolve(filename, { paths: [rootDir] });
  }
  let contents = fs.readFileSync(filename, 'utf-8');
  contents = contents.replace(/,\s*([\]}])/g, '$1');
  const tsConfig = jsonc.parse(contents, undefined, {
    disallowComments: false,
    allowTrailingComma: true,
  });
  let extendsObj: any = {};
  if (tsConfig.extends) {
    const extendsArray = Array.isArray(tsConfig.extends)
      ? tsConfig.extends
      : [tsConfig.extends];
    for (let f of extendsArray) {
      if (f.startsWith('.')) f = path.resolve(path.dirname(filename), f);
      const o = readTsConfig(f, rootDir);
      extendsObj = {
        ...o,
        compilerOptions: {
          ...extendsObj?.compilerOptions,
          ...o?.compilerOptions,
        },
      };
    }
  }
  return {
    ...extendsObj,
    compilerOptions: {
      ...extendsObj?.compilerOptions,
      ...tsConfig?.compilerOptions,
    },
  };
}
