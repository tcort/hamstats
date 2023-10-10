'use strict';

class FileInfoHsPlugin extends HsPlugin {
    constructor() {
        super('File Information');

        this.fileSize = 0;
        this.appName = 'unknown application';
        this.appVersion = 'unknown version';
        this.startTime = 0;
        this.endTime = 0;
        this.runtime_ms=0;
        this.nqso = 0;
        this.firstQso = undefined;
        this.lastQso = undefined;
    }

    init(adif_file) {
        this.startTime = Date.now();
        this.fileSize = adif_file.size;
        this.fileName = adif_file.name;
    }

    processHeader(header) {
        this.appName = header.PROGRAMID;
        this.appVersion = header.PROGRAMVERSION;
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
        this.endTime = Date.now();
        this.runtime_ms = this.endTime - this.startTime;

        const runtime = moment.duration(this.runtime_ms).asSeconds()

        const tbody = document.createElement('tbody');

        [
            ['Name', `${this.fileName}`],
            ['Size', `${this.fileSize} bytes`],
            ['QSOs', `${this.nqso}`],
            ['First QSO', `${moment(this.firstQso).utc().format('YYYY-MM-DD HH:mm:ss')}`],
            ['Last QSO', `${moment(this.lastQso).utc().format('YYYY-MM-DD HH:mm:ss')}`],
            ['Created by', `${this.appName} v${this.appVersion}`],
            ['Processing time', `${((this.runtime_ms)/1000).toFixed(2)} seconds`],
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

        const section = this.createSection('File Information', card);

        const results = document.getElementById('results');
        results.appendChild(section);
    }

    exit() {
    }
}

hs_plugin_register(FileInfoHsPlugin);
