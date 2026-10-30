import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { decode } from '../../core/codec';
import { normalizeProject } from '../../core/project';
import { prepareProjectImages } from '../../core/images/sanitize';
import type { Project } from '../../core/types';

interface IncomingExperience {
  project: Project;
  hash: string;
}
interface Options {
  current: () => { project: Project; hasWork: boolean };
  accept: (project: Project, persist: boolean) => void;
}
function setHash(hash: string) {
  const url = new URL(location.href);
  url.hash = hash;
  // Replace only our fragment; never navigate to a pasted host or create a reload loop.
  history.replaceState(history.state, '', url.href);
}

/** Validate into a staging area. Only a confirmed candidate may replace existing work. */
export function useSharedLink(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const generation = useRef(0);
  const [loading, setLoading] = useState(() => location.hash.startsWith('#project'));
  const [error, setError] = useState('');
  const [pending, setPending] = useState<IncomingExperience | null>(null);
  const stage = useCallback(async (readHash: () => string) => {
    const id = ++generation.current;
    setLoading(true);
    setPending(null);
    try {
      const hash = readHash();
      const project = await prepareProjectImages(
        normalizeProject(await decode(hash), { allowDrafts: true }),
      );
      if (generation.current !== id) return;
      const current = latest.current.current();
      setError('');
      if (current.hasWork && JSON.stringify(current.project) === JSON.stringify(project)) {
        setHash(hash);
      } else if (current.hasWork) {
        setPending({ project, hash });
      } else {
        setHash(hash);
        latest.current.accept(project, false);
      }
    } catch (reason) {
      if (generation.current === id)
        setError(reason instanceof Error ? reason.message : t('errors.invalidLink'));
    } finally {
      if (generation.current === id) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const navigate = () => {
      if (location.hash.startsWith('#project')) void stage(() => location.hash);
      else {
        generation.current++;
        setPending(null);
        setError('');
        setLoading(false);
      }
    };
    navigate();
    window.addEventListener('hashchange', navigate);
    return () => {
      generation.current++;
      window.removeEventListener('hashchange', navigate);
    };
  }, [stage]);
  const dismiss = () => {
    generation.current++;
    setHash('');
    setPending(null);
    setError('');
    setLoading(false);
  };
  return {
    loading,
    error,
    pending,
    blocked: loading || !!error || !!pending,
    dismiss,
    open: (input: string) =>
      stage(() => {
        const url = new URL(input.trim());
        if (
          !['https:', 'http:', 'file:'].includes(url.protocol) ||
          !url.hash.startsWith('#project=')
        )
          throw new Error(t('errors.invalidLink'));
        return url.hash;
      }),
    confirm: () => {
      if (!pending || loading) return;
      generation.current++;
      setHash(pending.hash);
      latest.current.accept(pending.project, true);
      setPending(null);
      setError('');
    },
  };
}
export type SharedLink = ReturnType<typeof useSharedLink>;
