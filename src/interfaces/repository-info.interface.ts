export interface RepositoryInfo {
  environment: 'unknown' | 'nodejs' | 'browser';
  monorepo: boolean;
  lastTag?: string;
  lastTagSha?: string;
  prevTag?: string;
  prevTagSha?: string;
  releaseId?: number;
  releaseName?: string;
  releaseTag?: string;
  releaseDate?: string;
  packages: PackageInfo[];
}

export interface PackageInfo {
  name: string;
  version: string;
  npmPublishedVersion?: string;
  description?: string;
  directory: string;
  isNpmPackage?: boolean;
  isDockerApp?: boolean;
  isPrivate?: boolean;
  buildDir: string;
}
