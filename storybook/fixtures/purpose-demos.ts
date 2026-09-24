import type { ComponentExample } from "../../docs-site/examples.js";
import type { ItemForm } from "../../src/patterns/item/item-form.js";
import type { FileRequestBuilder } from "../../src/patterns/file-request/file-request-builder.js";
import type { Preview } from "../../src/patterns/preview/preview-element.js";
import type { PreviewAdapterState, PreviewProviderAdapter } from "../../src/patterns/preview/provider-adapter.js";
import type { ContextMenu } from "../../src/components/overlays/context-menu.js";
import type { MenuItem } from "../../src/components/actions/menu-item.js";
import type { CommandPalette } from "../../src/components/overlays/command-palette.js";
import type { ShortcutsOverlay } from "../../src/components/overlays/shortcuts-overlay.js";
import { createExplorerDemoController, createExplorerDemoTransport, explorerDemoItems } from "../../docs-site/explorer-adapter-demo.js";
type Setup = (root: HTMLElement) => (() => void);
const button = (id: string, label: string) => `<box-button data-demo="${id}" label="${label}" tone="neutral"></box-button>`;
const styles = `<style>
.purpose-demo{display:grid;gap:16px;min-width:0;container:purpose / inline-size}
.purpose-demo [data-controls]{display:flex;flex-wrap:wrap;gap:8px}
.purpose-demo p{margin:0;max-width:75ch;overflow-wrap:anywhere}
.purpose-demo [data-status]{min-height:1.5em}
.purpose-demo [data-error]:empty{display:none}
.purpose-demo [data-error]{color:var(--boe-token-text-status-text-error,#b92340)}
.purpose-demo [hidden]{display:none!important}
.purpose-demo .purpose-grid>section{padding:16px;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);min-width:0;overflow-wrap:anywhere}
@container purpose (max-width:540px){.purpose-demo .purpose-grid>section{grid-column:1 / -1}}
</style>`;
function example(html: string, setup: Setup, note: string): ComponentExample {
    const markup = `${styles}<div class="purpose-demo">${html}<p data-error role="alert"></p><p data-status role="status"></p></div>`;
    return { html: markup, setup, note, variants: [{ name: "Interactive", html: markup, setup, note }] };
}
function harness(root: HTMLElement) {
    const abort = new AbortController();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const on = (selector: string, event: string, fn: (event: Event) => void) => root.querySelector(selector)?.addEventListener(event, fn, { signal: abort.signal });
    const status = (text: string) => {
        root.querySelector('[data-status]')!.textContent = text;
    };
    const error = (text: string) => {
        root.querySelector('[data-error]')!.textContent = text;
    };
    const later = (fn: () => void) => {
        const id = setTimeout(() => {
            timers.delete(id);
            fn();
        }, 450);
        timers.add(id);
    };
    return { on, status, error, later, cleanup: () => {
            abort.abort();
            timers.forEach(clearTimeout);
        } };
}
export const purposeCommandCatalog = (platform: string) => [
    { id: "details", label: "Show file details", shortcut: `${/Mac|iPhone|iPad/.test(platform) ? 'Cmd' : 'Ctrl'}+Shift+D`, group: "File" },
    { id: "activity", label: "Show file activity", shortcut: `${/Mac|iPhone|iPad/.test(platform) ? 'Cmd' : 'Ctrl'}+Shift+A`, group: "File" },
    { id: "delete", label: "Delete file", disabled: true, group: "File" },
];
const infoPanel = `<section data-detail hidden><h3>Quarterly Plan.pdf</h3><p>Owner: Morgan Lee. Version: 4. Access: view only.</p></section>`;
const activityPanel = `<section data-activity hidden><h3>File activity</h3><p>Morgan Lee uploaded version 4 today.</p></section>`;
function bindCommands(root: HTMLElement, h: ReturnType<typeof harness>, close: () => void) {
    const execute = (id: string) => {
        root.querySelector<HTMLElement>(id === 'details' ? '[data-detail]' : '[data-activity]')!.hidden = false;
        close();
        h.status(id === 'details' ? 'File details opened.' : 'File activity opened.');
    };
    h.on('.purpose-demo', 'keydown', event => {
        const key = event as KeyboardEvent;
        const origin = key.composedPath()[0];
        if (origin instanceof HTMLElement && (origin.isContentEditable || origin.matches('input,textarea,select'))) return;
        const modifier = /Mac|iPhone|iPad/.test(navigator.platform) ? key.metaKey : key.ctrlKey;
        if (!modifier || !key.shiftKey || key.altKey || !['KeyD', 'KeyA'].includes(key.code)) return;
        key.preventDefault();
        execute(key.code === 'KeyD' ? 'details' : 'activity');
    });
    return execute;
}
export const purposeExamples: Record<string, ComponentExample> = {
    "menu-item": example(`<p>Choose how files are ordered.</p><div role="menu" aria-label="Sort files"><box-menu-item label="Name" value="name" selected></box-menu-item><box-menu-item label="Recently modified" value="modified"></box-menu-item><box-menu-item label="Size (not available)" value="size" disabled></box-menu-item></div><ol data-files><li>Brand Guidelines.pdf</li><li>Quarterly Plan.pdf</li></ol>`, root => {
        const h = harness(root);
        const items = Array.from(root.querySelectorAll<MenuItem>('box-menu-item'));
        h.on('[role="menu"]', 'selected', event => {
            const { value } = (event as CustomEvent<{
                value: string;
            }>).detail;
            items.forEach(item => item.selected = item.value === value);
            root.querySelector('[data-files]')!.replaceChildren(...(value === 'name' ? ['Brand Guidelines.pdf', 'Quarterly Plan.pdf'] : ['Quarterly Plan.pdf', 'Brand Guidelines.pdf']).map(name => {
                const li = document.createElement('li');
                li.textContent = name;
                return li;
            }));
            h.status(value === 'name' ? 'Files sorted by name.' : 'Files sorted by most recent change.');
        });
        h.on('[role="menu"]', 'keydown', event => {
            const key = (event as KeyboardEvent).key;
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key))
                return;
            event.preventDefault();
            const enabled = items.filter(item => !item.disabled);
            const index = enabled.findIndex(item => event.composedPath().includes(item));
            const next = key === 'Home' ? 0 : key === 'End' ? enabled.length - 1 : (index + (key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
            enabled[next]?.focus();
        });
        return h.cleanup;
    }, 'A host-owned selection updates both the checked item and the actual file order. Size is unavailable.'),
    skeleton: example(`<div data-controls>${button('load', 'Load files again')}</div><section aria-label="Files" data-loading aria-busy="true"><box-skeleton variant="line" lines="3"></box-skeleton></section><ul data-loaded hidden><li>Quarterly Plan.pdf — Modified today</li><li>Brand Guidelines.pdf — Modified yesterday</li><li>Launch checklist.txt — Modified Monday</li></ul>`, root => {
        const h = harness(root);
        const loading = root.querySelector<HTMLElement>('[data-loading]')!;
        const loaded = root.querySelector<HTMLElement>('[data-loaded]')!;
        let busy = false;
        const load = () => {
            if (busy)
                return;
            busy = true;
            loading.hidden = false;
            loaded.hidden = true;
            loading.setAttribute('aria-busy', 'true');
            h.status('Loading three files…');
            h.later(() => {
                busy = false;
                loading.hidden = true;
                loading.setAttribute('aria-busy', 'false');
                loaded.hidden = false;
                h.status('Three files loaded.');
            });
        };
        h.on('[data-demo="load"]', 'click', load);
        load();
        return h.cleanup;
    }, 'A deterministic local loading transition. The placeholder represents the three rows that replace it; it is not a provider request.'),
    grid: example(`<box-grid class="purpose-grid"><section data-span="8"><h3>Quarterly plan</h3><p>Review the launch milestones, budget and owners before sharing the approved plan.</p><box-button data-demo="review" label="Review plan"></box-button></section><section data-span="4"><h3>File details</h3><p>Owner: Morgan Lee</p><p>Updated today</p></section></box-grid>${infoPanel}`, root => {
        const h = harness(root);
        h.on('[data-demo="review"]', 'click', () => {
            root.querySelector<HTMLElement>('[data-detail]')!.hidden = false;
            h.status('Plan details opened.');
        });
        return h.cleanup;
    }, 'An eight/four-column content layout stacks to full-width sections below 540px of available preview width.'),
    "command-palette": example(`<div data-controls>${button('open', 'Find a command')}</div><box-command-palette placeholder="Find a file command" hotkey="mod+k"></box-command-palette>${infoPanel}<section data-activity hidden><h3>File activity</h3><p>Morgan Lee uploaded version 4 today.</p></section>`, root => {
        const h = harness(root);
        const palette = root.querySelector<CommandPalette>('box-command-palette')!;
        palette.commands = purposeCommandCatalog(navigator.platform);
        const execute = bindCommands(root, h, () => { palette.open = false; });
        h.on('[data-demo="open"]', 'click', () => palette.show());
        h.on('box-command-palette', 'command-selected', event => {
            const id = (event as CustomEvent<{
                command: {
                    id: string;
                };
            }>).detail.command.id;
            execute(id);
        });
        return h.cleanup;
    }, 'Search, try an unmatched query, then execute Show file details. Delete is disabled. Escape returns focus to the trigger; the palette opens in the full viewport.'),
    "context-menu": example(`<box-context-menu><div tabindex="0" data-context-target><h3>Quarterly Plan.pdf</h3><p>Right-click or press Shift+F10. On touch, use File actions.</p>${button('open', 'File actions')}</div></box-context-menu>${infoPanel}`, root => {
        const h = harness(root);
        const menu = root.querySelector<ContextMenu>('box-context-menu')!;
        menu.items = [{ id: 'details', label: 'View details' }, { id: 'delete', label: 'Delete (view-only access)', disabled: true }];
        h.on('[data-demo="open"]', 'click', () => menu.show());
        h.on('box-context-menu', 'item-selected', () => {
            root.querySelector<HTMLElement>('[data-detail]')!.hidden = false;
            h.status('File details opened.');
        });
        return h.cleanup;
    }, 'Pointer, keyboard and explicit touch entry points share the same menu and local result. Delete is unavailable for this view-only file.'),
    popover: example(`<div style="display:flex;justify-content:flex-end"><box-popover label="Sharing details" placement="right"><p>Only invited collaborators can view this file.</p>${button('acknowledge', 'Got it')}</box-popover></div>`, root => {
        const h = harness(root);
        h.on('[data-demo="acknowledge"]', 'click', () => {
            (root.querySelector('box-popover') as HTMLElement & {
                hide(): void;
            }).hide();
            h.status('Sharing details acknowledged.');
        });
        return h.cleanup;
    }, 'Open near the right edge to exercise placement flipping. Escape or Got it dismisses; focus returns to Sharing details.'),
    "shortcuts-overlay": example(`<div data-controls>${button('open', 'Keyboard shortcuts')}</div><p>Shortcuts apply while focus is in this preview.</p><box-shortcuts-overlay heading="Keyboard shortcuts"></box-shortcuts-overlay>${infoPanel}${activityPanel}`, root => {
        const h = harness(root);
        const overlay = root.querySelector<ShortcutsOverlay>('box-shortcuts-overlay')!;
        overlay.commands = purposeCommandCatalog(navigator.platform);
        bindCommands(root, h, () => overlay.hide());
        h.on('[data-demo="open"]', 'click', () => overlay.show());
        h.on('box-shortcuts-overlay', 'dismissed', () => h.status('Keyboard shortcuts closed.'));
        return h.cleanup;
    }, 'Open with the button or its keyboard activation. The full-viewport overlay presents platform-aware shortcuts; Escape returns to the trigger.'),
    "explorer-breadcrumbs": example(`<box-explorer-breadcrumbs></box-explorer-breadcrumbs><box-explorer-list></box-explorer-list>`, root => {
        const h = harness(root);
        const controller = createExplorerDemoController();
        let disposed = false;
        root.querySelectorAll('box-explorer-breadcrumbs,box-explorer-list').forEach(node => (node as HTMLElement & {
            controller: typeof controller;
        }).controller = controller);
        const unsubscribe = controller.subscribe('folderLoaded', ({ folder }) => h.status(`${folder.name} opened.`));
        void controller.connect().then(() => {
            if (!disposed)
                return controller.navigateTo('42');
        });
        return () => {
            disposed = true;
            unsubscribe();
            h.cleanup();
            void controller.disconnect();
        };
    }, 'Start inside Marketing. All Files changes the shared controller and the list; opening Legal updates the breadcrumb and list together. Data is local.'),
    "explorer-action-menu": example(`<p>Quarterly Plan.pdf — view-only file</p><div style="display:flex;justify-content:flex-end"><box-explorer-action-menu></box-explorer-action-menu></div>${infoPanel}`, root => {
        const h = harness(root);
        const controller = createExplorerDemoController(createExplorerDemoTransport(explorerDemoItems.map(item => ({ ...item, permissions: { canDelete: false } }))), [
            { id: 'details', label: 'View details' },
            { id: 'delete', label: 'Delete (view-only access)', requiresPermission: 'canDelete' },
        ]);
        const menu = root.querySelector('box-explorer-action-menu') as HTMLElement & {
            controller: typeof controller;
            itemId: string;
        };
        menu.itemId = '123';
        menu.controller = controller;
        const unsubscribe = controller.subscribe('itemActionInvoked', ({ item }) => {
            root.querySelector<HTMLElement>('[data-detail]')!.hidden = false;
            h.status(`Details opened for ${item.name}.`);
        });
        void controller.connect();
        return () => {
            unsubscribe();
            h.cleanup();
            void controller.disconnect();
        };
    }, 'View details opens the selected file details. Delete is explicitly denied by the local item permissions and cannot be invoked.'),
    "item-form": example(`<p>Local save demonstration; no server changes.</p><box-item-form label="File properties" submit-label="Save changes"></box-item-form><div data-controls>${button('fail', 'Fail next save')}</div>`, root => {
        const h = harness(root);
        const form = root.querySelector<ItemForm>('box-item-form')!;
        let saved = { name: 'Quarterly Plan.pdf', status: 'Draft' };
        let fail = false;
        form.fields = [{ id: 'name', label: 'Name', type: 'text' }, { id: 'status', label: 'Status', type: 'select', options: [{ label: 'Draft', value: 'Draft' }, { label: 'Final', value: 'Final' }] }];
        form.value = { ...saved };
        h.status('All changes saved locally.');
        h.on('box-item-form', 'value-changed', () => {
            h.error('');
            h.status(JSON.stringify(form.value) === JSON.stringify(saved) ? 'All changes saved locally.' : 'Unsaved changes.');
        });
        h.on('[data-demo="fail"]', 'click', () => {
            fail = true;
            h.status('The next local save will fail.');
        });
        h.on('box-item-form', 'cancel', () => {
            form.value = { ...saved };
            h.error('');
            h.status('Changes discarded.');
        });
        h.on('box-item-form', 'submit', () => {
            if (form.disabled)
                return;
            if (!String(form.value.name ?? '').trim()) {
                h.error('Name is required. Enter a file name before saving.');
                h.status('Unsaved changes.');
                return;
            }
            const value = { name: String(form.value.name), status: String(form.value.status) };
            form.disabled = true;
            h.error('');
            h.status('Saving changes locally…');
            h.later(() => {
                form.disabled = false;
                if (fail) {
                    fail = false;
                    h.error('Could not save these changes. Your edits are preserved; try Save changes again.');
                    h.status('Unsaved changes.');
                }
                else {
                    saved = value;
                    h.status('Changes saved locally.');
                }
            });
        });
        return h.cleanup;
    }, 'Edit populated fields, submit an empty Name, cancel, or simulate a failed save and retry. Dirty, saving, error and successful outcomes are host-owned.'),
    "preview-element": example(`<div data-controls>${button('ready', 'Show document')}${button('loading', 'Loading')}${button('error', 'Load error')}${button('unsupported', 'Unsupported file')}</div><box-preview-element heading="Quarterly plan" item-label="Local document"></box-preview-element>`, root => {
        const h = harness(root);
        const preview = root.querySelector<Preview>('box-preview-element')!;
        let state: PreviewAdapterState = { status: 'ready' };
        let container: HTMLElement | undefined;
        const listeners = new Set<() => void>();
        const render = () => {
            if (!container)
                return;
            container.replaceChildren();
            if (state.status === 'ready') {
                const article = document.createElement('article');
                article.style.cssText = 'padding:24px;background:var(--boe-token-surface-surface,#fff);color:var(--boe-token-text-text,#222);max-width:65ch;overflow-wrap:anywhere';
                article.innerHTML = '<h2>Quarterly plan</h2><p>Launch review · September 2026</p><h3>Milestones</h3><ul><li>Design review: complete</li><li>Accessibility testing: in progress</li><li>Release approval: pending</li></ul>';
                container.append(article);
            }
            else if (state.status === 'loading') {
                const skeleton = document.createElement('box-skeleton');
                skeleton.setAttribute('variant', 'line');
                skeleton.setAttribute('lines', '5');
                container.append(skeleton);
            }
        };
        const adapter: PreviewProviderAdapter = { getProvider: () => ({ id: 'local-document', label: 'Local document renderer' }), getState: () => state, mount: node => {
                container = node;
                render();
            }, unmount: () => {
                container?.replaceChildren();
                container = undefined;
            }, subscribe: fn => {
                listeners.add(fn);
                return () => listeners.delete(fn);
            } };
        preview.providerAdapter = adapter;
        for (const mode of ['ready', 'loading', 'error', 'unsupported'])
            h.on(`[data-demo="${mode}"]`, 'click', () => {
                state = { status: mode === 'unsupported' ? 'error' : mode as 'ready' | 'loading' | 'error', ...(mode === 'error' ? { errorMessage: 'The local preview failed. Select Show document to retry.' } : mode === 'unsupported' ? { errorMessage: 'This file type cannot be previewed. Choose a supported document.' } : {}) };
                render();
                listeners.forEach(fn => fn());
                h.status(mode === 'ready' ? 'Document rendered locally.' : mode === 'loading' ? 'Loading preview…' : mode === 'unsupported' ? 'Unsupported file selected.' : 'Preview failed.');
            });
        return () => {
            preview.providerAdapter = null;
            listeners.clear();
            h.cleanup();
        };
    }, 'A deterministic provider mounts actual document content into the supported adapter container. No PDF engine or live Box provider is implied. Switch lifecycle states, then retry.'),
    "file-request-builder": example(`<p>Local draft only; no public upload link is created.</p><box-text-field data-title label="Request title" value="Collect vendor documents"></box-text-field><box-file-request-builder></box-file-request-builder><section data-request-preview hidden><h3 data-preview-title></h3><p>Company name and signed document are required.</p><p data-preview-settings></p></section>`, root => {
        const h = harness(root);
        const builder = root.querySelector<FileRequestBuilder>('box-file-request-builder')!;
        const title = root.querySelector('[data-title]') as HTMLElement & {
            value: string;
        };
        builder.heading = title.value;
        builder.fields = [{ id: 'company', label: 'Company name', required: true }, { id: 'document', label: 'Signed document', required: true }];
        builder.settings = [{ id: 'notify', label: 'Email me when files arrive' }];
        builder.value = { notify: true };
        let saved = JSON.stringify({ title: title.value, value: builder.value });
        const snapshot = () => JSON.stringify({ title: title.value, value: builder.value });
        const dirty = () => {
            builder.heading = title.value;
            h.error('');
            h.status(snapshot() === saved ? 'Draft saved locally.' : 'Unsaved draft changes.');
        };
        h.on('[data-title]', 'value-changed', dirty);
        h.on('box-file-request-builder', 'value-changed', dirty);
        h.status('Draft saved locally.');
        h.on('box-file-request-builder', 'action', event => {
            const { action } = (event as CustomEvent<{
                action: string;
            }>).detail;
            if (action === 'copy-link') {
                h.error('This local draft has no public upload link. Connect a provider to publish it.');
                return;
            }
            if (!title.value.trim()) {
                h.error('Request title is required.');
                return;
            }
            h.error('');
            if (action === 'preview') {
                root.querySelector<HTMLElement>('[data-request-preview]')!.hidden = false;
                root.querySelector('[data-preview-title]')!.textContent = title.value;
                root.querySelector('[data-preview-settings]')!.textContent = builder.value.notify ? 'Email notification is on.' : 'Email notification is off.';
                h.status('Draft preview updated.');
            }
            else if (action === 'save') {
                saved = snapshot();
                h.status('Draft saved locally. Not published.');
            }
        });
        return h.cleanup;
    }, 'Edit the title and notification setting, preview the current draft, and save locally. Empty titles are rejected. Copy link explains the unpublished boundary instead of pretending publication succeeded.'),
};
