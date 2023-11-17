'use strict';

class BandsByCallHsPlugin extends HsPlugin {
    constructor() {
        super('Bands by Call');
    }

    init(adif_file) {
        this.calls = new Map();
    }

    processQso(qso) {
        let band = qso.BAND;

        // no qso.BAND? but we have a valid looking qso.FREQ? Find the band it's in.
        if (typeof qso.FREQ === 'string' && qso.FREQ.length > 0 && band === undefined) {
            band = this.#freq2band(qso.FREQ);
        }

        // invalid band value, nothing we can do
        if (typeof band !== 'string' || band.length === 0) {
            return;
        }

        // else count it
        this.tallyUniqueKeyValues(this.calls, qso.CALL, band);
    }

    render() {
        const tcadif = require('tcadif');

        const thead = document.createElement('thead');
        thead.appendChild(this.createTaggedText('th', 'Call'));
        thead.appendChild(this.createTaggedText('th', 'Bands'));

        const tbody = document.createElement('tbody');
        [...this.calls.entries()].sort((a, b) => {
            const [ a_call, a_bands ] = a;
            const [ b_call, b_bands ] = b;
            return b_bands.size - a_bands.size;
        }).slice(0, 25).forEach(([ call, bands ]) => {
            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', call));
            tr.appendChild(this.createTaggedText('td', [...bands].sort((a, b) => this.#bandLabels.indexOf(b) - this.#bandLabels.indexOf(a)).join(', ')));
            tbody.appendChild(tr);
        });

        const table = document.createElement('table');
        table.appendChild(thead);
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(table);

        const section = this.createSection('Bands by Call', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
        this.bands = new Map();
    }

    get #bandLabels() {
        return this.#bands.map(band => band.band);
    }

    get #bands() {
        return [
            { band: "2190m", min: .1357, max: .1378 },
            { band: "630m", min: .472, max: .479 },
            { band: "560m", min: .501, max: .504 },
            { band: "160m", min: 1.8, max: 2.0 },
            { band: "80m", min: 3.5, max: 4.0 },
            { band: "60m", min: 5.06, max: 5.45 },
            { band: "40m", min: 7.0, max: 7.3 },
            { band: "30m", min: 10.1, max: 10.15 },
            { band: "20m", min: 14.0, max: 14.35 },
            { band: "17m", min: 18.068, max: 18.168 },
            { band: "15m", min: 21.0, max: 21.45 },
            { band: "12m", min: 24.890, max: 24.99 },
            { band: "10m", min: 28.0, max: 29.7 },
            { band: "8m", min: 40, max: 45 },
            { band: "6m", min: 50, max: 54 },
            { band: "5m", min: 54.000001, max: 69.9 },
            { band: "4m", min: 70, max: 71 },
            { band: "2m", min: 144, max: 148 },
            { band: "1.25m", min: 222, max: 225 },
            { band: "70cm", min: 420, max: 450 },
            { band: "33cm", min: 902, max: 928 },
            { band: "23cm", min: 1240, max: 1300 },
            { band: "13cm", min: 2300, max: 2450 },
            { band: "9cm", min: 3300, max: 3500 },
            { band: "6cm", min: 5650, max: 5925 },
            { band: "3cm", min: 10000, max: 10500 },
            { band: "1.25cm", min: 24000, max: 24250 },
            { band: "6mm", min: 47000, max: 47200 },
            { band: "4mm", min: 75500, max: 81000 },
            { band: "2.5mm", min: 119980, max: 123000 },
            { band: "2mm", min: 134000, max: 149000 },
            { band: "1mm", min: 241000, max: 250000 },
            { band: "submm", min: 300000, max: 7500000 },
        ];
    }

    #freq2band(freq) {
        freq = parseFloat(freq);

        const result = this.#bands.find(({ min, max, band }) => (min <= freq && freq <= max));

        return result?.band;
    }
}

hs_plugin_register(BandsByCallHsPlugin);
