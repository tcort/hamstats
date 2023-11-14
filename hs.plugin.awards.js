'use strict';

class AwardsHsPlugin extends HsPlugin {
    constructor() {
        super('Awards Tracking');
    }

    init(adif_file) {
        this.labels = ['DXCC Entities', 'Gridsquares',  'ITU Zones',    'CQ Zones', 'Prefixes', 'Callsigns'];
        this.fields = ['DXCC',          'GRIDSQUARE',   'ITUZ',         'CQZ',      'PFX',      'CALL'];
        this.values = new Array(this.fields.length).fill(0).map(value => new Set());
    }

    processQso(qso) {
        this.fields.forEach((field, i) => {
            if (typeof qso[field] === 'string' && qso[field].length > 0) {
                const value = field === 'GRIDSQUARE' ? qso[field].slice(0,4) : qso[field];
                this.values[i].add(value);
            }
        });
    }

    render() {

        const tally_thead = document.createElement('thead');
        tally_thead.appendChild(this.createTaggedText('th', 'Category'));
        tally_thead.appendChild(this.createTaggedText('th', 'Count'));

        const tally_tbody = document.createElement('tbody');

        this.fields.forEach((field, i, fields) => {

            const count = [...this.values[i].keys()].length;

            const tally_tr = document.createElement('tr');
            tally_tr.appendChild(this.createTaggedText('td', this.labels[i]));
            tally_tr.appendChild(this.createTaggedText('td', count));

            tally_tbody.appendChild(tally_tr);
        });

        const tally_table = document.createElement('table');
        tally_table.appendChild(tally_thead);
        tally_table.appendChild(tally_tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(tally_table);

        const section = this.createSection('Awards Tracking', card);

        const results = document.getElementById('results');
        results.appendChild(section);

    }

    exit() {
        this.categories = new Map();
    }
}

hs_plugin_register(AwardsHsPlugin);
