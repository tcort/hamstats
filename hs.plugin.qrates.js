'use strict';

class QRatesHsPlugin extends HsPlugin {
    constructor() {
        super('QSO Rates');

        this.nqso = 0;
        this.firstQso = undefined;
        this.lastQso = undefined;
    }

    processQso(qso) {
        this.nqso++;

        const ts = this.createTimestamp(qso.QSO_DATE, qso.TIME_ON);

        if (this.firstQso === undefined) {
            this.firstQso = ts;
        } else if (ts < this.firstQso) {
            this.firstQso = ts;
        }

        if (this.lastQso === undefined) {
            this.lastQso = ts;
        } else if (this.lastQso < ts) {
            this.lastQso = ts;
        }
    }

    render() {

        const first = moment(this.firstQso).utc();
        const last = moment(this.lastQso).utc();

        const diff = moment.duration(last.diff(first));

        const per_hour = ((this.nqso * 1.0) / (diff.asHours() * 1.0));
        const per_day = ((this.nqso * 24.0) / (diff.asHours() * 1.0));                     // 24 hours a day
        const per_month = ((this.nqso * 24.0 * (365.25 / 12.0)) / (diff.asHours() * 1.0)); // 365.25/12 is days per month
        const per_year = ((this.nqso * 24.0 * 365.25) / (diff.asHours() * 1.0));           // 365.25 is days per year (inc leap year every 4 years)

        const tbody = document.createElement('tbody');

        [
            ['Per Hour', per_hour.toFixed(2) ],
            ['Per Day', per_day.toFixed(2) ],
            ['Per Month', per_month.toFixed(2) ],
            ['Per Year', per_year.toFixed(2) ],
        ].forEach(([key, value]) => {
            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', key));
            tr.appendChild(this.createTaggedText('td', value));
            tbody.appendChild(tr);
        });

        const table = document.createElement('table');
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(table);

        const section = this.createSection('QSO Rates', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
        this.nqso = 0;
    }
}

hs_plugin_register(QRatesHsPlugin);
