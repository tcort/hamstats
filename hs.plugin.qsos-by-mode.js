'use strict';

class QsoByModeHsPlugin extends HsPlugin {
    constructor() {
        super('QSOs by Mode');
    }

    init(adif_file) {
        this.modes = new Map();
    }

    processQso(qso) {
        this.tally(this.modes, qso.MODE);
    }

    render() {
        const tcadif = require('tcadif');

        const stats_table = this.createStatsTable([...this.modes.values()]);

        const modeThead = document.createElement('thead');
        modeThead.appendChild(this.createTaggedText('th', 'Mode'));
        modeThead.appendChild(this.createTaggedText('th', 'Count'));
        modeThead.appendChild(this.createTaggedText('th', 'Percent'));

        const modeTbody = document.createElement('tbody');
        Object.entries(tcadif.enums.Mode).forEach(([ mode, info ]) => {
            const count = this.modes.get(mode);
            if (!count) {
                return;
            }

            const percent = this.getPercent(this.modes, count);

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', mode));
            tr.appendChild(this.createTaggedText('td', count));
            tr.appendChild(this.createTaggedText('td', percent));
            modeTbody.appendChild(tr);
        });

        const modeTable = document.createElement('table');
        modeTable.appendChild(modeThead);
        modeTable.appendChild(modeTbody);

        const modeCard = document.createElement('div');
        modeCard.classList.add('card');
        modeCard.appendChild(stats_table);
        modeCard.appendChild(modeTable);

        const modeSection = this.createSection('QSOs by Mode', modeCard);

        const results = document.getElementById('results');
        results.appendChild(modeSection);
    }

    exit() {
        this.modes = new Map();
    }
}

hs_plugin_register(QsoByModeHsPlugin);
