class TabsContainer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `
            <div class="tab-panels" part="tab-panels">
                <slot name="panel"></slot>
            </div>
            <div class="tab-list" part="tab-list">
                <slot name="tab"></slot>
            </div>
            <style scoped>
                .tab-list {
                    display: flex;
                    flex-flow: row nowrap;
                }
                ::slotted(tab-panel) {
                    display: none;
                }
                ::slotted(tab-panel[active]) {
                    display: block;
                    height: 100%;
                }
            </style>
        `;
    }
    connectedCallback() {
        this.addEventListener('click', this._onClick);
        this.shadowRoot.firstElementChild.addEventListener("slotchange", e => {
            let slot = e.target;
            let firstTab = slot.assignedElements()[0];
            this._selectTab(firstTab);
        });
    }
    _onClick(event) {
        if (event.target.getAttribute("slot") == "tab")
            this._selectTab(event.target);
    }
    _selectTab(tab) {
        let tabName = tab.getAttribute("data-tab");
        tab.setAttribute("active", "");
        let panel = this.querySelector(`tab-panel[data-tab=${tabName}]`)
        panel.setAttribute("active", "")
        // Replace with smooth transition
        this.querySelectorAll(`[active]:not([data-tab=${tabName}])`).forEach(e => {
            e.removeAttribute("active");
        });
    }
    _hideAll() {

    }
}
customElements.define("tabs-container", TabsContainer);