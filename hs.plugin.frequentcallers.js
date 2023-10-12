'use strict';

class FrequentCallersHsPlugin extends HsPlugin {
    constructor() {
        super('Frequent Callers');
    }

    init(adif_file) {
        this.counts = new Map();
    }

    processQso(qso) {
        const oldCount = this.counts.get(qso.CALL);
        const newCount = (oldCount ?? 0) + 1;
        this.counts.set(qso.CALL, newCount);
    }

    render() {

        const thead = document.createElement('thead');
        thead.appendChild(this.createTaggedText('th', 'Callsign'));
        thead.appendChild(this.createTaggedText('th', 'Number of QSOs'));

        const tbody = document.createElement('tbody');

        [...this.counts].sort((a, b) => {
            const [ a_call, a_count ] = a;
            const [ b_call, b_count ] = b;
            return b_count - a_count;
        }).slice(0, 10).forEach(([ call, count ]) => {

            const tr = document.createElement('tr');

            tr.appendChild(this.createTaggedText('td', `${call}`));
            tr.appendChild(this.createTaggedText('td', `${count}`));

            tbody.appendChild(tr);
        });

        const table = document.createElement('table');
        table.appendChild(thead);
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(table);

        const section = this.createSection('Frequent Callers', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
        this.qsos = [];
    }
}

hs_plugin_register(FrequentCallersHsPlugin);
