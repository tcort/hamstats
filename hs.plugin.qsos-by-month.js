'use strict';

class QsoByMonthHsPlugin extends HsPlugin {
    constructor() {
        super('QSOs by Month');
    }

    init(adif_file) {
        this.months = new Map();
    }

    processQso(qso) {
        const timestamp = moment(this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)).utc();
        this.tally(this.months, timestamp.format('MM'));
    }

    render() {

        const stats_table = this.createStatsTable([...this.months.values()]);

        const months = [...this.months.entries()].sort((a, b) => {
            const [ a_month, a_count ] = a;
            const [ b_month, b_count ] = b;
            return parseInt(a_month) - parseInt(b_month);
        });

        const monthThead = document.createElement('thead');
        monthThead.appendChild(this.createTaggedText('th', 'Month of Year'));
        monthThead.appendChild(this.createTaggedText('th', 'Count'));
        monthThead.appendChild(this.createTaggedText('th', 'Percent'));

        const monthTbody = document.createElement('tbody');

        [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].forEach((month, index) => {

            const result = months.find(entry => entry[0] === `${index + 1}`.padStart(2, '0'));

            const count = result ? result[1] : 0;
            const percent = this.getPercent(this.months, count);

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', month));
            tr.appendChild(this.createTaggedText('td', count));
            tr.appendChild(this.createTaggedText('td', percent));
            monthTbody.appendChild(tr);
        });

        const monthTable = document.createElement('table');
        monthTable.appendChild(monthThead);
        monthTable.appendChild(monthTbody);

        const monthCard = document.createElement('div');
        monthCard.classList.add('card');
        monthCard.appendChild(stats_table);
        monthCard.appendChild(monthTable);

        const monthSection = this.createSection('QSOs by Month of Year', monthCard);

        const results = document.getElementById('results');
        results.appendChild(monthSection);
    }

    exit() {
        this.months = new Map();
    }
}

hs_plugin_register(QsoByMonthHsPlugin);
