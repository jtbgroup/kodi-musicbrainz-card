/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

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
    
    get _filter_primaryType_album(): boolean {
        return this._config?.filter_primaryType_album || false;
    }
    get _filter_primaryType_single(): boolean {
        return this._config?.filter_primaryType_single || false;
    }

    get _filter_secondaryType_live(): boolean {
        return this._config?.filter_secondType_live || false;
    }
    get _filter_secondaryType_compilation(): boolean {
        return this._config?.filter_secondaryType_compilation || false;
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
                    <ha-formfield class="switch-wrapper" label="Include Albums">
                        <ha-switch
                            .checked=${this._filter_primaryType_album!== false}
                            .configValue=${"filter_primaryType_album"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>
                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Include Single">
                        <ha-switch
                            .checked=${this._filter_primaryType_single !== false}
                            .configValue=${"filter_primaryType_single"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Include Live releases">
                        <ha-switch
                            .checked=${this._filter_secondaryType_live !== false}
                            .configValue=${"filter_secondaryType_live"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>
                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Include Compilation releases">
                        <ha-switch
                            .checked=${this._filter_secondaryType_compilation !== false}
                            .configValue=${"filter_secondaryType_compilation"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>
                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Include Remix releases">
                        <ha-switch
                            .checked=${this._filter_secondaryType_remix !== false}
                            .configValue=${"filter_secondaryType_Remix"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>
                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Include Soundtrack releases">
                        <ha-switch
                            .checked=${this._filter_secondaryType_soundtrack !== false}
                            .configValue=${"filter_secondaryType_soundtrack"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>
            </div>
        `;
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

