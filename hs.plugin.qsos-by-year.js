'use strict';

class QsoByYearHsPlugin extends HsPlugin {
    constructor() {
        super('QSOs by Year');
    }

    init(adif_file) {
        this.years = new Map();
    }

    processQso(qso) {
        const timestamp = moment(this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)).utc();
        this.tally(this.years, timestamp.format('YYYY'));
    }

    render() {

        const years = [...this.years.entries()].sort((a, b) => {
            const [ a_year, a_count ] = a;
            const [ b_year, b_count ] = b;
            return parseInt(a_year) - parseInt(b_year);
        });

        const yearThead = document.createElement('thead');
        yearThead.appendChild(this.createTaggedText('th', 'Year'));
        yearThead.appendChild(this.createTaggedText('th', 'Count'));

        const yearTbody = document.createElement('tbody');

        for (let year = parseInt(years[0][0]); years.length > 0 && year <= parseInt(years[years.length - 1][0]); year += 1) {
            const result = years.find(entry => entry[0] === `${year}`);

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', `${year}`));
            tr.appendChild(this.createTaggedText('td', result ? result[1] : '0'));
            yearTbody.appendChild(tr);
        }

        const yearTable = document.createElement('table');
        yearTable.appendChild(yearThead);
        yearTable.appendChild(yearTbody);

        const yearCard = document.createElement('div');
        yearCard.classList.add('card');
        yearCard.appendChild(yearTable);

        const yearSection = this.createSection('QSOs by Year', yearCard);

        const results = document.getElementById('results');
        results.appendChild(yearSection);

    }

    exit() {
        this.years = new Map();
    }
}

hs_plugin_register(QsoByYearHsPlugin);
