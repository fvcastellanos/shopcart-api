import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export interface BuildInfo {
  nombre: string;
  version: string;
  commit: string;
  tag: string;
  branch: string;
}

interface PackageJson {
  name?: string;
  version?: string;
}

function readPackageJson(): PackageJson | null {
  try {
    return JSON.parse(readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')) as PackageJson;
  } catch {
    return null;
  }
}

function runGit(args: string[]): string | null {
  try {
    return execSync(`git ${args.join(' ')}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

// Precedencia: variable de entorno (entornos de despliegue sin .git) → git → fallback.
function resolve(envValue: string | undefined, gitArgs: string[], fallback: string): string {
  if (envValue && envValue.length > 0) return envValue;
  const fromGit = runGit(gitArgs);
  if (fromGit && fromGit.length > 0) return fromGit;
  return fallback;
}

const pkg = readPackageJson();

export const buildInfo: BuildInfo = {
  nombre: process.env.APP_NAME || pkg?.name || 'unknown',
  version: process.env.APP_VERSION || pkg?.version || 'unknown',
  commit: resolve(process.env.GIT_COMMIT, ['rev-parse', '--short', 'HEAD'], 'unknown'),
  tag: resolve(process.env.GIT_TAG, ['describe', '--tags', '--exact-match'], 'none'),
  branch: resolve(process.env.GIT_BRANCH, ['branch', '--show-current'], 'unknown'),
};
