const hook = process.argv[2];

await main();

async function main(): Promise<void> {
  if (hook === 'pre-commit') {
    await run([process.execPath, 'x', 'lint-staged']);
    await run([process.execPath, 'run', 'test']);
    return;
  }

  if (hook === 'pre-push') {
    await run([process.execPath, 'run', 'test']);
    return;
  }

  console.error(`Unknown hook: ${hook}`);
  process.exit(1);
}

async function run(cmd: string[]): Promise<void> {
  const subprocess = Bun.spawn({
    cmd,
    cwd: process.cwd(),
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exitCode = await subprocess.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
