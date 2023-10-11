'use strict';

class QsoByBandHsPlugin extends HsPlugin {
    constructor() {
        super('QSOs by Band');
    }

    init(adif_file) {
        this.bands = new Map();
    }

    processQso(qso) {
        this.tally(this.bands, qso.BAND);
    }

    render() {
        const tcadif = require('tcadif');

        const bandThead = document.createElement('thead');
        bandThead.appendChild(this.createTaggedText('th', 'Band'));
        bandThead.appendChild(this.createTaggedText('th', 'Count'));

        const bandTbody = document.createElement('tbody');
        Object.entries(tcadif.enums.Band).forEach(([ band, info ]) => {
            const count = this.bands.get(band);
            if (!count) {
                return;
            }

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', band));
            tr.appendChild(this.createTaggedText('td', count));
            bandTbody.appendChild(tr);
        });

        const bandTable = document.createElement('table');
        bandTable.appendChild(bandThead);
        bandTable.appendChild(bandTbody);

        const bandCard = document.createElement('div');
        bandCard.classList.add('card');
        bandCard.appendChild(bandTable);

        const bandSection = this.createSection('QSOs by Band', bandCard);

        const results = document.getElementById('results');
        results.appendChild(bandSection);
    }

    exit() {
        this.bands = new Map();
    }
}

hs_plugin_register(QsoByBandHsPlugin);
