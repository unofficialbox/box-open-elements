export const chartAnimationAttributes = ["animated", "animation-preset", "animation-duration", "animation-delay", "animation-stagger", "animation-easing", "animation-loop", "animation-paused"];
export type ChartAnimationPreset = "auto" | "fade" | "delay" | "drop" | "loop" | "progressive" | "progressive-easing";
export type ChartAnimationEasing = "linear" | "ease-out-quad" | "ease-out-cubic" | "ease-out-quart" | "ease-out-quint" | "ease-in-quad" | "ease-in-cubic" | "ease-in-quart" | "ease-in-quint" | "ease-in-out-sine" | "ease-out-bounce" | "ease-in-out-elastic";
interface MotionHost extends HTMLElement {
  animated: boolean; animationPreset: ChartAnimationPreset; animationDuration: number;
  animationDelay: number; animationStagger: number; animationEasing: ChartAnimationEasing;
  animationLoop: boolean; animationPaused: boolean;
}
const sourceAttributes = ["points", "bars", "rows", "series", "segments", "axes", "domain", "total", "maximum", "value", "trend", "state", "orientation", "scale", "x-scale", "y-scale", "y-axes", "interpolation"];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function chartEasing(name: ChartAnimationEasing, t: number): number {
  t = clamp(t);
  const power = /-(quad|cubic|quart|quint)$/.exec(name)?.[1];
  if (power) { const n = ({quad:2,cubic:3,quart:4,quint:5})[power as "quad"]!; return name.startsWith("ease-in-") ? t ** n : 1 - (1-t) ** n; }
  if (name === "ease-in-out-sine") return (1 - Math.cos(Math.PI*t))/2;
  if (name === "ease-out-bounce") { let x=t; const n=7.5625,d=2.75; if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375; }
  if (name === "ease-in-out-elastic") { if(t===0||t===1)return t;const c=2*Math.PI/4.5;return t<.5?-(2**(20*t-10)*Math.sin((20*t-11.125)*c))/2:2**(-20*t+10)*Math.sin((20*t-11.125)*c)/2+1; }
  return t;
}
/** Equal point counts make the radial reveal interpolable without altering sectors. */
export function radialReveal(progress: number): string {
  const sweep = clamp(progress)*Math.PI*2;
  return `polygon(50% 50%,${Array.from({length:49},(_,i)=>{const angle=-Math.PI/2+sweep*i/48;return `${50+80*Math.cos(angle)}% ${50+80*Math.sin(angle)}%`;}).join(",")},50% 50%)`;
}
type Effect = "fade" | "grow" | "draw" | "radial" | "drop" | "pulse" | "label" | "expand";
interface Target { element: Element; effect: Effect; origin?: string; reference?: "fill-box" | "view-box"; group?:string; pulseScale?:boolean; }
function chartRoot(host: MotionHost): ShadowRoot {
  const nested = host.shadowRoot!.querySelector<HTMLElement>('[part="series-host"]');
  return nested && !nested.hidden && nested.shadowRoot ? nested.shadowRoot : host.shadowRoot!;
}
function targets(host: MotionHost): Target[] {
  const root=chartRoot(host), tag=(host.constructor as typeof HTMLElement & {tagName?:string}).tagName??host.localName;
  let selector: string, effect: Effect;
  if (tag === "box-pie-chart" || tag === "box-donut-chart") { selector='[part="chart"]';effect="radial"; }
  else if (tag === "box-radar-chart" || tag === "box-polar-area-chart") { selector='[part="marks"] > path';effect="grow"; }
  else if (tag === "box-line-chart") { selector=(host.animationPreset==="drop"?'[part="path"],[part="area"],[part="dots"] > g > circle,[part="dots"] > g > ellipse,[part="series"] > path,[part="series"] > g > ellipse':'[part="path"],[part="area"],[part="dots"],[part="series"] > *')+',[part="point-value"]';effect="draw"; }
  else if (tag === "box-metric-card") { selector='[part="value"]';effect="fade"; }
  else if (tag === "box-stacked-bar-chart") { selector='[part="segment"]';effect="fade"; }
  else if (tag === "box-range-chart") { selector='[part="range"]';effect="expand"; }
  else if (tag === "box-box-plot") { selector='[part="distribution"]';effect="expand"; }
  else if (tag === "box-distribution-timeline") { selector='[part="interval"],[part="median"],[part="samples"]';effect="draw"; }
  else if (tag === "box-bar-chart" || tag === "box-chart-panel") { selector='[part="bar"],[part="point-value"]';effect="grow"; }
  else { selector='[part="mark"],[part="series-path"],[part="area"],[part="direct-value"]';effect="grow"; }
  return Array.from(root.querySelectorAll(selector)).filter(element=>!element.closest('[hidden]')).map(element=>{
    const part=element.getAttribute("part"), shape=element.localName;
    const ownEffect=part==="point-value"||part==="direct-value"?"label":part==="series-path"||part==="area"?"draw":effect;
    const origin=(element as HTMLElement).dataset.animationOrigin ?? (effect==="expand"?"50% 50%":shape==="circle"||shape==="ellipse"?"50% 50%":tag==="box-radar-chart"||tag==="box-polar-area-chart"?"50% 50%":"50% 100%");
    const group=["box-line-chart","box-area-chart","box-mixed-chart"].includes(tag)?element.getAttribute("data-animation-group")??element.closest('[data-series-id]')?.getAttribute("data-series-id")??"line":element.getAttribute("data-point")??element.getAttribute("data-animation-point-id")??element.closest('[data-point-id]')?.getAttribute("data-point-id")??undefined;
    return {element,effect:ownEffect,origin,group,reference:tag==="box-radar-chart"||tag==="box-polar-area-chart"?"view-box":"fill-box"};
  });
}
function frames(target: Target, effect: Effect, easing: ChartAnimationEasing): Keyframe[] {
  const radial = target.effect === "radial", svg = target.element.namespaceURI === "http://www.w3.org/2000/svg";
  return Array.from({length:41},(_,i)=>{
    const t=i/40,p=chartEasing(easing,t), safe=clamp(p);
    const common: Keyframe={offset:t,transformBox:svg && radial?"view-box":target.reference??"fill-box",transformOrigin:target.origin??"50% 50%"};
    if(effect==="label")return {...common,opacity:clamp((t-.8)/.2)};
    if(effect==="radial")return {...common,clipPath:radialReveal(p)};
    if(effect==="draw")return {...common,clipPath:`inset(-100vmax ${(1-safe)*100}% -100vmax -2px)`};
    if(effect==="pulse")return {...common,...(target.pulseScale!==false&&target.element.matches("circle,ellipse")?{transform:`scale(${1+.5*Math.sin(Math.PI*t)})`}:{opacity:1-.4*Math.sin(Math.PI*t)})};
    if(effect==="drop")return {...common,...(svg?{transformOrigin:"50% 0%",transformBox:"view-box",transform:target.element.matches("circle,ellipse")?`translateY(${-Number(target.element.getAttribute("cy")??0)*(1-p)}px)`:`scaleY(${p})`}:{opacity:safe})};
    if(effect==="expand")return {...common,transform:target.element.getAttribute("data-animation-axis")==="y"?`scaleY(${safe})`:`scaleX(${safe})`};
    if(effect==="grow")return {...common,transform:target.element.matches("circle,ellipse")||radial||target.element.matches('[part="radar-line"],[part="sector"]')?`scale(${p})`:`scaleY(${p})`};
    return {...common,opacity:safe};
  });
}

/** One bounded browser timeline per rendered mark; never rebuilds source geometry per frame. */
export class ChartMotion {
  private animations: Animation[]=[];
  private contentKey="";
  private dataRevision=0;
  private nodes: Element[]=[];
  private queued=false;
  private force=false;
  private connected=false;
  private media: MediaQueryList|null=null;
  private controls: HTMLElement|null=null;
  private loopTarget: Element|null=null;
  private lastPulseTarget: Element|null=null;
  private lastSourceChange=0;
  private onPreference=()=>this.finish();
  private onVisibility=()=>{if(document.hidden)this.animations.forEach(a=>a.pause());else if(!this.host.animationPaused)this.animations.forEach(a=>a.play());};
  private onInteraction=(event: Event)=>{
    const element=event.composedPath().find(node=>node instanceof Element) as Element|undefined;
    if(!element||element.closest('[part="animation-controls"]'))return;
    if(this.host.animationPreset==="loop")queueMicrotask(()=>{
      if(!this.connected)return;
      // A roving control may move focus before keydown bubbles to this listener.
      // Inspect the resulting focus, rather than pulsing the former key target.
      const active=chartRoot(this.host).activeElement??this.host.shadowRoot?.activeElement;
      this.pulse(event.type==="keydown"&&active?active:element);
    });
    else if(event.type==="focusin"||event.type==="pointerdown")this.finish();
  };
  private onLeave=()=>{if(this.host.animationPreset==="loop")this.cancel();};
  constructor(private host: MotionHost) {}
  connect(): void {
    this.connected=true;
    if(typeof matchMedia==="function") {this.media=matchMedia("(prefers-reduced-motion: reduce)");this.media.addEventListener?.("change",this.onPreference);}
    this.host.shadowRoot!.addEventListener("focusin",this.onInteraction);
    this.host.shadowRoot!.addEventListener("pointerdown",this.onInteraction);
    this.host.shadowRoot!.addEventListener("pointerover",this.onInteraction);
    this.host.shadowRoot!.addEventListener("keydown",this.onInteraction);
    this.host.addEventListener("pointerleave",this.onLeave);
    this.host.addEventListener("focusout",this.onLeave);
    document.addEventListener("visibilitychange",this.onVisibility);
  }
  disconnect(): void {
    this.connected=false;this.cancel();this.contentKey="";this.nodes=[];this.lastPulseTarget=null;this.lastSourceChange=0;
    this.media?.removeEventListener?.("change",this.onPreference);this.media=null;
    for(const type of ["focusin","pointerdown","pointerover","keydown"])this.host.shadowRoot?.removeEventListener(type,this.onInteraction);
    this.host.removeEventListener("pointerleave",this.onLeave);this.host.removeEventListener("focusout",this.onLeave);
    document.removeEventListener("visibilitychange",this.onVisibility);
  }
  rendered(force=false): void {
    if(!this.connected)return;
    this.force ||= force;
    if(this.queued)return;this.queued=true;
    queueMicrotask(()=>{this.queued=false;if(this.connected){const replay=this.force;this.force=false;this.sync(replay);}});
  }
  dataChanged(): void {this.dataRevision++;}
  replay(): void {
    if(this.host.animationPreset!=="loop"){this.rendered(true);return;}
    queueMicrotask(()=>{
      if(!this.connected||!this.enabled())return;
      const target=chartRoot(this.host).querySelector('[part="focus-marker"] circle')??(this.lastPulseTarget?.isConnected?this.lastPulseTarget:null)??this.nodes[0]?.querySelector('[part="segment"]')??this.nodes[0];
      if(target){this.cancel();this.startPulse(target);}
    });
  }
  private cancel(): void { for(const a of this.animations)a.cancel();this.animations=[];this.loopTarget=null; }
  finish(): void {this.cancel();this.lastPulseTarget=null;this.syncControls();}
  private enabled(): boolean {return this.host.animated&&this.host.animationDuration>0&&!this.media?.matches&&typeof Element.prototype.animate==="function"&&!this.host.matches('[state="loading"],[state="error"]');}
  private sync(force: boolean): void {
    const key=`revision=${this.dataRevision}\n`+sourceAttributes.map(name=>`${name}=${this.host.getAttribute(name)??""}`).join("\n");
    const list=this.host.animated?targets(this.host):[];
    const same=key===this.contentKey;
    const now=performance.now();
    const rapidUpdate=!same&&this.nodes.length>0&&now-this.lastSourceChange<this.host.animationDuration;
    if(!same)this.lastSourceChange=now;
    const replaced=list.length!==this.nodes.length||list.some((t,i)=>t.element!==this.nodes[i]);
    this.contentKey=key;this.nodes=list.map(t=>t.element);
    if(!this.enabled()||!list.length) {this.finish();return;}
    if(same&&!force) {
      if(replaced){
        // ResizeObserver may settle the initial plot after its first render.
        // Transfer the existing clock to replacement marks, rather than losing
        // the entrance or starting it again from zero during a later resize.
        const time=this.animations[0]?.currentTime;
        const elapsed=typeof time==="number"?time:0;
        const active=this.animations.length>0&&this.host.animationPreset!=="loop";
        this.cancel();if(active)this.entrance(list,elapsed);
      }
      this.animations.forEach(a=>this.host.animationPaused?a.pause():document.hidden?a.pause():a.play());
      if(this.host.animationPreset==="loop"&&!this.host.animationPaused&&!this.animations.length&&this.lastPulseTarget?.isConnected)this.startPulse(this.lastPulseTarget);
      this.syncControls();return;
    }
    this.cancel();
    // Live snapshots must not keep returning to an empty entrance frame. A new
    // snapshot during motion (or while paused) is displayed exactly and still.
    if(!force&&(rapidUpdate||this.host.animationPaused)){this.syncControls();return;}
    this.entrance(list);
    this.syncControls();
  }
  private entrance(list:Target[],elapsed=0):void {
    if(this.host.animationPreset!=="loop") {
      const groups=[...new Set(list.map((target,i)=>target.group??`mark-${i}`))];
      const phases=new Map(groups.map((group,i)=>[group,i]));
      const stagger=this.host.animationPreset==="delay"||this.host.animationPreset==="drop"?Math.min(this.host.animationStagger,this.host.animationDuration/2/Math.max(1,groups.length-1)):0;
      const duration=this.host.animationDuration-stagger*Math.max(0,groups.length-1);
      list.forEach((target,i)=>{
        const preset=this.host.animationPreset;
        const effect:Effect=target.effect==="label"?"label":preset==="fade"?"fade":preset==="drop"?"drop":preset==="progressive"||preset==="progressive-easing"?target.effect==="radial"?"radial":"draw":target.effect;
        const easing=preset==="progressive"?"linear":preset==="drop"&&!this.host.hasAttribute("animation-easing")?"ease-in-out-elastic":this.host.animationEasing;
        const delay=this.host.animationDelay+phases.get(target.group??`mark-${i}`)!*stagger;
        if(this.host.animationLoop||elapsed<delay+duration)this.start(target,frames(target,effect,easing),{duration,delay,iterations:this.host.animationLoop?Infinity:1,fill:"backwards"},elapsed);
      });
    }
  }
  private start(target:Target,keyframes:Keyframe[],options:KeyframeAnimationOptions,elapsed=0): void {
    const animation=target.element.animate(keyframes,{...options,easing:"linear"});
    animation.currentTime=elapsed;
    this.animations.push(animation);
    animation.onfinish=()=>{this.animations=this.animations.filter(a=>a!==animation);this.syncControls();};
    if(this.host.animationPaused||document.hidden)animation.pause();
  }
  private pulse(element:Element):void {
    if(!this.enabled()||this.host.animationPaused)return;
    const root=chartRoot(this.host);
    const control=element.closest('[data-point],[data-series],[data-point-id],[data-segment-id],[data-series-id],[data-id],[part="point"],[part="mark"],[part="legend-item"],[part="value"],[part="segment"],[part="range"],[part="interval"],[part="dot"]');
    if(!control&&!element.closest('[part="plot"],[part="chart"]')&&!element.matches("circle,ellipse")){this.cancel();return;}
    const data=control as HTMLElement|null;
    let target:Element|null=element.matches("circle,ellipse")&&element.getAttribute("fill")!=="transparent"&&element.getAttribute("part")!=="dot-halo"?element:null;
    if(!target&&data){
      const point=data.dataset.pointId??data.dataset.point,segment=data.dataset.segmentId,series=data.dataset.seriesId??data.dataset.series,id=data.dataset.id;
      target=Array.from(root.querySelectorAll('[part="mark"],[part="dot"],[part="segment"],[part="series-path"],[part="sector"],[part="radar-line"],[part="interval"]')).find(node=>{
        const value=(node as HTMLElement).dataset;
        if(point!==undefined)return value.point===point||value.pointId===point||value.animationPointId===point;
        if(segment!==undefined)return value.segmentId===segment;
        if(series!==undefined)return value.seriesId===series||value.animationGroup===series;
        return node===control||id!==undefined&&(value.id===id||value.animationSeriesId===id);
      })??control!.querySelector('[part="bar"]')??control;
    }
    target??=root.querySelector('[part="focus-marker"] circle');
    if(target)this.startPulse(target);
  }
  private startPulse(target:Element):void {
    if(target===this.loopTarget)return;
    this.cancel();this.loopTarget=target;this.lastPulseTarget=target;
    const bubble=(this.host.constructor as typeof HTMLElement & {tagName?:string}).tagName==="box-bubble-chart";
    const item={element:target,effect:"pulse" as const,origin:"50% 50%",pulseScale:!bubble||!!target.closest('[part="focus-marker"]')};
    this.start(item,frames(item,"pulse","linear"),{duration:this.host.animationDuration,iterations:this.host.animationLoop?Infinity:1,fill:"none"});
    this.syncControls();
  }
  private syncControls():void {
    const show=this.enabled()&&this.nodes.length>0;
    if(!show){
      const owned=this.controls?.contains(this.host.shadowRoot!.activeElement);
      this.controls?.remove();this.controls=null;
      if(owned){const heading=this.host.shadowRoot!.querySelector<HTMLElement>('[part="title"],[part="heading"]');if(heading){heading.tabIndex=-1;heading.focus();}}
      return;
    }
    if(!this.controls){
      this.controls=document.createElement("div");this.controls.setAttribute("part","animation-controls");this.controls.setAttribute("role","group");this.controls.setAttribute("aria-label","Chart animation");
      const style=document.createElement("style");
      style.textContent='[part="animation-controls"]{display:flex;flex-wrap:wrap;gap:.5rem;padding:.5rem 0;font:inherit;color:inherit;min-inline-size:0}[part~="animation-control"]{font:inherit;color:inherit;background:transparent;border:1px solid currentColor;border-radius:.25rem;padding:.4rem .65rem;cursor:pointer;max-inline-size:100%;min-inline-size:0;overflow-wrap:anywhere}[part~="animation-control"]:focus-visible{outline:2px solid var(--boe-token-surface-surface-brand,#0061d5);outline-offset:2px}';
      this.controls.append(style);
      for(const action of ["pause","replay"]){const button=document.createElement("button");button.type="button";button.dataset.motionAction=action;button.setAttribute("part",`animation-control animation-${action}`);this.controls.append(button);}
      this.controls.addEventListener("click",event=>{const action=(event.target as HTMLElement).closest("button")?.dataset.motionAction;if(action==="pause"){this.host.animationPaused=!this.host.animationPaused;}else if(action==="replay"){this.host.animationPaused=false;this.replay();}});
      this.host.shadowRoot!.append(this.controls);
    }
    const pause=this.controls.querySelector<HTMLButtonElement>('[data-motion-action="pause"]')!;
    pause.textContent=this.host.animationPaused?"Resume animation":"Pause animation";pause.setAttribute("aria-pressed",String(this.host.animationPaused));
    this.controls.querySelector('[data-motion-action="replay"]')!.textContent="Replay animation";
  }
}
