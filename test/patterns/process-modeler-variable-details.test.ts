import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, type ProcessProjection } from '../../src/patterns/process-modeler/index.js';
function fixture() {
  const b = new ProcessModeler(); b.document = { boxes: [
    { id: 'a', kind: 'custom', title: 'A', node: {}, localVariables: [], localVariablesEditable: true },
    { id: 'frame', kind: 'custom', title: 'Frame', node: {}, frame: true, localVariables: [{name:'same',startingValue:'g'}], savedResult: 'result' },
    { id: 'b', kind: 'custom', title: 'B', node: {}, localVariables: [{name:'same'},{name:''}], savedResult: 'result' },
  ], lines: [] } as ProcessProjection;
  b.variables = [{ name:'g',startingValue:'1',description:'' }]; b.variablesEditable = true; document.body.append(b);
  return b;
}
const pane = (b: ProcessModeler) => b.shadowRoot!.querySelector<HTMLButtonElement>('[data-pane=Variables]')!.click();
afterEach(() => document.body.replaceChildren());
describe('host-owned variable details', () => {
  it('explains all three scopes without offering a third global scope and renders editable About', () => {
    const b=fixture(); pane(b); const r=b.shadowRoot!;
    expect([...r.querySelectorAll('[part=variable-scopes] dt')].map(x=>x.textContent)).toEqual(['Iteration','Process','Step']);
    expect([...r.querySelectorAll('[data-variable-key=scope] option')].map(x=>(x as HTMLOptionElement).value)).toEqual(['iteration','process']);
    const about=r.querySelector<HTMLInputElement>('[data-variable-key=description]')!; expect(about).not.toBeNull();
    const listener=vi.fn(); b.addEventListener('process-variable-edit-request',listener); about.value=' About g '; about.dispatchEvent(new Event('input'));
    expect(listener.mock.calls[0][0].detail).toEqual({type:'description',name:'g',value:' About g '}); expect(b.variables[0].description).toBe('');
    b.locked=true; expect(r.querySelector<HTMLInputElement>('[data-variable-key=description]')!.disabled).toBe(true);
  });
  it('projects ordered local/output summaries preserving duplicates and excludes empty local names', () => {
    const b=fixture(); pane(b); const r=b.shadowRoot!;
    expect([...r.querySelectorAll('[part=local-variable-summary] li')].map(x=>x.textContent)).toEqual(['same only in Frame','same only in B']);
    expect([...r.querySelectorAll('[part=saved-result-summary] li')].map(x=>x.textContent)).toEqual(['result from Frame','result from B']);
    expect(r.querySelector('[part=local-variable-summary] button')).toBeNull();
    b.document={boxes:[{id:'a',kind:'custom',title:'A',node:{}}],lines:[]};
    expect(r.querySelector('[part=local-variable-summary]')).toBeNull(); expect(r.querySelector('[part=saved-result-summary]')!.textContent).toContain('Save the result as');
  });
  it('renders opt-in local Add/Remove and typed owner/index/old-name edits without mutating host arrays', () => {
    const b=fixture(); b.select('a'); const r=b.shadowRoot!, listener=vi.fn(); b.addEventListener('process-local-variable-edit-request',listener);
    r.querySelector<HTMLButtonElement>('[data-local-key=add]')!.click(); expect(listener.mock.calls[0][0].detail).toEqual({boxId:'a',edit:{type:'add'}});
    expect((b.document as any).boxes[0].localVariables).toEqual([]);
    (b.document as any).boxes[0].localVariables=[{name:'local1',startingValue:'1'}]; b.document=b.document;
    const input=r.querySelector<HTMLInputElement>('[data-local-key=starting-value]')!;input.value='1 +';input.dispatchEvent(new Event('input'));
    expect(listener.mock.calls[1][0].detail).toEqual({boxId:'a',edit:{type:'starting-value',index:0,name:'local1',value:'1 +'}});
    r.querySelector<HTMLButtonElement>('[data-local-key=remove]')!.click(); expect(listener.mock.calls[2][0].detail.edit).toEqual({type:'remove',index:0,name:'local1'});
    expect((b.document as any).boxes[0].localVariables).toEqual([{name:'local1',startingValue:'1'}]);expect(b.history.canUndo).toBe(false);
    b.locked=true; expect(r.querySelector<HTMLButtonElement>('[data-local-key=add]')!.disabled).toBe(true);
  });
  it('retains local typing caret through host echoes and focuses accepted Add/Remove without wrong-owner fallback', () => {
    const b=fixture();b.select('a');const r=b.shadowRoot!;
    b.addEventListener('process-local-variable-edit-request', (event: Event) => {
      const {boxId,edit}=(event as CustomEvent).detail;
      const owner=(b.document as any).boxes.find((box:any)=>box.id===boxId);
      if(edit.type==='add') owner.localVariables.push({name:'local1',startingValue:''});
      else if(edit.type==='remove') owner.localVariables.splice(edit.index,1);
      else owner.localVariables[edit.index][edit.type==='rename'?'name':'startingValue']=edit.value;
      b.document=b.document;
    });
    r.querySelector<HTMLButtonElement>('[data-local-key=add]')!.click();
    const name=r.querySelector<HTMLInputElement>('[data-local-key=rename]')!;expect(r.activeElement).toBe(name);expect(name.selectionStart).toBe(0);expect(name.selectionEnd).toBe(6);
    let input=r.querySelector<HTMLInputElement>('[data-local-key=starting-value]')!;input.focus();input.value='1 +';input.setSelectionRange(3,3);input.dispatchEvent(new Event('input'));
    input=r.querySelector<HTMLInputElement>('[data-local-key=starting-value]')!;expect(r.activeElement).toBe(input);expect(input.value).toBe('1 +');expect(input.selectionStart).toBe(3);
    r.querySelector<HTMLButtonElement>('[data-local-key=remove]')!.click();expect(r.activeElement).toBe(r.querySelector('[data-local-key=add]'));
  });
  it('emits detached local metadata snapshots when a host changes a local collection in place', () => {
    const b=fixture();const observer=vi.fn();b.addEventListener('projection-changed',observer);
    (b.document as any).boxes[0].localVariables.push({name:'local1',startingValue:'1'});b.document=b.document;
    expect(observer).toHaveBeenCalledOnce();const snapshot=observer.mock.calls[0][0].detail.projection;
    snapshot.boxes[0].localVariables[0].name='changed outside';expect((b.document as any).boxes[0].localVariables[0].name).toBe('local1');
  });
  it('uses explicit local eligibility/read-only state and distinguishes frame help', () => {
    const b=fixture();b.select('frame');const r=b.shadowRoot!;expect(r.querySelector('[part=local-variables]')!.textContent).toContain('Variables for the steps inside');expect(r.querySelector('[data-local-key=add]')).toBeNull();
    b.select('b');expect(r.querySelector('[part=local-variables]')!.textContent).toContain('Variables for this step');
    (b.document as any).boxes[2].localVariables=undefined;b.document=b.document;expect(r.querySelector('[part=local-variables]')).toBeNull();
  });
});
