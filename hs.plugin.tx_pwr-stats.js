'use strict';

class TxPwrStatsHsPlugin extends HsPlugin {
    constructor() {
        super('Transmit Power Statistics');
    }

    init(adif_file) {
        this.tx_pwr = [];
        this.pwr_level = new Map();
    }

    processQso(qso) {
        if (typeof qso.TX_PWR === 'string' && qso.TX_PWR.length > 0) {
            const tx_pwr = parseFloat(qso.TX_PWR);
            this.tx_pwr.push(tx_pwr);

            let pwr_level;
            if (tx_pwr <= 1.0) {
                pwr_level = 'QRPp';
            } else if (tx_pwr <= 5.0) {
                pwr_level = 'QRP';
            } else if (tx_pwr <= 100.0) {
                pwr_level = 'LP';
            } else {
                pwr_level = 'QRO';
            }

            this.tally(this.pwr_level, pwr_level);
        }
    }

    render() {

        const stats_table = this.createStatsTable(this.tx_pwr);

        const tally_thead = document.createElement('thead');
        tally_thead.appendChild(this.createTaggedText('th', 'Power Level'));
        tally_thead.appendChild(this.createTaggedText('th', 'Count'));
        tally_thead.appendChild(this.createTaggedText('th', 'Percent'));

        const tally_tbody = document.createElement('tbody');

        ['QRPp','QRP','LP','QRO'].forEach(pwr_level => {

            const count = this.pwr_level.get(pwr_level) ?? 0;
            const percent = this.getPercent(this.pwr_level, count);

            const tally_tr = document.createElement('tr');
            tally_tr.appendChild(this.createTaggedText('td', pwr_level));
            tally_tr.appendChild(this.createTaggedText('td', count));
            tally_tr.appendChild(this.createTaggedText('td', percent));

            tally_tbody.appendChild(tally_tr);
        });

        const tally_table = document.createElement('table');
        tally_table.appendChild(tally_thead);
        tally_table.appendChild(tally_tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(stats_table);
        card.appendChild(tally_table);

        const section = this.createSection('Transmit Power Statistics', card);

        const results = document.getElementById('results');
        results.appendChild(section);

    }

    exit() {
        this.tx_pwr = [];
        this.pwr_level = new Map();
    }
}

hs_plugin_register(TxPwrStatsHsPlugin);
