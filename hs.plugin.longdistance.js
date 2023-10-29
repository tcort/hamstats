'use strict';

class LongDistanceHsPlugin extends HsPlugin {
    constructor() {
        super('Longest Distance Contacts');
    }

    init(adif_file) {
        this.dist = [];
    }

    processQso(qso) {

        // distance already calculated?
        if (typeof qso.DISTANCE === 'string' && qso.DISTANCE.length > 0) {
            this.dist.push([ parseFloat(qso.DISTANCE), qso ]);

        // calculate it ourselves
        } else if (typeof qso.GRIDSQUARE === 'string' && qso.GRIDSQUARE.length > 0 && typeof qso.MY_GRIDSQUARE === 'string' && qso.MY_GRIDSQUARE.length > 0) {
            this.dist.push([ GridSquare.distance(qso.MY_GRIDSQUARE, qso.GRIDSQUARE), qso ]);
        }

    }

    render() {

        const stats_table = this.createStatsTable(this.dist.map(entry => entry[0]));

        const thead = document.createElement('thead');
        thead.appendChild(this.createTaggedText('th', 'Date'));
        thead.appendChild(this.createTaggedText('th', 'Callsign'));
        thead.appendChild(this.createTaggedText('th', 'Band'));
        thead.appendChild(this.createTaggedText('th', 'Distance'));

        const tbody = document.createElement('tbody');

        this.dist.sort((a, b) => b[0] - a[0]).slice(0, 25).forEach(([ distance, qso ]) => {;

            const tr = document.createElement('tr');

            tr.appendChild(this.createTaggedText('td', `${this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)}`));
            tr.appendChild(this.createTaggedText('td', `${qso.CALL}`));
            tr.appendChild(this.createTaggedText('td', `${qso.BAND}`));
            tr.appendChild(this.createTaggedText('td', `${distance.toFixed(2)}`));

            tbody.appendChild(tr);
        });

        const table = document.createElement('table');
        table.appendChild(thead);
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(stats_table);
        card.appendChild(table);

        const section = this.createSection('Long Distance Contacts', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
        this.dist = [];
    }
}

hs_plugin_register(LongDistanceHsPlugin);
