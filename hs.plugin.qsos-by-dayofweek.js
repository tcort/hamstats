'use strict';

class QsoByDayOfWeekHsPlugin extends HsPlugin {
    constructor() {
        super('QSOs by Day of Week');
    }

    init(adif_file) {
        this.daysOfWeek = new Map();
    }

    processQso(qso) {
        const timestamp = moment(this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)).utc();
        this.tally(this.daysOfWeek, timestamp.format('E'));
    }

    render() {

        const weekdays = [...this.daysOfWeek.entries()].sort((a, b) => {
            const [ a_day, a_count ] = a;
            const [ b_day, b_count ] = b;
            return parseInt(a_day) - parseInt(b_day);
        });

        const dayThead = document.createElement('thead');
        dayThead.appendChild(this.createTaggedText('th', 'Day of Week'));
        dayThead.appendChild(this.createTaggedText('th', 'Count'));
        dayThead.appendChild(this.createTaggedText('th', 'Percent'));

        const dayTbody = document.createElement('tbody');

        [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((day, index) => {

            const result = weekdays.find(entry => entry[0] === `${index + 1}`);

            const count = result ? result[1] : 0;
            const percent = this.getPercent(this.daysOfWeek, count);

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', day));
            tr.appendChild(this.createTaggedText('td', count));
            tr.appendChild(this.createTaggedText('td', percent));
            dayTbody.appendChild(tr);
        });

        const dayTable = document.createElement('table');
        dayTable.appendChild(dayThead);
        dayTable.appendChild(dayTbody);

        const dayCard = document.createElement('div');
        dayCard.classList.add('card');
        dayCard.appendChild(dayTable);

        const daySection = this.createSection('QSOs by Day of Week', dayCard);

        const results = document.getElementById('results');
        results.appendChild(daySection);

    }

    exit() {
        this.daysOfWeek = new Map();;
    }
}

hs_plugin_register(QsoByDayOfWeekHsPlugin);
