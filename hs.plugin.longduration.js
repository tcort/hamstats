'use strict';

class LongDurationHsPlugin extends HsPlugin {
    constructor() {
        super('Longest Duration Contacts');
    }

    init(adif_file) {
        this.dur = [];
    }

    processQso(qso) {

        // do we have enough information to calculate the duration?
        if (typeof qso.QSO_DATE === 'string' && typeof qso.TIME_ON == 'string' && typeof qso.TIME_OFF == 'string') {
            let date_on,  time_on;
            let date_off, time_off;

            date_on = qso.QSO_DATE;
            time_on = qso.TIME_ON.length === 4 ? `${qso.TIME_ON}00` : qso.TIME_ON;
            date_off = (typeof qso.QSO_DATE_OFF === 'string') ? qso.QSO_DATE_OFF : date_on;
            time_off = qso.TIME_OFF.length === 4 ? `${qso.TIME_OFF}00}` : qso.TIME_OFF;

            const ts_on = new Date(`${date_on.slice(0,4)}-${date_on.slice(4,6)}-${date_on.slice(6,8)}T${time_on.slice(0,2)}:${time_on.slice(2,4)}:${time_on.slice(4,6)}.000Z`);
            const ts_off = new Date(`${date_off.slice(0,4)}-${date_off.slice(4,6)}-${date_off.slice(6,8)}T${time_off.slice(0,2)}:${time_off.slice(2,4)}:${time_off.slice(4,6)}.000Z`);

            const duration_ms = ts_off.getTime() - ts_on.getTime();

            this.dur.push([ duration_ms, qso ]);
        }

    }

    render() {

        const stats_table = this.createStatsTable(this.dur.map(entry => (entry[0]/(1000.0 * 60.0))));

        const thead = document.createElement('thead');
        thead.appendChild(this.createTaggedText('th', 'Date'));
        thead.appendChild(this.createTaggedText('th', 'Callsign'));
        thead.appendChild(this.createTaggedText('th', 'Band'));
        thead.appendChild(this.createTaggedText('th', 'Mode'));
        thead.appendChild(this.createTaggedText('th', 'Duration'));

        const tbody = document.createElement('tbody');

        this.dur.sort((a, b) => b[0] - a[0]).slice(0, 25).forEach(([ duration_ms, qso ]) => {;

            const tr = document.createElement('tr');

            tr.appendChild(this.createTaggedText('td', `${this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)}`));
            tr.appendChild(this.createTaggedText('td', `${qso.CALL}`));
            tr.appendChild(this.createTaggedText('td', `${qso.BAND}`));
            tr.appendChild(this.createTaggedText('td', `${qso.MODE}`));
            tr.appendChild(this.createTaggedText('td', `${(duration_ms/(1000.0 * 60.0)).toFixed(2)} min`));

            tbody.appendChild(tr);
        });

        const table = document.createElement('table');
        table.appendChild(thead);
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(stats_table);
        card.appendChild(table);

        const section = this.createSection('Long Duration Contacts', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
        this.dur = [];
    }
}

hs_plugin_register(LongDurationHsPlugin);
