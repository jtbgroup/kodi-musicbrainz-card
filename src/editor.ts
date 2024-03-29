/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

import { PRIMARYY_TYPES, SECONDARY_TYPES } from "./const";

import { KodiMusicBrainzCardConfig } from "./types";

@customElement("kodi-musicbrainz-card-editor")
export class KodiMusicBrainzCardEditor extends LitElement implements LovelaceCardEditor {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private _config?: KodiMusicBrainzCardConfig;
    @state() private _helpers?: any;
    private _initialized = false;

    public setConfig(config: KodiMusicBrainzCardConfig): void {
        this._config = config;

        this.loadCardHelpers();
    }

    protected shouldUpdate(): boolean {
        if (!this._initialized) {
            this._initialize();
        }
        return true;
    }

    get _title(): string {
        return this._config?.title || "";
    }

    get _entity(): string {
        return this._config?.entity || "";
    }

    get _show_version(): boolean {
        return this._config?.show_version || false;
    }
    get _show_filter_primaryType(): boolean {
        return this._config?.show_filter_primaryType || false;
    }
    get _show_filter_secondaryType(): boolean {
        return this._config?.show_filter_secondaryType || false;
    }

    get _filter_primaryType_album(): boolean {
        return this._config?.filter_primaryType_album || false;
    }
    get _filter_primaryType_single(): boolean {
        return this._config?.filter_primaryType_single || false;
    }

    get _filter_primaryType_broadcast(): boolean {
        return this._config?.filter_primaryType_broadcast || false;
    }
    get _filter_primaryType_ep(): boolean {
        return this._config?.filter_primaryType_ep || false;
    }
    get _filter_primaryType_other(): boolean {
        return this._config?.filter_primaryType_other || false;
    }

    get _filter_secondaryType_compilation(): boolean {
        return this._config?.filter_secondaryType_compilation || false;
    }
    get _filter_secondaryType_demo(): boolean {
        return this._config?.filter_secondaryType_demo || false;
    }
    get _filter_secondaryType_djmix(): boolean {
        return this._config?.filter_secondaryType_djmix || false;
    }
    get _filter_secondaryType_live(): boolean {
        return this._config?.filter_secondaryType_live || false;
    }
    get _filter_secondaryType_remix(): boolean {
        return this._config?.filter_secondaryType_remix || false;
    }
    get _filter_secondaryType_soundtrack(): boolean {
        return this._config?.filter_secondaryType_soundtrack || false;
    }




    protected render(): TemplateResult | void {
        if (!this.hass || !this._helpers) {
            return html``;
        }

        this._helpers.importMoreInfoControl("climate");

        const entities = Object.keys(this.hass.states);

        return html`
            <div class="card-config">
                <div class="config">
                    <ha-textfield
                        label="title"
                        .value=${this._title}
                        .configValue=${"title"}
                        @input=${this._valueChanged}></ha-textfield>
                </div>
                <div class="config">
                    <ha-select
                        naturalMenuWidth
                        fixedMenuPosition
                        label="Entity"
                        }
                        @selected=${this._valueChanged}
                        @closed=${ev => ev.stopPropagation()}
                        .configValue=${"entity"}
                        .value=${this._entity}>
                        ${entities.map(entity => {
                            return html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`;
                        })}
                    </ha-select>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show version on the card">
                        <ha-switch
                            .checked=${this._show_version !== false}
                            .configValue=${"show_version"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Primary type filter">
                        <ha-switch
                            .checked=${this._show_filter_primaryType !== false}
                            .configValue=${"show_filter_primaryType"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>
                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Secondary type filter">
                        <ha-switch
                            .checked=${this._show_filter_secondaryType !== false}
                            .configValue=${"show_filter_secondaryType"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                ${this.createPrimaryTypesEl()}
                ${this.createSecondaryTypesEl()}
            </div>
        `;
    }

    private createTypeEl(typeValue){
        const selected = this._config?.[typeValue.id];
            selected == undefined ? false : selected;

        return html`<div class="config">
                <ha-formfield class="switch-wrapper" label="${typeValue.editor_label}"
                    ><ha-switch
                        .checked="${selected}"
                        @change=${this._valueChanged}
                        .configValue="${typeValue.id}"></ha-switch
                ></ha-formfield>
            </div>`
    }

    private createSecondaryTypesEl() {
        const itemTemplates: TemplateResult[] = [];
        for (const key of Object.keys(SECONDARY_TYPES)) {
            itemTemplates.push(this.createTypeEl(SECONDARY_TYPES[key]));
        }
        return itemTemplates;
    }


    private createPrimaryTypesEl() {
        const itemTemplates: TemplateResult[] = [];
        for (const key of Object.keys(PRIMARYY_TYPES)) {
            itemTemplates.push(this.createTypeEl(PRIMARYY_TYPES[key]));
        }
        return itemTemplates;
    }

    private _initialize(): void {
        if (this.hass === undefined) return;
        if (this._config === undefined) return;
        if (this._helpers === undefined) return;
        this._initialized = true;
    }

    private async loadCardHelpers(): Promise<void> {
        this._helpers = await (window as any).loadCardHelpers();
    }

    private _valueChanged(ev): void {
        if (!this._config || !this.hass) {
            return;
        }
        const target = ev.target;
        if (this[`_${target.configValue}`] === target.value) {
            return;
        }
        if (target.configValue) {
            if (target.value === "") {
                const tmpConfig = { ...this._config };
                delete tmpConfig[target.configValue];
                this._config = tmpConfig;
            } else {
                let endvalue = target.value;
                if (target.checked !== undefined) {
                    endvalue = target.checked;
                }
                if (target.type == "number") {
                    endvalue = Number(endvalue);
                }

                this._config = {
                    ...this._config,
                    [target.configValue]: endvalue,
                };
            }
        }
        fireEvent(this, "config-changed", { config: this._config });
    }

    static get styles(): CSSResultGroup {
        return css`
            ha-textfield,
            ha-formfield,
            ha-select {
                display: block;
            }
            .card-config {
                display: grid;
                grid-row: auto;
                grid-column: 1fr;
                grid-gap: 5px;
            }
            .config {
                width: 100%;
            }
        `;
    }
}

