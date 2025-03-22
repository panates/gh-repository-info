import { RepositoryInfo } from './interfaces/repository-info.interface.js';
import { scanNodeJSEnvironment } from './nodejs/scan-nodejs-environment.js';

export async function scanEnvironment(args: {
  rootDir: string;
  token: string;
}): Promise<RepositoryInfo | undefined> {
  return await scanNodeJSEnvironment(args);
}
