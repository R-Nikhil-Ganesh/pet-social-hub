interface RelativeTimeOptions {
  withSuffix?: boolean;
}

export function formatRelativeTime(date: string, options: RelativeTimeOptions = {}): string {
  const parsed = new Date(date).getTime();
  if (!Number.isFinite(parsed)) {
    return options.withSuffix ? 'just now' : '0m';
  }

  const diffMs = Math.max(0, Date.now() - parsed);
  const mins = Math.floor(diffMs / 60000);

  if (mins < 60) {
    return options.withSuffix ? `${mins}m ago` : `${mins}m`;
  }

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return options.withSuffix ? `${hrs}h ago` : `${hrs}h`;
  }

  const days = Math.floor(hrs / 24);
  return options.withSuffix ? `${days}d ago` : `${days}d`;
}
