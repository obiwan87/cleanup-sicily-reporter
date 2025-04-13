export class AddressAutocomplete {
    constructor(inputEl, listEl, geoSearch, onSelect) {
        this.inputEl = inputEl;
        this.listEl = listEl;
        this.geoSearch = geoSearch;
        this.onSelect = onSelect;

        this.results = [];
        this.activeIndex = -1;

        this.inputEl.setAttribute('role', 'combobox');
        this.inputEl.setAttribute('aria-autocomplete', 'list');
        this.inputEl.setAttribute('aria-expanded', 'false');
        this.inputEl.setAttribute('aria-controls', listEl.id);

        this.listEl.setAttribute('role', 'listbox');

        this.handleInputDebounced = debounce((e) => this.handleInput(e), 300);
        this.inputEl.addEventListener('input', this.handleInputDebounced);

        this.inputEl.addEventListener('input', this.handleInputDebounced);
        this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    async handleInput(e) {
        const query = e.target.value;

        if (query.length < 3) {
            this.clearResults();
            return;
        }

        this.results = await this.geoSearch.search(query);
        this.activeIndex = -1;
        this.renderResults();
    }

    handleKeyDown(e) {
        if (!this.results.length) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.activeIndex = (this.activeIndex + 1) % this.results.length;
                this.updateActiveDescendant();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.activeIndex = (this.activeIndex - 1 + this.results.length) % this.results.length;
                this.updateActiveDescendant();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.activeIndex >= 0) {
                    this.selectResult(this.results[this.activeIndex]);
                }
                break;
            case 'Escape':
                this.clearResults();
                break;
        }
    }

    /**
     *
     * @param {{properties: {district: string, city: string, postcode: string, name:string, housenumber: string}}} feature
     * @returns {string}
     */
    buildDisplayName(feature) {
        const parts = [];

        if (feature.properties.name) {
            let street = feature.properties.name;
            if (feature.properties.housenumber) {
                street += ' ' + feature.properties.housenumber;
            }
            parts.push(street);
        }

        if (feature.properties.district) {
            parts.push(feature.properties.district);
        }

        if (feature.properties.city) {
            parts.push(feature.properties.city);
        }

        if (feature.properties.postcode) {
            parts.push(feature.properties.postcode);
        }

        return parts.join(', ');
    }

    renderResults() {
        this.listEl.innerHTML = '';

        this.results.forEach((feature, index) => {
            const displayName = this.buildDisplayName(feature)


            const item = document.createElement('div');
            item.id = `autocomplete-item-${index}`;
            item.role = 'option';
            item.className = 'list-group-item list-group-item-action';
            item.textContent = displayName;

            item.addEventListener('click', () => this.selectResult(feature));

            this.listEl.appendChild(item);
        });

        this.inputEl.setAttribute('aria-expanded', 'true');
        this.updateActiveDescendant();
    }

    updateActiveDescendant() {
        this.listEl.querySelectorAll('[role=option]').forEach((el, idx) => {
            el.classList.toggle('active', idx === this.activeIndex);
        });

        if (this.activeIndex >= 0) {
            this.inputEl.setAttribute('aria-activedescendant', `autocomplete-item-${this.activeIndex}`);
        } else {
            this.inputEl.removeAttribute('aria-activedescendant');
        }
    }

    selectResult(feature) {
        const lat = feature.geometry.coordinates[1];
        const lon = feature.geometry.coordinates[0];

        this.onSelect({feature, lat, lon});
        this.clearResults();
    }

    clearResults() {
        this.results = [];
        this.activeIndex = -1;
        this.listEl.innerHTML = '';
        this.inputEl.setAttribute('aria-expanded', 'false');
        this.inputEl.removeAttribute('aria-activedescendant');
    }

}

function debounce(fn, delay) {
    let timerId;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}