/**
 * GitHub Integration Service
 * Fetches repository data from GitHub for codebase analysis
 */

import { getGitHubToken } from './api-keys';

export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string | null;
  language: string | null;
  private: boolean;
  stars: number;
  url: string;
}

export interface TreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

export interface AnalysisPayload {
  repoInfo: RepoInfo;
  packageJson?: Record<string, unknown>;
  readme?: string;
  srcFiles: FileContent[];
  configFiles: FileContent[];
  /** Any errors that occurred while fetching individual files (non-fatal) */
  fetchErrors?: string[];
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}

export interface FetchProgressCallback {
  (progress: {
    current: number;
    total: number;
    currentFile?: string;
  }): void;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    // https://github.com/owner/repo
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/,
    // https://github.com/owner/repo.git
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\.git$/,
    // git@github.com:owner/repo.git
    /^git@github\.com:([^/]+)\/([^/]+)\.git$/,
    // owner/repo format
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }
  }

  return null;
}

/**
 * Create headers for GitHub API requests
 */
function getHeaders(): HeadersInit {
  const token = getGitHubToken();
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Get rate limit info from response headers
 */
function getRateLimitFromHeaders(headers: Headers): RateLimitInfo {
  return {
    remaining: parseInt(headers.get('x-ratelimit-remaining') ?? '0', 10),
    limit: parseInt(headers.get('x-ratelimit-limit') ?? '60', 10),
    resetAt: new Date(parseInt(headers.get('x-ratelimit-reset') ?? '0', 10) * 1000),
  };
}

let lastRateLimit: RateLimitInfo | null = null;

/**
 * Get current rate limit status
 */
export function getRateLimit(): RateLimitInfo | null {
  return lastRateLimit;
}

/**
 * Fetch repository information
 */
export async function getRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: getHeaders() }
  );

  lastRateLimit = getRateLimitFromHeaders(response.headers);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found. Check the URL or add a GitHub token for private repos.');
    }
    if (response.status === 403) {
      throw new Error('Rate limit exceeded. Add a GitHub token for higher limits.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    description: data.description,
    language: data.language,
    private: data.private,
    stars: data.stargazers_count,
    url: data.html_url,
  };
}

/**
 * Get repository file tree
 */
export async function getTree(owner: string, repo: string, branch: string): Promise<TreeItem[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: getHeaders() }
  );

  lastRateLimit = getRateLimitFromHeaders(response.headers);

  if (!response.ok) {
    throw new Error(`Failed to fetch tree: ${response.status}`);
  }

  const data = await response.json();

  return data.tree.map((item: { path: string; type: string; size?: number }) => ({
    path: item.path,
    type: item.type as 'blob' | 'tree',
    size: item.size,
  }));
}

/**
 * Fetch a single file's content
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: getHeaders() }
  );

  lastRateLimit = getRateLimitFromHeaders(response.headers);

  if (!response.ok) {
    throw new Error(`Failed to fetch file ${path}: ${response.status}`);
  }

  const data = await response.json();

  if (data.encoding === 'base64') {
    return atob(data.content.replace(/\n/g, ''));
  }

  return data.content;
}

/**
 * Files to prioritize for analysis
 */
const ANALYSIS_FILES = {
  config: [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
    'vite.config.ts',
    'vite.config.js',
    'nuxt.config.ts',
    'nuxt.config.js',
    'wrangler.toml',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
  ],
  docs: [
    'README.md',
    'readme.md',
    'README',
  ],
  source: [
    // Entry points
    'src/index.ts',
    'src/index.tsx',
    'src/main.ts',
    'src/main.tsx',
    'src/App.tsx',
    'src/app.tsx',
    'app/page.tsx',
    'app/layout.tsx',
    'pages/index.tsx',
    'pages/_app.tsx',
    // API routes patterns
    'src/api/',
    'pages/api/',
    'app/api/',
    // Feature directories
    'src/features/',
    'src/modules/',
    'src/components/',
    'src/services/',
    'src/lib/',
  ],
};

/**
 * Filter tree to get analysis-relevant files
 */
function filterTreeForAnalysis(tree: TreeItem[]): string[] {
  const files: string[] = [];

  // Add config files
  for (const configFile of ANALYSIS_FILES.config) {
    if (tree.some(item => item.path === configFile)) {
      files.push(configFile);
    }
  }

  // Add doc files
  for (const docFile of ANALYSIS_FILES.docs) {
    if (tree.some(item => item.path === docFile)) {
      files.push(docFile);
      break; // Only need one README
    }
  }

  // Add source files - increased limits for better analysis
  const sourceFiles = tree
    .filter(item =>
      item.type === 'blob' &&
      (item.path.endsWith('.ts') || item.path.endsWith('.tsx') || item.path.endsWith('.js') || item.path.endsWith('.jsx')) &&
      !item.path.includes('.test.') &&
      !item.path.includes('.spec.') &&
      !item.path.includes('__tests__') &&
      !item.path.includes('__mocks__') &&
      !item.path.includes('node_modules') &&
      !item.path.includes('.d.ts') && // Skip type declarations
      (item.size ?? 0) < 100000 // Skip files > 100KB (increased from 50KB)
    )
    .sort((a, b) => {
      // Prioritize certain directories for better feature detection
      const priority = (path: string) => {
        // Highest priority: entry points and layouts
        if (path.match(/^(app|pages)\/(page|layout|index)\.(ts|tsx|js|jsx)$/)) return 0;
        if (path.match(/^src\/(App|main|index)\.(ts|tsx|js|jsx)$/)) return 0;

        // High priority: route handlers and API endpoints
        if (path.includes('/api/')) return 1;
        if (path.startsWith('app/')) return 2;
        if (path.startsWith('pages/')) return 2;

        // Medium priority: feature-related directories
        if (path.includes('/features/')) return 3;
        if (path.includes('/modules/')) return 3;
        if (path.includes('/services/')) return 4;
        if (path.includes('/components/')) return 5;
        if (path.includes('/lib/')) return 5;
        if (path.includes('/hooks/')) return 5;

        // Lower priority: other src files
        if (path.startsWith('src/')) return 6;
        return 7;
      };
      return priority(a.path) - priority(b.path);
    })
    .slice(0, 50); // Increased from 30 to 50 source files

  files.push(...sourceFiles.map(f => f.path));

  return files;
}

/**
 * Fetch all files needed for analysis
 */
export async function fetchForAnalysis(
  url: string,
  onProgress?: FetchProgressCallback
): Promise<AnalysisPayload> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL');
  }

  const { owner, repo } = parsed;

  // Get repo info first
  const repoInfo = await getRepoInfo(owner, repo);

  // Get file tree
  const tree = await getTree(owner, repo, repoInfo.defaultBranch);

  // Filter to relevant files
  const filesToFetch = filterTreeForAnalysis(tree);

  // Report initial progress
  onProgress?.({ current: 0, total: filesToFetch.length });

  // Fetch files in batches to avoid rate limits
  const batchSize = 5;
  const fetchedFiles: FileContent[] = [];
  const errors: string[] = [];

  for (let i = 0; i < filesToFetch.length; i += batchSize) {
    const batch = filesToFetch.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (path) => {
        const content = await getFileContent(owner, repo, path, repoInfo.defaultBranch);
        return { path, content, size: content.length };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        fetchedFiles.push(result.value);
      } else {
        errors.push(result.reason?.message ?? 'Unknown error');
      }
    }

    // Report progress after each batch
    onProgress?.({
      current: Math.min(i + batchSize, filesToFetch.length),
      total: filesToFetch.length,
      currentFile: batch[batch.length - 1],
    });

    // Small delay between batches to be nice to the API
    if (i + batchSize < filesToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Separate files by type
  const packageJsonFile = fetchedFiles.find(f => f.path === 'package.json');
  const readmeFile = fetchedFiles.find(f =>
    f.path.toLowerCase().startsWith('readme')
  );
  const configFiles = fetchedFiles.filter(f =>
    ANALYSIS_FILES.config.includes(f.path)
  );
  const srcFiles = fetchedFiles.filter(f =>
    !ANALYSIS_FILES.config.includes(f.path) &&
    !f.path.toLowerCase().startsWith('readme')
  );

  // Safely parse package.json
  let parsedPackageJson: Record<string, unknown> | undefined;
  if (packageJsonFile) {
    try {
      parsedPackageJson = JSON.parse(packageJsonFile.content);
    } catch (e) {
      console.error('Invalid package.json format:', e);
      // Continue without package.json rather than failing entirely
    }
  }

  return {
    repoInfo,
    packageJson: parsedPackageJson,
    readme: readmeFile?.content,
    srcFiles,
    configFiles,
    fetchErrors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Quick check if a repo is accessible
 */
export async function checkRepoAccess(url: string): Promise<{ accessible: boolean; error?: string; needsToken?: boolean }> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return { accessible: false, error: 'Invalid GitHub URL' };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers: getHeaders() }
    );

    lastRateLimit = getRateLimitFromHeaders(response.headers);

    if (response.ok) {
      return { accessible: true };
    }

    if (response.status === 404) {
      const hasToken = !!getGitHubToken();
      return {
        accessible: false,
        error: hasToken
          ? 'Repository not found'
          : 'Repository not found or is private',
        needsToken: !hasToken,
      };
    }

    if (response.status === 403) {
      return { accessible: false, error: 'Rate limit exceeded', needsToken: true };
    }

    return { accessible: false, error: `GitHub API error: ${response.status}` };
  } catch {
    return { accessible: false, error: 'Failed to connect to GitHub' };
  }
}
