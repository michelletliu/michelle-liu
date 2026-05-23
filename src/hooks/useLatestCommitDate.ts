import { useEffect, useState } from "react";

type ChangelogPayload = {
  latestCommitDate?: string | null;
};

export function useLatestCommitDate() {
  const [commitDate, setCommitDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestCommit = async () => {
      try {
        const response = await fetch('/changelog.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch');

        const payload = (await response.json()) as ChangelogPayload;
        if (payload?.latestCommitDate) {
          setCommitDate(payload.latestCommitDate);
        }
      } catch (error) {
        console.error('Failed to fetch latest commit date:', error);
      }
    };

    fetchLatestCommit();
  }, []);

  return commitDate;
}
