import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { decode, encode, createURL } from '../src/core/codec';
import { normalizeProject } from '../src/core/project';
import legacy from './fixtures/v1-project.json';
describe('links v1 anteriores à migração React', () => {
  it('abre o link comprimido congelado da versão antiga', async () => {
    const link = readFileSync(new URL('./fixtures/v1-link.txt', import.meta.url), 'utf8');
    expect(await decode('#project=' + link)).toEqual(legacy);
    expect(normalizeProject(await decode(link))).toEqual(legacy);
  });
  it('mantém suporte a links JSON sem compressão', async () => {
    expect(
      await decode('v1j.' + Buffer.from(JSON.stringify(legacy)).toString('base64url')),
    ).toEqual(legacy);
  });
  it('preserva unicode, imagem e query ao compartilhar', async () => {
    const project = normalizeProject(legacy);
    project.contact.name = 'Clínica São João 🩺';
    project.contact.avatar = 'assets/prevent-senior.png';
    const url = new URL(await createURL(project, 'https://example.com/app?test=1'));
    expect(url.search).toBe('?test=1');
    expect(await decode(url.hash)).toEqual(project);
    expect(await decode(await encode(project))).toEqual(project);
  });
  it('informa links inválidos e limita tamanho', async () => {
    await expect(decode('v99.no')).rejects.toThrow('versão');
    await expect(decode('v1z.broken')).rejects.toThrow('corrompido');
    const project = normalizeProject(legacy);
    project.steps[0].text = 'x'.repeat(5 * 1024 * 1024);
    await expect(encode(project)).rejects.toThrow('4 MB');
  });
});
