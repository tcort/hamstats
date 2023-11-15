'use strict';

class FrequentGridsHsPlugin extends HsPlugin {
    constructor() {
        super('Frequent Grid Squares');
    }

    init(adif_file) {
        this.grids = new Map();
    }

    processQso(qso) {
        const grid = `${qso.GRIDSQUARE ?? ''}`.slice(0,4);
        if (grid.length === 4) {
            this.tally(this.grids, grid);
        }
    }

    render() {
        const tcadif = require('tcadif');

        const stats_table = this.createStatsTable([...this.grids.values()]);

        const gridThead = document.createElement('thead');
        gridThead.appendChild(this.createTaggedText('th', 'Grid'));
        gridThead.appendChild(this.createTaggedText('th', 'Count'));
        gridThead.appendChild(this.createTaggedText('th', 'Percent'));

        const gridTbody = document.createElement('tbody');

        [...this.grids].sort((a, b) => {
            const [ a_grid, a_count ] = a;
            const [ b_grid, b_count ] = b;
            return b_count - a_count;
        }).slice(0, 25).forEach(([ grid, count ]) => {

            const percent = this.getPercent(this.grids, count);

            const tr = document.createElement('tr');
            tr.appendChild(this.createTaggedText('td', grid));
            tr.appendChild(this.createTaggedText('td', count));
            tr.appendChild(this.createTaggedText('td', percent));
            gridTbody.appendChild(tr);
        });

        const gridTable = document.createElement('table');
        gridTable.appendChild(gridThead);
        gridTable.appendChild(gridTbody);

        const gridCard = document.createElement('div');
        gridCard.classList.add('card');
        gridCard.appendChild(stats_table);
        gridCard.appendChild(gridTable);

        const gridSection = this.createSection('Frequent Grid Square', gridCard);

        const results = document.getElementById('results');
        results.appendChild(gridSection);
    }

    exit() {
        this.grids = new Map();
    }
}

hs_plugin_register(FrequentGridsHsPlugin);
