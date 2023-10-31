'use strict';

class DxccHsPlugin extends HsPlugin {
    constructor() {
        super('DXCC');
    }

    init(adif_file) {
        this.dxcc = new Map();
    }

    processQso(qso) {
        if (typeof qso.DXCC === 'string' && qso.DXCC.length > 0) {
            this.tally(this.dxcc, qso.DXCC);
        }
    }

    render() {

        const tcadif = require('tcadif');

        const tally_thead = document.createElement('thead');
        tally_thead.appendChild(this.createTaggedText('th', 'Entity'));
        tally_thead.appendChild(this.createTaggedText('th', 'Count'));
        tally_thead.appendChild(this.createTaggedText('th', 'Percent'));

        const tally_tbody = document.createElement('tbody');

        Object.entries(tcadif.enums.Dxcc).sort((a,b) => {
            if (a[1] < b[1]) return -1;
            else if (a[1] > b[1]) return 1;
            else return 0;
        }).forEach(([ dxcc, label ]) => {

            const count = this.dxcc.get(dxcc);
            if (!count) {
                return;
            }

            const percent = this.getPercent(this.dxcc, count);

            const tally_tr = document.createElement('tr');
            tally_tr.appendChild(this.createTaggedText('td', label));
            tally_tr.appendChild(this.createTaggedText('td', count));
            tally_tr.appendChild(this.createTaggedText('td', percent));

            tally_tbody.appendChild(tally_tr);
        });

        const tally_table = document.createElement('table');
        tally_table.appendChild(tally_thead);
        tally_table.appendChild(tally_tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(tally_table);

        const section = this.createSection('DXCC', card);

        const results = document.getElementById('results');
        results.appendChild(section);

    }

    exit() {
        this.dxcc = new Map();
    }
}

hs_plugin_register(DxccHsPlugin);
