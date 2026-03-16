type TestMode = 'all' | 'unit' | 'e2e';

type TestGroup = {
  name: string;
  color: string;
  paths: string[];
};

const COLORS = {
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
} as const;

const UNIT_GROUPS: TestGroup[] = [
  {
    name: 'order',
    color: COLORS.blue,
    paths: ['src/test/order/domain', 'src/test/order/application'],
  },
  {
    name: 'payment',
    color: COLORS.green,
    paths: ['src/test/payment/domain', 'src/test/payment/application'],
  },
  {
    name: 'product',
    color: COLORS.magenta,
    paths: ['src/test/product/domain', 'src/test/product/application'],
  },
  {
    name: 'user',
    color: COLORS.cyan,
    paths: ['src/test/user/domain', 'src/test/user/application'],
  },
];

const E2E_DIRECTORY = 'src/test/e2e';

const args = process.argv.slice(2);
const mode = parseMode(args);
const dots = args.includes('--dots');
const watch = args.includes('--watch');
const testEnv = await loadTestEnv();

await main();

async function main(): Promise<void> {
  if (watch) {
    await runWatchMode();
    return;
  }

  if (mode === 'unit') {
    process.exit(await runUnitGroups());
  }

  if (mode === 'e2e') {
    process.exit(await runE2E());
  }

  const unitExitCode = await runUnitGroups();
  if (unitExitCode !== 0) {
    process.exit(unitExitCode);
  }

  process.exit(await runE2E());
}

function parseMode(cliArgs: string[]): TestMode {
  const requestedMode = cliArgs.find((arg) => !arg.startsWith('--'));
  if (!requestedMode) {
    return 'all';
  }

  if (
    requestedMode === 'all' ||
    requestedMode === 'unit' ||
    requestedMode === 'e2e'
  ) {
    return requestedMode;
  }

  console.error(`Unknown test mode: ${requestedMode}`);
  process.exit(1);
}

async function runUnitGroups(): Promise<number> {
  const exitCodes = await Promise.all(
    UNIT_GROUPS.map((group) =>
      runBunTest(group.paths, group.name, group.color),
    ),
  );

  return exitCodes.some((code) => code !== 0) ? 1 : 0;
}

async function runE2E(): Promise<number> {
  const files = await getE2ETestFiles();
  let hasFailures = false;

  for (const file of files) {
    const label = `e2e:${toE2ELabel(file)}`;
    const exitCode = await runBunTest([file], label, COLORS.blue);
    hasFailures = hasFailures || exitCode !== 0;
  }

  return hasFailures ? 1 : 0;
}

async function runBunTest(
  paths: string[],
  label: string,
  color: string,
): Promise<number> {
  const cmd = [
    process.execPath,
    'test',
    '--env-file',
    '.env.test',
    ...(dots ? ['--dots'] : []),
    ...paths,
  ];

  const subprocess = Bun.spawn({
    cmd,
    cwd: process.cwd(),
    env: testEnv,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const prefix = `${color}[${label}]${COLORS.reset} `;

  await Promise.all([
    pipeStream(subprocess.stdout, prefix, false),
    pipeStream(subprocess.stderr, prefix, true),
  ]);

  return await subprocess.exited;
}

async function pipeStream(
  stream: ReadableStream<Uint8Array> | null,
  prefix: string,
  isError: boolean,
): Promise<void> {
  if (!stream) {
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = flushLines(buffer, prefix, isError);
  }

  buffer += decoder.decode();
  flushLines(buffer, prefix, isError, true);
}

function flushLines(
  buffer: string,
  prefix: string,
  isError: boolean,
  flushRemainder = false,
): string {
  const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parts = normalized.split('\n');
  const remainder = flushRemainder ? '' : (parts.pop() ?? '');

  for (const part of parts) {
    writePrefixedLine(prefix, part, isError);
  }

  if (flushRemainder && remainder.length > 0) {
    writePrefixedLine(prefix, remainder, isError);
  }

  return remainder;
}

function writePrefixedLine(
  prefix: string,
  line: string,
  isError: boolean,
): void {
  const target = isError ? process.stderr : process.stdout;
  target.write(`${prefix}${line}\n`);
}

async function runWatchMode(): Promise<void> {
  if (mode === 'unit') {
    await runWatchForPaths(getUnitPaths());
    return;
  }

  if (mode === 'e2e') {
    await runWatchForPaths([E2E_DIRECTORY]);
    return;
  }

  await runWatchForPaths([...getUnitPaths(), E2E_DIRECTORY]);
}

function getUnitPaths(): string[] {
  return UNIT_GROUPS.flatMap((group) => group.paths);
}

async function runWatchForPaths(paths: string[]): Promise<void> {
  const cmd = [
    process.execPath,
    'test',
    '--watch',
    '--env-file',
    '.env.test',
    ...(dots ? ['--dots'] : []),
    ...paths,
  ];

  const subprocess = Bun.spawn({
    cmd,
    cwd: process.cwd(),
    env: testEnv,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  process.exit(await subprocess.exited);
}

async function loadTestEnv(): Promise<Record<string, string>> {
  const envFile = Bun.file('.env.test');
  if (!(await envFile.exists())) {
    return normalizeEnv(process.env);
  }

  const fileContents = await envFile.text();
  return {
    ...normalizeEnv(process.env),
    ...parseEnvFile(fileContents),
  };
}

function normalizeEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      normalized[key] = value;
    }
  }

  return normalized;
}

function parseEnvFile(fileContents: string): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    entries[key] = stripWrappingQuotes(value);
  }

  return entries;
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function getE2ETestFiles(): Promise<string[]> {
  const entries = await Array.fromAsync(
    new Bun.Glob('*.e2e.test.ts').scan(E2E_DIRECTORY),
  );
  return entries.map((entry) => `${E2E_DIRECTORY}/${entry}`).sort();
}

function toE2ELabel(filePath: string): string {
  const fileName = filePath.split('/').pop() ?? filePath;
  return fileName.replace('.e2e.test.ts', '');
}
