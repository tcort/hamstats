'use strict';

class MilestonesHsPlugin extends HsPlugin {
    constructor() {
        super('Milestones');
    }

    init(adif_file) {
        this.qsos = [];
    }

    processQso(qso) {
        this.qsos.push(qso);
    }

    render() {
        this.qsos.sort((a, b) => {
            const a_time = new Date(this.createTimestamp(a.QSO_DATE, a.TIME_ON)).getTime(); 
            const b_time = new Date(this.createTimestamp(a.QSO_DATE, a.TIME_ON)).getTime(); 
            return a_time - b_time;
        });

        const milestones = [
            1,
            100, 200, 300, 400, 500, 600, 700, 800, 900,
            1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000,
            10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000,
            100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000,
            100000
        ];

        const milestoneQsos = milestones
                                .filter(milestone => this.qsos.length >= milestone)
                                .map(milestone => [ milestone, this.qsos[milestone-1] ]);

        const thead = document.createElement('thead');
        thead.appendChild(this.createTaggedText('th', 'Milestone'));
        thead.appendChild(this.createTaggedText('th', 'Date/Time (UTC)'));
        thead.appendChild(this.createTaggedText('th', 'Band'));
        thead.appendChild(this.createTaggedText('th', 'Mode'));
        thead.appendChild(this.createTaggedText('th', 'Callsign'));

        const tbody = document.createElement('tbody');
        milestoneQsos.forEach(([milestone,qso]) => {
            const ts = moment(this.createTimestamp(qso.QSO_DATE, qso.TIME_ON)).utc().format('YYYY-MM-DD HH:mm:ss');

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', `${milestone}`));
            tr.appendChild(this.createTaggedText('td', `${ts}`));
            tr.appendChild(this.createTaggedText('td', `${qso.BAND}`));
            tr.appendChild(this.createTaggedText('td', `${qso.MODE}`));
            tr.appendChild(this.createTaggedText('td', `${qso.CALL}`, ['callsign']));

            tbody.appendChild(tr);
        });

        const table = document.createElement('table');
        table.appendChild(thead);
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList.add('card');
        card.appendChild(table);

        const section = this.createSection('Milestones', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
        this.qsos = [];
    }
}

hs_plugin_register(MilestonesHsPlugin);
