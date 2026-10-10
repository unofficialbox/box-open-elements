import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, type ProcessProjection } from '../../src/patterns/process-modeler/index.js';
function fixture() {
  const b=new ProcessModeler(); b.document={boxes:[{id:'a',kind:'call',title:'A',node:{}},{id:'b',kind:'call',title:'B',node:{}}],lines:[{id:'ab',from:'a',to:'b'}]} as ProcessProjection;
  b.catalog=[{kind:'call',label:'Call',create:()=>({})}];document.body.append(b);
  b.layout={boxes:{a:{x:100,y:100,width:224,height:64},b:{x:700,y:100,width:224,height:64}}};
  const r=b.shadowRoot!, canvas=r.querySelector<HTMLElement>('[part=canvas]')!;
  const chooser=r.querySelector<HTMLElement>('[part=keyboard-chooser]')!;chooser.showPopover=vi.fn();chooser.hidePopover=vi.fn();
  const listener=vi.fn();b.addEventListener('process-edit-request',listener);
  return {b,r,canvas,listener};
}
function choose(r:ShadowRoot){r.querySelector('[part=keyboard-chooser] box-kind-picker')!.dispatchEvent(new CustomEvent('kind-pick',{detail:{kind:{kind:'call',label:'Call',create:()=>({})}}}));}
afterEach(()=>document.body.replaceChildren());
describe('explicit host insertion placement',()=>{
  it.each([['ArrowUp','north'],['ArrowRight','east'],['ArrowDown','south'],['ArrowLeft','west']])('preserves %s direction even when east becomes an insertion', (key,side)=>{
    const {b,r,canvas,listener}=fixture();b.select('a');canvas.dispatchEvent(new KeyboardEvent('keydown',{key,ctrlKey:true,altKey:true,bubbles:true,cancelable:true}));choose(r);
    expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'direction',side});expect(listener.mock.calls[0][0].detail.type).toBe(side==='east'?'insert':'add');
  });
  it.each(['north','east','south','west'])('gives the %s keyboard port the same directional intent',side=>{
    const {b,r,listener}=fixture();b.select('a');r.querySelector<HTMLButtonElement>(`[part=port][data-owner=a][data-side=${side}]`)!.click();choose(r);expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'direction',side});
  });
  it.each(['N','toolbar'])('distinguishes %s next intent from line midpoint',source=>{
    const {b,r,canvas,listener}=fixture();b.select('a');if(source==='N')canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true,cancelable:true}));else r.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')!.click();choose(r);
    expect(listener.mock.calls[0][0].detail).toMatchObject({type:'insert',lineId:'ab',placement:{source:'next'}});
  });
  it('transports the actual routed line midpoint through final kind choice',()=>{
    const {b,r,listener}=fixture();b.selectLine('ab');r.querySelector<HTMLButtonElement>('[data-selection-command=insert]')!.click();choose(r);expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'line',center:{x:512,y:132}});
  });
  it('places unselected palette activation at the visible world center',()=>{
    const {b,r,canvas,listener}=fixture();Object.defineProperties(canvas,{clientWidth:{value:800},clientHeight:{value:400}});b.setView({x:100,y:50,zoom:.5});r.querySelector<HTMLButtonElement>('[part=choice]')!.click();
    expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'point',center:{x:600,y:300}});expect(listener.mock.calls[0][0].detail.from).toBeUndefined();
  });
  it('keeps palette next semantics and adds a gateway branch instead of splitting its sole edge',()=>{
    const {b,r,listener}=fixture();b.select('a');r.querySelector<HTMLButtonElement>('[part=choice]')!.click();expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'next'});
    b.catalog=[{kind:'call',label:'Call',shape:'gateway',create:()=>({})}];r.querySelector<HTMLButtonElement>('[part=choice]')!.click();expect(listener.mock.calls[1][0].detail).toMatchObject({type:'add',from:'a',placement:{source:'next'}});
  });

  it.each(['pointer','html'])('preserves actual world drop center for %s palette input',mode=>{
    const {b,r,canvas,listener}=fixture();b.setView({x:100,y:50,zoom:.5});
    canvas.getBoundingClientRect=()=>({left:0,top:0,right:1000,bottom:800,width:1000,height:800}) as DOMRect;
    const pointer=(target:Element,type:string,x:number,y:number)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0});target.dispatchEvent(e);};
    if(mode==='pointer'){pointer(r.querySelector('[part=choice]')!,'pointerdown',-100,100);pointer(b,'pointermove',450,350);pointer(b,'pointerup',450,350);}
    else {const e=new Event('drop',{bubbles:true,cancelable:true});Object.assign(e,{clientX:450,clientY:350,dataTransfer:{getData:()=> 'call'}});canvas.dispatchEvent(e);}
    expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'point',center:{x:700,y:600}});
  });
  it('preserves a free-port drop center instead of converting it to next intent',()=>{
    const {b,r,canvas,listener}=fixture();b.setView({x:0,y:0,zoom:1});
    const pointer=(target:Element,type:string,x:number,y:number)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0});target.dispatchEvent(e);};
    pointer(r.querySelector('[data-owner=a][data-side=south]')!,'pointerdown',212,164);pointer(canvas,'pointermove',500,400);pointer(canvas,'pointerup',500,400);choose(r);
    expect(listener.mock.calls[0][0].detail).toMatchObject({type:'add',from:'a',fromSide:'south',placement:{source:'point',center:{x:500,y:400}}});
  });

  it('uses visible gateway dimensions for an existing-node insertion center',()=>{
    const {b,r,canvas,listener}=fixture();b.setView({x:0,y:0,zoom:1});
    b.document={...b.document!,boxes:[...b.document!.boxes,{id:'c',kind:'gateway',shape:'gateway',title:'C',node:{}}]} as ProcessProjection;
    b.layout={boxes:{...b.layout.boxes,c:{x:1000,y:400}}};
    const pointer=(target:Element,type:string,x:number,y:number)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0});target.dispatchEvent(e);};
    pointer(r.querySelector('[data-box-id=c]')!,'pointerdown',1010,410);pointer(canvas,'pointermove',512,132);pointer(canvas,'pointerup',512,132);
    const edit=listener.mock.calls[0][0].detail;expect(edit).toMatchObject({type:'insert',boxId:'c',lineId:'ab',placement:{source:'point'}});
    expect(edit.placement.center).toEqual({x:edit.position.x+28,y:edit.position.y+28});
  });
  it.each([{source:'line'}, {source:'unknown'}, {source:'direction',side:'diagonal'}, {source:'point',center:{x:Infinity,y:0}}])('refuses malformed runtime placement %j',placement=>{
    const {b,listener}=fixture();b.requestEdit({type:'add',placement} as any);expect(listener).not.toHaveBeenCalled();
  });

  it('retains routed midpoint intent when the host owns the picker and catalog is empty',()=>{
    const {b,r,listener}=fixture();b.catalog=[];
    r.querySelector<HTMLButtonElement>('[part=connection] button')!.click();
    expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'line',center:{x:512,y:132}});
  });
  it.each(['line','point'])('normalizes prototype-backed %s centers without losing coordinates',source=>{
    const {b,listener}=fixture();const center=Object.create({get x(){return 40;},get y(){return 80;}});
    const placement=Object.create({get source(){return source;},get center(){return center;}});
    b.requestEdit({type:'insert',placement} as any);
    expect(listener.mock.calls[0][0].detail.placement).toEqual({source,center:{x:40,y:80}});
  });
  it('normalizes getter-backed direction and next discriminants explicitly',()=>{
    const {b,listener}=fixture();b.requestEdit({type:'add',placement:Object.create({get source(){return 'direction';},get side(){return 'west';}})} as any);
    b.requestEdit({type:'add',placement:Object.create({get source(){return 'next';}})} as any);
    expect(listener.mock.calls[0][0].detail.placement).toEqual({source:'direction',side:'west'});
    expect(listener.mock.calls[1][0].detail.placement).toEqual({source:'next'});
  });
  it('rejects invalid coordinates, detaches centers, and preserves legacy callers',()=>{
    const {b,listener}=fixture();b.requestEdit({type:'add',placement:{source:'point',center:{x:NaN,y:10}}} as any);expect(listener).not.toHaveBeenCalled();
    const center={x:40,y:80};b.requestEdit({type:'add',placement:{source:'point',center}} as any);listener.mock.calls[0][0].detail.placement.center.x=-10;expect(center.x).toBe(40);
    b.requestEdit({type:'add'});expect(listener.mock.calls[1][0].detail.placement).toBeUndefined();
  });
  it.each(['N', 'line'])('cancels stale %s chooser intent when a document is loaded',source=>{
    const {b,r,canvas,listener}=fixture();b.select('a');
    if(source==='N')canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true,cancelable:true}));
    else {b.selectLine('ab');r.querySelector<HTMLButtonElement>('[data-selection-command=insert]')!.click();}
    expect((b as any).keyboardInsertion).toBeDefined();
    b.load({boxes:[{id:'fresh',kind:'call',title:'Fresh',node:{}}],lines:[]} as ProcessProjection);
    choose(r);
    expect(listener).not.toHaveBeenCalled();
    expect((b as any).keyboardInsertion).toBeUndefined();
    expect((b as any).transientChooserAnchor).toBeUndefined();
    expect(b.history.canUndo).toBe(false);
    expect(b.selection).toEqual([]);
  });
  it('cancels the modal fallback before a retained picker can dispatch into a loaded document',()=>{
    const {b,r,canvas,listener}=fixture();b.select('a');
    r.querySelector<HTMLElement>('[part=keyboard-chooser]')!.showPopover=undefined as any;
    r.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.showModal=vi.fn();
    canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true,cancelable:true}));
    expect((b as any).insertion).toBeDefined();
    const picker=r.querySelector('[part=insert-chooser] box-kind-picker')!;
    b.load({boxes:[{id:'fresh',kind:'call',title:'Fresh',node:{}}],lines:[]} as ProcessProjection);
    picker.dispatchEvent(new CustomEvent('kind-pick',{detail:{kind:{kind:'call',label:'Call',create:()=>({})}}}));
    expect(listener).not.toHaveBeenCalled();expect((b as any).insertion).toBeUndefined();
  });
  it('does not dispatch a captured chooser edit after return-focus loads another document',()=>{
    const {b,r,canvas,listener}=fixture();b.select('a');canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true,cancelable:true}));
    const target=(b as any).keyboardReturn as HTMLElement;
    target.addEventListener('focus',()=>b.load({boxes:[{id:'fresh',kind:'call',title:'Fresh',node:{}}],lines:[]} as ProcessProjection),{once:true});
    choose(r);
    expect(b.document!.boxes[0].id).toBe('fresh');expect(listener).not.toHaveBeenCalled();expect(b.history.canUndo).toBe(false);
  });
  it('does not dispatch a modal edit after closing loads another document',()=>{
    const {b,r,canvas,listener}=fixture();b.select('a');r.querySelector<HTMLElement>('[part=keyboard-chooser]')!.showPopover=undefined as any;
    const dialog=r.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    dialog.showModal=()=>{dialog.setAttribute('open','')};
    canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true,cancelable:true}));
    dialog.close=()=>{dialog.removeAttribute('open');b.load({boxes:[{id:'fresh',kind:'call',title:'Fresh',node:{}}],lines:[]} as ProcessProjection)};
    r.querySelector('[part=insert-chooser] box-kind-picker')!.dispatchEvent(new CustomEvent('kind-pick',{detail:{kind:{kind:'call',label:'Call',create:()=>({})}}}));
    expect(b.document!.boxes[0].id).toBe('fresh');expect(listener).not.toHaveBeenCalled();expect(b.history.canUndo).toBe(false);
  });
  it('emits no placement on cancelled or locked chooser flows',()=>{
    const {b,r,canvas,listener}=fixture();b.select('a');canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true,cancelable:true}));r.querySelector('[part=keyboard-chooser] box-kind-picker')!.dispatchEvent(new Event('picker-cancel'));expect(listener).not.toHaveBeenCalled();b.locked=true;b.requestEdit({type:'add',placement:{source:'next'}} as any);expect(listener).not.toHaveBeenCalled();
  });
});
