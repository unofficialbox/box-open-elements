import { afterEach, describe, expect, it, vi } from "vitest";
import { purposeExamples, purposeCommandCatalog } from "../../storybook/fixtures/purpose-demos.js";
import "../../src/entries/button.js";
import "../../src/entries/menu-item.js";
import "../../src/entries/skeleton.js";
import "../../src/entries/grid.js";
import "../../src/entries/context-menu.js";
import "../../src/entries/command-palette.js";
import "../../src/entries/popover.js";
import "../../src/entries/shortcuts-overlay.js";
import "../../src/entries/explorer-breadcrumbs.js";
import "../../src/entries/explorer-list.js";
import "../../src/entries/explorer-action-menu.js";
import "../../src/entries/item-form.js";
import "../../src/entries/preview.js";
import "../../src/entries/file-request-builder.js";
import "../../src/entries/text-field.js";
import type { ItemForm } from "../../src/patterns/item/item-form.js";
import type { Preview } from "../../src/patterns/preview/preview-element.js";
let cleanup: (() => void) | undefined;
function mount(id: string): HTMLElement {
    const root = document.createElement('div');
    document.body.append(root);
    const example = purposeExamples[id]!;
    root.innerHTML = example.html;
    cleanup = example.setup!(root) || undefined;
    return root;
}
const click = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(selector)!.click();
const status = (root: HTMLElement) => root.querySelector('[data-status]')!.textContent;
afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    document.body.replaceChildren();
    vi.useRealTimers();
});
describe('task-oriented catalog demos', () => {
    it('provides platform-specific hints and executes scoped keyboard commands', () => {
        expect(purposeCommandCatalog('MacIntel')[0]!.shortcut).toBe('Cmd+Shift+D');
        expect(purposeCommandCatalog('Win32')[0]!.shortcut).toBe('Ctrl+Shift+D');
        const root = mount('shortcuts-overlay');
        root.querySelector('[data-demo="open"]')!.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', shiftKey: true, ctrlKey: true, metaKey: true, bubbles: true, composed: true, cancelable: true }));
        expect(status(root)).toBe('File details opened.');
        const input = document.createElement('input');
        root.querySelector('.purpose-demo')!.append(input);
        input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', shiftKey: true, ctrlKey: true, metaKey: true, bubbles: true, composed: true }));
        expect(status(root)).toBe('File details opened.');
    });
    it.each([
        ['command-palette', 'box-command-palette', 'command-selected', { command: { id: 'activity' } }, 'File activity opened.'],
        ['command-palette', 'box-command-palette', 'command-selected', { command: { id: 'details' } }, 'File details opened.'],
        ['context-menu', 'box-context-menu', 'item-selected', { id: 'details' }, 'File details opened.'],
        ['shortcuts-overlay', 'box-shortcuts-overlay', 'dismissed', {}, 'Keyboard shortcuts closed.'],
    ])('%s renders the event outcome and unsubscribes on teardown', (id, selector, event, detail, message) => {
        const root = mount(id as string);
        click(root, '[data-demo="open"]');
        root.querySelector(selector as string)!.dispatchEvent(new CustomEvent(event as string, { detail }));
        expect(status(root)).toBe(message);
        cleanup!();
        root.querySelector('[data-status]')!.textContent = 'Disposed';
        root.querySelector(selector as string)!.dispatchEvent(new CustomEvent(event as string, { detail }));
        expect(status(root)).toBe('Disposed');
    });
    it.each([['grid', 'review', 'Plan details opened.'], ['popover', 'acknowledge', 'Sharing details acknowledged.']])('%s actions complete their task', (id, action, message) => {
        const root = mount(id!);
        click(root, `[data-demo="${action}"]`);
        expect(status(root)).toBe(message);
    });
    it('navigates the breadcrumb and list through one controller', async () => {
        const root = mount('explorer-breadcrumbs');
        await vi.waitFor(() => expect(status(root)).toBe('Marketing opened.'));
        const controller = (root.querySelector('box-explorer-breadcrumbs') as HTMLElement & {
            controller: {
                navigateTo(id: string): Promise<void>;
            };
        }).controller;
        await controller.navigateTo('77');
        expect(status(root)).toBe('Legal opened.');
        expect(root.querySelector('box-explorer-list')!.shadowRoot!.textContent).toContain('Legal Quarterly Plan.pdf');
    });
    it('opens real details from a permitted explorer action', async () => {
        const root = mount('explorer-action-menu');
        const menu = root.querySelector('box-explorer-action-menu')!;
        await vi.waitFor(() => expect(menu.shadowRoot!.querySelector('[part="trigger"]')).not.toBeNull());
        (menu.shadowRoot!.querySelector('[part="trigger"]') as HTMLButtonElement).click();
        expect(menu.shadowRoot!.querySelector<HTMLButtonElement>('[data-action-id="delete"]')!.disabled).toBe(true);
        (menu.shadowRoot!.querySelector('[data-action-id="details"]') as HTMLButtonElement).click();
        expect(status(root)).toBe('Details opened for Quarterly Plan.pdf.');
    });
    it('reports dirty request settings and previews the current values', () => {
        const root = mount('file-request-builder');
        const builder = root.querySelector('box-file-request-builder') as HTMLElement & {
            value: Record<string, boolean>;
        };
        builder.value = { notify: false };
        builder.dispatchEvent(new CustomEvent('value-changed'));
        expect(status(root)).toBe('Unsaved draft changes.');
        builder.dispatchEvent(new CustomEvent('action', { detail: { action: 'preview' } }));
        expect(root.querySelector('[data-preview-settings]')!.textContent).toContain('off');
    });
    it.each(Object.keys(purposeExamples))('%s has a mountable, disposable live example', id => {
        const root = mount(id);
        expect(root.querySelector('.purpose-demo')).not.toBeNull();
        expect(cleanup).toBeTypeOf('function');
        expect(purposeExamples[id]!.variants?.[0]?.setup).toBe(purposeExamples[id]!.setup);
    });
    it('sorts actual file rows and maintains exclusive menu selection', () => {
        const root = mount('menu-item');
        const recent = root.querySelector('box-menu-item[value="modified"]')!;
        (recent.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
        expect(root.querySelector('[data-files] li')!.textContent).toBe('Quarterly Plan.pdf');
        expect(root.querySelectorAll('box-menu-item[selected]')).toHaveLength(1);
        expect(status(root)).toContain('most recent');
    });
    it('replaces a loading placeholder and cancels pending work on teardown', () => {
        vi.useFakeTimers();
        const root = mount('skeleton');
        expect(root.querySelector('[data-loaded]')!.hasAttribute('hidden')).toBe(true);
        vi.advanceTimersByTime(450);
        expect(status(root)).toBe('Three files loaded.');
        click(root, '[data-demo="load"]');
        cleanup!();
        vi.advanceTimersByTime(1000);
        expect(status(root)).toBe('Loading three files…');
    });
    it('validates, preserves failed edits, retries and discards to the saved value', () => {
        vi.useFakeTimers();
        const root = mount('item-form');
        const form = root.querySelector<ItemForm>('box-item-form')!;
        const submit = () => form.dispatchEvent(new CustomEvent('submit', { detail: { value: form.value } }));
        expect(form.value.name).toBe('Quarterly Plan.pdf');
        form.value = { name: '', status: 'Draft' };
        submit();
        expect(root.querySelector('[data-error]')!.textContent).toContain('Name is required');
        form.value = { name: 'Revised.pdf', status: 'Final' };
        click(root, '[data-demo="fail"]');
        submit();
        expect(form.disabled).toBe(true);
        vi.advanceTimersByTime(450);
        expect(form.disabled).toBe(false);
        expect(form.value.name).toBe('Revised.pdf');
        expect(root.querySelector('[data-error]')!.textContent).toContain('preserved');
        submit();
        vi.advanceTimersByTime(450);
        expect(status(root)).toBe('Changes saved locally.');
        form.value = { name: 'Discard me', status: 'Draft' };
        form.dispatchEvent(new CustomEvent('cancel'));
        expect(form.value.name).toBe('Revised.pdf');
    });
    it('does not finish a save after the demo is disposed', () => {
        vi.useFakeTimers();
        const root = mount('item-form');
        root.querySelector('box-item-form')!.dispatchEvent(new CustomEvent('submit'));
        cleanup!();
        vi.advanceTimersByTime(1000);
        expect(status(root)).toBe('Saving changes locally…');
    });
    it('mounts real preview content, switches lifecycle and detaches the provider', () => {
        const root = mount('preview-element');
        const preview = root.querySelector<Preview>('box-preview-element')!;
        expect(preview.shadowRoot!.textContent).toContain('Milestones');
        click(root, '[data-demo="loading"]');
        expect(preview.providerAdapter!.getState()!.status).toBe('loading');
        click(root, '[data-demo="error"]');
        expect(preview.shadowRoot!.textContent).toContain('Select Show document to retry');
        click(root, '[data-demo="unsupported"]');
        expect(preview.shadowRoot!.textContent).toContain('cannot be previewed');
        click(root, '[data-demo="ready"]');
        expect(preview.shadowRoot!.textContent).toContain('Milestones');
        cleanup!();
        expect(preview.providerAdapter).toBeNull();
    });
    it('previews and saves request settings without claiming publication', () => {
        const root = mount('file-request-builder');
        const builder = root.querySelector('box-file-request-builder')!;
        const action = (id: string) => builder.dispatchEvent(new CustomEvent('action', { detail: { action: id } }));
        action('preview');
        expect(root.querySelector('[data-request-preview]')!.hasAttribute('hidden')).toBe(false);
        expect(root.querySelector('[data-preview-settings]')!.textContent).toContain('on');
        action('save');
        expect(status(root)).toContain('Not published');
        action('copy-link');
        expect(root.querySelector('[data-error]')!.textContent).toContain('no public upload link');
        const title = root.querySelector('[data-title]') as HTMLElement & {
            value: string;
        };
        title.value = '';
        action('save');
        expect(root.querySelector('[data-error]')!.textContent).toContain('title is required');
    });
});
