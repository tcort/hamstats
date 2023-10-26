'use strict';

class QsoByHourHsPlugin extends HsPlugin {
    constructor() {
        super('QSOs by Hour');
    }

    init(adif_file) {
        this.hours = new Map();
    }

    processQso(qso) {
        const timestamp = moment(this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)).utc();
        this.tally(this.hours, timestamp.format('HH'));
    }

    render() {

        const stats_table = this.createStatsTable([...this.hours.values()]);

        const hours = [...this.hours.entries()].sort((a, b) => {
            const [ a_hour, a_count ] = a;
            const [ b_hour, b_count ] = b;
            return parseInt(a_hour) - parseInt(b_hour);
        });

        const hourThead = document.createElement('thead');
        hourThead.appendChild(this.createTaggedText('th', 'Hour of Day'));
        hourThead.appendChild(this.createTaggedText('th', 'Count'));
        hourThead.appendChild(this.createTaggedText('th', 'Percent'));

        const hourTbody = document.createElement('tbody');

        for (let hour = 0; hour < 24; hour++) {

            const result = hours.find(entry => entry[0] === `${hour}`.padStart(2, '0'));

            const count = result ? result[1] : 0;
            const percent = this.getPercent(this.hours, count);

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', `${hour}`.padStart(2, '0')));
            tr.appendChild(this.createTaggedText('td', count));
            tr.appendChild(this.createTaggedText('td', percent));
            hourTbody.appendChild(tr);
        }

        const hourTable = document.createElement('table');
        hourTable.appendChild(hourThead);
        hourTable.appendChild(hourTbody);

        const hourCard = document.createElement('div');
        hourCard.classList.add('card');
        hourCard.appendChild(stats_table);
        hourCard.appendChild(hourTable);

        const hourSection = this.createSection('QSOs by Hour of Day', hourCard);

        const results = document.getElementById('results');
        results.appendChild(hourSection);

    }

    exit() {
        this.hours = new Map();
    }
}

hs_plugin_register(QsoByHourHsPlugin);
