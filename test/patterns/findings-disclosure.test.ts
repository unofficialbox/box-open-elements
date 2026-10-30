// @vitest-environment jsdom
import {afterEach,it,expect,vi} from "vitest";
import axe from "axe-core";
import {FindingsDisclosure} from "../../src/patterns/governance/findings-disclosure.js";
afterEach(()=>document.body.replaceChildren());
it("keeps corrected fields visible, counts each kind and expands supporting evidence",()=>{
 const el=new FindingsDisclosure();el.findings=["Lead","Second","Third"];el.corrections=[{field:"Token count",was:"12",now:"21",why:"Included tool results"}];el.limits=["Illustrative scope"];document.body.append(el);
 const root=el.shadowRoot!,toggle=root.querySelector<HTMLButtonElement>('button')!;
 expect(root.querySelector('[part="lead"]')!.textContent).toBe("Lead");
 expect(root.querySelector('[part="correction-summary"]')!.textContent).toBe("Corrected: Token count");
 expect(toggle.textContent).toBe("Show 2 more findings · 1 correction · 1 limit");
 const changed=vi.fn();el.addEventListener("expanded-changed",changed);toggle.focus();toggle.click();
 expect(root.activeElement).toBe(toggle);expect(toggle.getAttribute("aria-expanded")).toBe("true");
 expect(root.querySelector<HTMLElement>('[part="details"]')!.hidden).toBe(false);
 expect(root.querySelector('[part="details"]')!.textContent).toContain("Was: 12Now: 21Reason: Included tool results");
 toggle.click();expect(changed).toHaveBeenCalledTimes(2);expect(root.querySelector('[part="correction-summary"]')!.textContent).toContain("Token count");
});
it("omits a toggle when no detail exists and handles lead count zero and empty data",()=>{
 const el=new FindingsDisclosure();el.findings=["Only"];document.body.append(el);const toggle=el.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
 expect(toggle.hidden).toBe(true);el.leadCount=0;expect(toggle.hidden).toBe(false);expect(toggle.textContent).toContain("1 more finding");
 el.findings=[];expect(toggle.hidden).toBe(true);el.leadCount=-1;expect(el.leadCount).toBe(1);
});
it("escapes host content and ignores malformed records without executing markup",()=>{
 const el=new FindingsDisclosure();el.findings=['<img src=x onerror="alert(1)">'];el.corrections=[{field:"<script>",was:"<b>",now:"Safe",why:"Text"}];document.body.append(el);
 el.expanded=true;expect(el.shadowRoot!.querySelector('img,script,b')).toBeNull();
 el.setAttribute("findings","{}");el.setAttribute("corrections",'[null,{"field":3}]');expect(el.findings).toEqual([]);expect(el.corrections).toEqual([]);
});
it("exposes accessible disclosure semantics collapsed and expanded",async()=>{
 const el=new FindingsDisclosure();el.findings=["Lead","Detail"];el.limits=["Scope"];document.body.append(el);
 for(const expanded of [false,true]){el.expanded=expanded;const result=await axe.run(el,{rules:{"color-contrast":{enabled:false}}});expect(result.violations).toEqual([]);}
});
