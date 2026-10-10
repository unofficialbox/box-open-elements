import {afterEach,describe,it,expect,vi} from "vitest";
import {ProcessModeler,type ProcessField} from "../../src/patterns/process-modeler/index.js";
afterEach(()=>document.body.replaceChildren());
function fixture(field:ProcessField={key:'when',label:'Condition',kind:'expression',value:'true && false'}) {
 const b=new ProcessModeler(); b.document={boxes:[{id:'a',node:{},title:'A',kind:'call'},{id:'b',node:{},title:'B',kind:'call'}],lines:[]};
 b.variables=[{name:'globalVar',description:'Global value'}];b.fields={a:[field],b:[{...field,value:'Other'}]};document.body.append(b);b.select('a');return {b,r:b.shadowRoot!};
}
describe('controlled expression fields',()=>{
 it('replaces a selected range and retains focus through synchronous host echo',()=>{
  const {b,r}=fixture();const changes=vi.fn();b.addEventListener('process-field-change-request',event=>{changes(event);const d=(event as CustomEvent).detail;b.fields={a:[{key:'when',label:'Condition',kind:'expression',value:d.value}]};});
  const input=r.querySelector<HTMLInputElement>('[data-field=when]')!;input.focus();input.setSelectionRange(8,13,'backward');r.querySelector<HTMLButtonElement>('[part=variable-chips] button')!.click();
  const current=r.querySelector<HTMLInputElement>('[data-field=when]')!;expect(current.value).toBe('true && globalVar');expect(r.activeElement).toBe(current);expect(current.selectionStart).toBe(17);expect(current.selectionEnd).toBe(17);expect(changes).toHaveBeenCalledTimes(1);
 });
 it('preserves full backward range through same-field echoes and never restores into a different box',()=>{
  const {b,r}=fixture();const input=r.querySelector<HTMLInputElement>('[data-field=when]')!;input.focus();input.setSelectionRange(2,8,'backward');b.fields={a:[{key:'when',label:'Condition',kind:'expression',value:'true && false',description:'Updated'}],b:[{key:'when',label:'Condition',kind:'expression',value:'Other'}]};
  const current=r.querySelector<HTMLInputElement>('[data-field=when]')!;expect(current.selectionStart).toBe(2);expect(current.selectionEnd).toBe(8);expect(current.selectionDirection).toBe('backward');b.select('b');expect(r.activeElement).not.toBe(r.querySelector('[data-field=when]'));
 });
 it('rejects chip edits if return focus changes the selected owner',()=>{
  const {b,r}=fixture();const changes=vi.fn();b.addEventListener('process-field-change-request',changes);const input=r.querySelector<HTMLInputElement>('[data-field=when]')!;
  const chip=r.querySelector<HTMLButtonElement>('[part=variable-chips] button')!;chip.focus();input.addEventListener('focus',()=>b.select('b'),{once:true});chip.click();expect(changes).not.toHaveBeenCalled();expect(b.selected?.id).toBe('b');
 });
 it('renders explicit ordered scope, safe feedback/help and textarea anatomy',()=>{
  const {r}=fixture({key:'when',label:'Condition',kind:'expression',value:'',placeholder:'Condition here',description:'Static help',expression:{rows:2,variables:[{name:'local',description:'Only here'},{name:'saved',description:'Saved output'}],feedback:{message:'Reads fine',tone:'success'},help:{summary:'Examples',examples:[{expression:'a < b',description:'Compare <img>',segments:[{text:'Use '},{text:'<',format:'code'}]}]}}});
  const input=r.querySelector<HTMLTextAreaElement>('textarea[data-field=when]')!;expect(input.rows).toBe(2);expect(input.placeholder).toBe('Condition here');expect([...r.querySelectorAll('[part=variable-chips] button')].map(n=>n.textContent)).toEqual(['local','saved']);expect(r.querySelector('[part=variable-chips] button')!.getAttribute('title')).toBe('Only here');expect(input.getAttribute('aria-describedby')!.split(' ').map(id=>r.getElementById(id)!.textContent)).toEqual(['Static help','Reads fine']);expect(r.querySelector('details')!.open).toBe(false);expect(r.querySelector('details code')!.textContent).toBe('a < b');expect(r.querySelector('img')).toBeNull();
 });
 it('suppresses fallback scope for explicit empty lists and gives errors feedback precedence',()=>{
  const {r}=fixture({key:'when',label:'Condition',kind:'expression',value:'bad +',problem:'Missing operand',expression:{variables:[],feedback:{message:'Reads fine',tone:'success'}}});expect(r.querySelector('[part=variable-chips]')).toBeNull();const input=r.querySelector('[data-field=when]')!;expect(input.getAttribute('aria-invalid')).toBe('true');expect(r.getElementById(input.getAttribute('aria-describedby')!)!.textContent).toBe('Missing operand');expect(r.querySelector('[part=field-problem]')!.getAttribute('aria-live')).toBe('polite');
 });
});
