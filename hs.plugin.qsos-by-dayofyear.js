'use strict';

class QsoByDayOfYearHsPlugin extends HsPlugin {
    constructor() {
        super('QSOs by Day of Year');
    }

    init(adif_file) {
        this.days = new Map();
    }

    processQso(qso) {
        const timestamp = moment(this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)).utc();
        this.tally(this.days, timestamp.format('MM-DD'));
    }

    render() {

        const thead = document.createElement('thead');
        thead.appendChild(this.createTaggedText('th', 'Month'));
        for (let i = 1; i <= 31; i++) {
            thead.appendChild(this.createTaggedText('th', `${i}`));
        }

        const tbody = document.createElement('tbody');

        const days_in_month = [
            31, 29, 31, 30, 31, 30,
            31, 31, 30, 31, 30, 31,
        ];

        [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].forEach((month, index) => {

            const MM = `${(index + 1)}`.padStart(2, '0');

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', month));
            for (let i = 1; i <= 31; i++) {
                if (i > days_in_month[index]) {
                    tr.appendChild(this.createTaggedText('td', ` `));
                    continue;
                }

                const DD = `${i}`.padStart(2, '0');
                const MM_DD = `${MM}-${DD}`;
                const count = this.days.get(MM_DD) ?? 0;
                tr.appendChild(this.createTaggedText('td', `${count}`));
            }
            tbody.appendChild(tr);
        });

        const table = document.createElement('table');
        table.appendChild(thead);
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(table);

        const section = this.createSection('QSOs by Day of Year', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
        this.days = new Map();
    }
}

hs_plugin_register(QsoByDayOfYearHsPlugin);
