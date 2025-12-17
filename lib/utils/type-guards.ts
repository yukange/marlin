export function isGitHubFile(data: unknown): data is { sha: string; content?: string; encoding?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'sha' in data &&
    typeof (data as any).sha === 'string'
  );
}

export function isErrorWithStatus(error: unknown): error is { status: number; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as any).status === 'number'
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
