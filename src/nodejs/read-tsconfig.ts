import fs from 'node:fs';
import module from 'node:module';
import path from 'node:path';
import glob from 'fast-glob';
import type { PackageInfo } from '../interfaces/repository-info.interface.js';

const require = module.createRequire(import.meta.url);

export async function processTsConfig(
  project: PackageInfo,
  rootDir: string,
  pkgJson: any,
) {
  const files = glob.sync(path.join('tsconfig*build*.json'), {
    cwd: path.join(rootDir, project.directory),
  });
  if (!files.length) files.push('tsconfig.json');
  for (const file of files) {
    const fileName = path.join(rootDir, project.directory, file);
    if (!fs.existsSync(fileName)) continue;
    try {
      /** Read tsconfig */
      const tsConfig = await readTsConfig(fileName, rootDir);
      const buildDir = tsConfig.compilerOptions?.outDir || './';

      /** Find entry point */
      let main = '';
      const _exports = pkgJson.exports?.['.'];
      main = pkgJson.main;
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
    } catch (error: any) {
      throw new Error(
        `Error processing tsconfig file (${fileName}). ${error.message}`,
      );
    }
  }
}

async function readTsConfig(filename: string, rootDir: string) {
  if (!(filename.startsWith('.') || filename.startsWith('/'))) {
    filename = require.resolve(filename, { paths: [rootDir] });
  }
  let contents = fs.readFileSync(filename, 'utf-8');
  contents = contents.replace(/,\s*([\]}])/g, '$1');
  const tsConfig = JSON.parse(contents);
  let extendsObj: any = {};
  if (tsConfig.extends) {
    const extendsArray = Array.isArray(tsConfig.extends)
      ? tsConfig.extends
      : [tsConfig.extends];
    for (let f of extendsArray) {
      if (f.startsWith('.')) f = path.resolve(path.dirname(filename), f);
      const o = await readTsConfig(f, rootDir);
      extendsObj = {
        ...o,
        compilerOptions: {
          ...extendsObj.compilerOptions,
          ...o.compilerOptions,
        },
      };
    }
  }
  return {
    ...extendsObj,
    compilerOptions: {
      ...extendsObj.compilerOptions,
      ...tsConfig.compilerOptions,
    },
  };
}
