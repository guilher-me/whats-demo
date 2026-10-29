import { useCallback, useEffect, useState, useRef } from 'react';
import type { Project, Step } from '../../../core/types';
import { createDefaultProject } from '../../../core/defaults';
import { clone, createStep, normalizeProject, STORAGE_KEY, uid } from '../../../core/project';
import { decode } from '../../../core/codec';
export function useProject() {
  const edited = useRef(false);
  const [project, setProject] = useState<Project>(() => {
    try {
      return normalizeProject(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
    } catch {
      return createDefaultProject();
    }
  });
  const [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [saveStatus, setSaveStatus] = useState('Salvo neste navegador');
  useEffect(() => {
    let generation = 0;
    let disposed = false;
    const load = async () => {
      const id = ++generation;
      setLoading(true);
      try {
        if (location.hash.startsWith('#project=')) {
          const shared = normalizeProject(await decode(location.hash));
          if (!disposed && id === generation) {
            setProject(shared);
            setRevision((n) => n + 1);
            setSaveStatus('Experiência carregada do link');
            setError('');
          }
        }
      } catch (e) {
        if (!disposed && id === generation)
          setError('Não foi possível abrir o link: ' + (e as Error).message);
      } finally {
        if (!disposed && id === generation) setLoading(false);
      }
    };
    void load();
    window.addEventListener('hashchange', load);
    return () => {
      disposed = true;
      generation++;
      window.removeEventListener('hashchange', load);
    };
  }, []);
  useEffect(() => {
    if (!edited.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSaveStatus('Salvo neste navegador');
    } catch {
      setSaveStatus('Não foi possível salvar neste navegador');
    }
    edited.current = false;
  }, [project]);
  const update = useCallback((change: (value: Project) => Project) => {
    edited.current = true;
    setProject(change);
  }, []);
  const updateStep = (id: string, change: Partial<Step>) =>
    update((p) => ({
      ...p,
      steps: p.steps.map((s) => (s.id === id ? ({ ...s, ...change } as Step) : s)),
    }));
  const action = (id: string, type: 'up' | 'down' | 'copy' | 'delete') =>
    update((p) => {
      const steps = [...p.steps],
        index = steps.findIndex((s) => s.id === id);
      if (index < 0) return p;
      if (type === 'delete') steps.splice(index, 1);
      if (type === 'copy') steps.splice(index + 1, 0, { ...clone(steps[index]), id: uid() });
      if (type === 'up' && index > 0)
        [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
      if (type === 'down' && index < steps.length - 1)
        [steps[index + 1], steps[index]] = [steps[index], steps[index + 1]];
      return { ...p, steps };
    });
  const add = (type: Step['type']) =>
    update((p) => ({ ...p, steps: [...p.steps, createStep(type)] }));
  const restore = () => {
    update(() => createDefaultProject());
    setRevision((n) => n + 1);
    setError('');
  };
  return {
    project,
    revision,
    loading,
    error,
    setError,
    saveStatus,
    update,
    updateStep,
    action,
    add,
    restore,
  };
}
