import fs from 'node:fs';
import path from 'node:path';
import glob from 'fast-glob';
import * as jsonc from 'jsonc-parser';
import {
  PackageInfo,
  RepositoryInfo,
} from '../interfaces/repository-info.interface.js';
import { npmExists } from './check-npm.js';
import { setNpmrcValue } from './npmrc-utils.js';
import { processTsConfig } from './read-tsconfig.js';

export async function scanNodeJSEnvironment(args: {
  rootDir: string;
  token: string;
}): Promise<RepositoryInfo | undefined> {
  const output: RepositoryInfo = {
    environment: 'nodejs',
    monorepo: false,
    packages: [],
  };
  const fileName = path.join(args.rootDir, 'package.json');
  if (!fs.existsSync(fileName)) return;
  const rootJson = jsonc.parse(fs.readFileSync(fileName, 'utf-8'), undefined, {
    disallowComments: false,
    allowTrailingComma: true,
  });
  if (rootJson.workspaces) {
    output.monorepo = true;
    const dirs = glob.sync(rootJson.workspaces, {
      cwd: args.rootDir,
      onlyDirectories: true,
    });
    await Promise.all(
      dirs.map(async dir => {
        const project = await scanProject({
          ...args,
          dir,
        });
        if (project) output.packages.push(project);
      }),
    );
  } else {
    const project = await scanProject({
      ...args,
      dir: '.',
    });
    if (project) output.packages.push(project);
  }
  return output.packages.length ? output : undefined;
}

async function scanProject(args: {
  rootDir: string;
  token: string;
  dir: string;
}): Promise<PackageInfo | undefined> {
  const packageDir = path.join(args.rootDir, args.dir);
  /** Check package.json */
  let fileName = path.join(packageDir, 'package.json');
  if (!fs.existsSync(fileName)) return;
  const pkgJson = jsonc.parse(fs.readFileSync(fileName, 'utf-8'), undefined, {
    disallowComments: false,
    allowTrailingComma: true,
  });
  const dockerFileExists = fs.existsSync(path.join(packageDir, 'Dockerfile'));
  const project: PackageInfo = {
    name: pkgJson.name,
    version: pkgJson.version,
    description: pkgJson.description,
    directory: args.dir,
    buildDir: './',
  };
  if (!pkgJson.private || pkgJson.publishConfig || dockerFileExists) {
    if (dockerFileExists) {
      project.isDockerApp = true;
    } else {
      project.isNpmPackage = true;
    }
  } else project.isPrivate = true;

  /** Check if is a TypeScript project */
  fileName = path.join(packageDir, 'tsconfig.json');
  if (fs.existsSync(fileName)) {
    await processTsConfig(project, args.rootDir, pkgJson);
  }

  /** Check published version from npm repository */
  if (project.isNpmPackage) {
    setNpmrcValue('//npm.pkg.github.com/:_authToken', args.token, packageDir);
    project.npmPublishedVersion = await npmExists(project.name, {
      registry: pkgJson.publishConfig?.registry,
      cwd: packageDir,
    });
  }
  return project;
}
