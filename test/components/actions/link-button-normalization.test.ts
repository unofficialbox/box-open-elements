// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { LinkButton } from "../../../src/components/actions/link-button.js";
import { isSafeHref } from "../../../src/patterns/internal/safe-href.js";
LinkButton.register();
afterEach(() => document.body.replaceChildren());
for (let byte = 0; byte <= 0x20; byte++) {
  it(`blocks a browser-normalized forbidden scheme behind U+${byte.toString(16).padStart(4,"0")}`, () => {
    const e = new LinkButton(); document.body.append(e);
    for (const scheme of ["javascript:synthetic_marker()","data:text/plain,synthetic","vbscript:synthetic_marker()"]){
      e.href = String.fromCharCode(byte)+scheme;
      expect(e.shadowRoot!.querySelector("a")!.getAttribute("href")).toBe("#");
    }
  });
}
it("normalizes embedded tab/newline/CR and preserves the allowed scheme policy", () => {
  const e = new LinkButton(); document.body.append(e);
  for (const href of ["java\tscript:synthetic_marker()","java\nscript:synthetic_marker()","java\rscript:synthetic_marker()"," \u0001javascript:synthetic_marker()\u0002 "]){
    e.href=href; expect(e.shadowRoot!.querySelector("a")!.getAttribute("href")).toBe("#");
  }
  for(const href of ["http://example.invalid/a","https://example.invalid/a","mailto:synthetic@example.invalid","tel:+15555550100","//example.invalid/a","/relative/path","../relative","#fragment","?query=one"]){
    e.href=href; expect(e.shadowRoot!.querySelector("a")!.getAttribute("href")).toBe(href);
  }
});
it("the other anchored helper rejects this exact C0 javascript family", () => {
  for(let byte=0;byte<=0x20;byte++)expect(isSafeHref(String.fromCharCode(byte)+"javascript:synthetic_marker()")).toBe(false);
});
it("mixed C0 and Unicode whitespace cannot leave a forbidden browser protocol", () => {
  const e = new LinkButton(); document.body.append(e);
  for(const prefix of ["\ufeff\u0001", "\u0001\ufeff", "\t\ufeff\u0001", "\u0001 \u0002", "\u00a0\u0001", "\u0001\u00a0", "\u0001\t"]){
    for(const scheme of ["javascript:synthetic_marker()","data:text/plain,synthetic","vbscript:synthetic_marker()"]){
      e.href=prefix+scheme;
      const protocol=new URL(e.shadowRoot!.querySelector("a")!.getAttribute("href")!,"https://example.invalid/base/").protocol;
      expect(["javascript:","data:","vbscript:"]).not.toContain(protocol);
    }
  }
});
