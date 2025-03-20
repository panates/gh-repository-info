import { RepositoryInfo } from './interfaces/repository-info.interface.js';
import { scanNodeJSEnvironment } from './nodejs/scan-nodejs-environment.js';

export async function scanEnvironment(
  rootDir: string,
): Promise<RepositoryInfo | undefined> {
  return await scanNodeJSEnvironment(rootDir);
}
