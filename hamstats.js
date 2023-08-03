/*
    Copyright (c) 2023 Thomas Cort <linuxgeek@gmail.com>

    Permission to use, copy, modify, and distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

const { Field, Header, QSO, Version, enums } = require('tcadif');

/*
 * AdifParser
 */

class AdifParser extends EventTarget {

    #fields = [];

    constructor() {
        super();
    }

    #processFields(endTag) {
        const entries = this.#fields;
        this.#fields = [];

        const block = Object.fromEntries(entries);
        if (endTag === 'EOH') { // end-of-header
            this.dispatchEvent(new CustomEvent('Header', { detail: new Header(block).toObject() }));
            return;
        }

        // end-of-record
        this.dispatchEvent(new CustomEvent('QSO', { detail: new QSO(block).toObject() }));
    }

    parse(adif_text) {

        while (true) {
            const field = Field.parse(adif_text);
            if (field === null) {
                break;
            }

            adif_text = adif_text.slice(field.bytesConsumed);
            this.dispatchEvent(new CustomEvent('field', { detail: field.toEntry() }));

            if (field.fieldName === 'EOR' || field.fieldName === 'EOH') {
                this.#processFields(field.fieldName);
            } else {
                this.#fields.push(field.toEntry());
            }
        }

        this.dispatchEvent(new CustomEvent('done'));
    }
}

class GridSquare {

    static decode(grid_sqr) {

        const [
            field_lon, field_lat,
            square_lon, square_lat,
            subsquare_lon, subsquare_lat,
            ...tail
        ] = `${grid_sqr}`.trim().split('');

        const field_values = [
            'A', 'B', 'C', 'D', 'E', 'F',
            'G', 'H', 'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P', 'Q', 'R',
        ];

        const field_lon_index = field_values.indexOf(`${field_lon}`.toUpperCase());
        if (field_lon_index === -1) {
            throw new Error('Bad Grid Square: longitude component of field is invalid');
        }

        const field_lat_index = field_values.indexOf(`${field_lat}`.toUpperCase());
        if (field_lat_index === -1) {
            throw new Error('Bad Grid Square: latitude component of field is invalid');
        }

        if (square_lon === undefined || square_lat === undefined) {
            return {
                lon: (field_lon_index * 20) - 180 + 10,
                lat: (field_lat_index * 10) - 90 + 5,
            };
        }

        const square_values = [
            '0', '1', '2',
            '3', '4', '5',
            '6', '7', '8',
            '9',
        ];

        const square_lon_index = square_values.indexOf(`${square_lon}`);
        if (square_lon_index === -1) {
            throw new Error('Bad Grid Square: longitude component of square is invalid');
        }

        const square_lat_index = square_values.indexOf(`${square_lat}`);
        if (square_lat_index === -1) {
            throw new Error('Bad Grid Square: latitude component of square is invalid');
        }

        if (subsquare_lon === undefined || subsquare_lat === undefined) {
            return {
                lon: (field_lon_index * 20) + (square_lon_index * 2) - 180 + 1.0,
                lat: (field_lat_index * 10) + (square_lat_index * 1) -  90 + 0.5,
            };
        }

        const subsquare_values = [
            'a', 'b', 'c', 'd', 'e', 'f',
            'g', 'h', 'i', 'j', 'k', 'l',
            'm', 'n', 'o', 'p', 'q', 'r',
            's', 't', 'u', 'v', 'w', 'x',
        ];

        const subsquare_lon_index = subsquare_values.indexOf(`${subsquare_lon}`.toLowerCase());
        if (subsquare_lon_index === -1) {
            throw new Error('Bad Grid Square: longitude component of subsquare is invalid');
        }

        const subsquare_lat_index = subsquare_values.indexOf(`${subsquare_lat}`.toLowerCase());
        if (subsquare_lat_index === -1) {
            throw new Error('Bad Grid Square: latitude component of subsquare is invalid');
        }

        return {
            lon: (field_lon_index * 20) + (square_lon_index * 2) + ((1/60) * 5.0 * (subsquare_lon_index + 0.5)) - 180,
            lat: (field_lat_index * 10) + (square_lat_index * 1) + ((1/60) * 2.5 * (subsquare_lat_index + 0.5)) -  90,
        };
    }

    static distance(grid1, grid2) {

        const coord1 = GridSquare.decode(grid1);
        const coord2 = GridSquare.decode(grid2);

        const rad = deg => deg * (Math.PI / 180.0);

        const [ lat1, lon1, lat2, lon2 ] = [ rad(coord1.lat), rad(coord1.lon), rad(coord2.lat), rad(coord2.lon) ];

        
        return Math.atan2(
            Math.sqrt(
                Math.pow(Math.cos(lat2) * Math.sin(lon2 - lon1) , 2) +
                Math.pow(Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1) , 2)
            ),
            Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
        ) * 6371.009;
    }
}

const timeseriesLabels = {
    isoWeekday: ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    month: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const charts = [];

function contactsByHour(stats) {
    const labels = (new Array(24)).fill().map((x,i) => i);
    const data = labels.map(label => stats.timeseries.hour[label] ?? 0);
    charts.push(
        new Chart(
            document.getElementById('hour'),
            {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                },
                options: {
                    responsive: true
                }
            }
        )
    );
}

function contactsByYear(stats) {
    const labels = Object.keys(stats.timeseries.year).sort();
    const data = labels.map(label => stats.timeseries.year[label]);
    charts.push(
        new Chart(
            document.getElementById('year'),
            {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                },
                options: {
                    responsive: true
                }
            }
        )
    );
}

function contactsByMonth(stats) {
    const labels = Object.keys(stats.timeseries.month).sort((x, y) => {
        if (x === y) return 0;
        else if (timeseriesLabels.month.indexOf(x) < timeseriesLabels.month.indexOf(y)) return -1;
        else return 1;
    });
    const data = labels.map(label => stats.timeseries.month[label]);
    charts.push(
        new Chart(
            document.getElementById('month'),
            {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                },
                options: {
                    responsive: true
                }
            }
        )
    );
}

function contactsByIsoWeekday(stats) {
    const labels = Object.keys(stats.timeseries.isoWeekday).sort((x, y) => {
        if (x === y) return 0;
        else if (timeseriesLabels.isoWeekday.indexOf(x) < timeseriesLabels.isoWeekday.indexOf(y)) return -1;
        else return 1;
    });
    const data = labels.map(label => stats.timeseries.isoWeekday[label]);
    charts.push(
        new Chart(
            document.getElementById('isoWeekday'),
            {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                },
                options: {
                    responsive: true
                }
            }
        )
    );
}

function contactsByMode(stats) {
    const labels = Object.keys(stats.tally.MODE).sort();
    const data = labels.map(label => stats.tally.MODE[label]);
    charts.push(
        new Chart(
            document.getElementById('mode'),
            {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                }
            }
        )
    );
}

function contactsByMyRig(stats) {
    const labels = Object.keys(stats.tally.MY_RIG).sort();
    const data = labels.map(label => stats.tally.MY_RIG[label]);
    charts.push(
        new Chart(
            document.getElementById('my_rig'),
            {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                }
            }
        )
    );
}

function contactsByMyAntenna(stats) {
    const labels = Object.keys(stats.tally.MY_ANTENNA).sort();
    const data = labels.map(label => stats.tally.MY_ANTENNA[label]);
    charts.push(
        new Chart(
            document.getElementById('my_antenna'),
            {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                }
            }
        )
    );
}

function contactsByBand(stats) {
    const labels = Object.keys(stats.tally.BAND).sort();
    const data = labels.map(label => stats.tally.BAND[label]);
    charts.push(
        new Chart(
            document.getElementById('band'),
            {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                }
            }
        )
    );
}

function placesUsa(stats) {
    $('#usmap').usmap({
        showLabels: false,
        stateStyles: { fill: '#ffffff' },
        stateHoverStyles: { fill: '#ffffaa' },
        'stateSpecificStyles': Object.keys(stats.places.usa).reduce((result, state) => {
            result[state] = { fill: '#aaffaa' };
            return result;
        }, {}),
    });
}

function places(stats) {
    $('#ndxcc').text(Object.keys(stats.places.DXCC).length);
    $('#nituz').text(Object.keys(stats.places.ITUZ).length);
    $('#ncqz').text(Object.keys(stats.places.CQZ).length);
    $('#ngrid').text(Object.keys(stats.places.GRIDSQUARE).length);
    $('#nusa').text(Object.keys(stats.places.usa).length);
    $('#nusacnty').text(Object.keys(stats.places.usacnty).length);
    $('#ncanada').text(Object.keys(stats.places.canada).length);

    if (stats.dist.length > 0) {
        stats.dist.sort((a,b) => a - b);
        $('#dist_closest').text(stats.dist[0].toFixed(2) + ' km');
        $('#dist_average').text((stats.dist.reduce((r, a) => r + a, 0) / (stats.dist.length * 1.0)).toFixed(2) + ' km');
        $('#dist_furthest').text(stats.dist[stats.dist.length - 1].toFixed(2) + ' km');
    } else {
        $('#dist_furthest').text('0 km');
        $('#dist_average').text('0 km');
        $('#dist_closest').text('0 km');
    }
}

function txPower(stats) {
    const labels = Object.keys(stats.tx_pwr);
    const data = labels.map(label => stats.tx_pwr[label]);
    charts.push(
        new Chart(
            document.getElementById('tx_pwr'),
            {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Contacts',
                            data,
                        }
                    ]
                }
            }
        )
    );
}

function callsigns(stats) {
    $('#unique_pfx').text(Object.keys(stats.tally.PFX).length);
    $('#unique_call').text(Object.keys(stats.tally.CALL).length);
    $('#avg_len_call').text(
        (Object.keys(stats.tally.CALL).reduce((r, c) => r + c.length, 0) / (1.0 * Object.keys(stats.tally.CALL).length)).toFixed(2)
    );

    if (Object.entries(stats.tally.PFX).length > 0) {
        const common_pfx = Object.entries(stats.tally.PFX).reduce((result, pfx) => (!result || result[1] < pfx[1]) ? pfx : result);
        $('#most_common_pfx').text(common_pfx[0]);
    } else {
        $('#most_common_pfx').text('N/A');
    }

    const common_call = Object.entries(stats.tally.CALL).reduce((result, call) => (!result || result[1] < call[1]) ? call : result);
    $('#most_common_call').text(common_call[0]);
}

function rates(stats) {
    if (!stats.date_first_qso || !stats.date_last_qso) {
        $('#rate_per_hour').text('0');
        $('#rate_per_day').text('0');
        $('#rate_per_month').text('0');
        $('#rate_per_year').text('0');
        return;
    }

    const first = moment(stats.date_first_qso);
    const last = moment(stats.date_last_qso);

    const diff = moment.duration(last.diff(first));

    const per_hour = ((stats.nqso * 1.0) / (diff.asHours() * 1.0));
    const per_day = ((stats.nqso * 24.0) / (diff.asHours() * 1.0));                     // 24 hours a day
    const per_month = ((stats.nqso * 24.0 * (365.25 / 12.0)) / (diff.asHours() * 1.0)); // 365.25/12 is days per month
    const per_year = ((stats.nqso * 24.0 * 365.25) / (diff.asHours() * 1.0));           // 365.25 is days per year (inc leap year every 4 years)

    $('#rate_per_hour').text(per_hour.toFixed(2));
    $('#rate_per_day').text(per_day.toFixed(2));
    $('#rate_per_month').text(per_month.toFixed(2));
    $('#rate_per_year').text(per_year.toFixed(2));
}

function contests(stats) {

    $('#contests').html('');

    Object
        .entries(stats.tally.CONTEST_ID)
        .map(([ key, val ]) => [ key, val, enums.ContestID[key] ?? key ])
        .sort((a, b) => b[1] - a[1])
        .forEach(([ key, val, label ]) => {
            $('#contests').append('<tr><th id="' + key + '_label"></th><td><span id="' + key + '_val"></span></td></tr>');
            $('#' + key + '_label').text(label);
            $('#' + key + '_val').text(val);
        });

}

function rst(stats) {
    const results = {
        r_sent_total: 0,
        r_sent_n: 0,
        s_sent_total: 0,
        s_sent_n: 0,
        r_rcvd_total: 0,
        r_rcvd_n: 0,
        s_rcvd_total: 0,
        s_rcvd_n: 0,
    };

    [ 'sent', 'rcvd' ].forEach(direction => {
        Object
            .entries(stats.tally[`RST_${direction.toUpperCase()}`])
            .forEach(([rst, count]) => {
                const [ r, s, ...rest ] = rst.split('');        

                const ri = parseInt(r);
                if (1 <= r && r <= 5) {
                    results[`r_${direction}_total`] += (count * r);
                    results[`r_${direction}_n`] += count;
                }

                const si = parseInt(s);
                if (1 <= s && s <= 9) {
                    results[`s_${direction}_total`] += (count * s);
                    results[`s_${direction}_n`] += count;
                }
            });
    });

    if (results.r_sent_n === 0) {
        $('#r_sent').text('N/A');
    } else {
        $('#r_sent').text((results.r_sent_total / (results.r_sent_n * 1.0)).toFixed(2));
    }

    if (results.s_sent_n === 0) {
        $('#s_sent').text('N/A');
    } else {
        $('#s_sent').text((results.s_sent_total / (results.s_sent_n * 1.0)).toFixed(2));
    }

    if (results.r_rcvd_n === 0) {
        $('#r_rcvd').text('N/A');
    } else {
        $('#r_rcvd').text((results.r_rcvd_total / (results.r_rcvd_n * 1.0)).toFixed(2));
    }

    if (results.s_rcvd_n === 0) {
        $('#s_rcvd').text('N/A');
    } else {
        $('#s_rcvd').text((results.s_rcvd_total / (results.s_rcvd_n * 1.0)).toFixed(2));
    }

}

function pota(stats) {

    $('#pota_hunter_qso').text(stats.pota.hunter_qso);
    $('#pota_activator_qso').text(stats.pota.activator_qso);
    $('#pota_p2p_qso').text(stats.pota.p2p_qso);
    $('#pota_hunted_parks').text(stats.pota.hunted_parks.size);
    $('#pota_activated_parks').text(stats.pota.activated_parks.size);

}

function sota(stats) {

    $('#sota_chaser_qso').text(stats.sota.chaser_qso);
    $('#sota_activator_qso').text(stats.sota.activator_qso);
    $('#sota_s2s_qso').text(stats.sota.s2s_qso);
    $('#sota_chased_summits').text(stats.sota.chased_summits.size);
    $('#sota_activated_summits').text(stats.sota.activated_summits.size);

}

function plotIt(stats, adif_file, header, startTime) {

    while (charts.length > 0) {
        const chart = charts.pop();
        chart.destroy();
    }

    const endTime = new Date();
    const runtime_ms = endTime.getTime() - startTime.getTime();

    $('#adif_filesize').text(adif_file.size);
    $('#header_progname').text(header.PROGRAMID ?? 'unknown application');
    $('#header_progver').text(header.PROGRAMVERSION ?? 'unknown version');
    $('#runtime').text(moment.duration(runtime_ms).asSeconds());
    $('#nqso').text(stats.nqso);
    $('#date_first_qso').text(stats.date_first_qso ? stats.date_first_qso.format('YYYY-MM-DD') : 'none');
    $('#date_last_qso').text(stats.date_last_qso ? stats.date_last_qso.format('YYYY-MM-DD') : 'none');

    $('#spinner').removeClass('spinner');
    $('#results').removeClass('hidden');

    contactsByYear(stats);
    contactsByMonth(stats);
    contactsByIsoWeekday(stats);
    contactsByHour(stats);
    contactsByMode(stats);
    contactsByBand(stats);
    contactsByMyRig(stats);
    contactsByMyAntenna(stats);

    places(stats);
    placesUsa(stats);
    txPower(stats);
    callsigns(stats);
    rates(stats);
    contests(stats);
    rst(stats);
    pota(stats);
    sota(stats);
}




$(function () {

    $('#powered_by_link').text(Version.name);
    $('#powered_by_link').attr('href', Version.homepage);
    $('#powered_by_version').text(Version.version);


    $('form[name="file-chooser"]').on('submit', e => {
        e.preventDefault();

        const startTime = new Date();

        $('#results').addClass('hidden');
        $('#spinner').addClass('spinner');

        const files = $('input[name="adif_file"]').prop('files');
        if (files.length !== 1) {
            alert('Please select one file');
            return false;
        }

        const [ adif_file ] = files;

        const chunks = [];

        const decoder = new TextDecoder('utf-8');
        const reader = adif_file.stream().getReader();
        reader.read().then(function ondata({ done, value }) {
            if (done) {
                const parser = new AdifParser();

                const header = {};
                const stats = {
                    nqso: 0,
                    date_first_qso: null,
                    date_last_qso: null,
                    tally: {
                        BAND: new Map(),
                        CQZ: new Map(),
                        MODE: new Map(),
                        MY_RIG: new Map(),
                        MY_ANTENNA: new Map(),
                        ITU: new Map(),
                        MY_SIG: new Map(),
                        SIG: new Map(),
                        CALL: new Map(),
                        PFX: new Map(),
                        CONTEST_ID: new Map(),
                        RST_SENT: new Map(),
                        RST_RCVD: new Map(),
                    },
                    timeseries: {
                        year: new Map(),
                        month: new Map(),
                        dayOfYear: new Map(),
                        isoWeekday: new Map(),
                        date: new Map(),
                        hour: new Map(),
                    },
                    places: {
                        usa: new Map(),
                        usacnty: new Map(),
                        canada: new Map(),
                        GRIDSQUARE: new Map(),
                        CQZ: new Map(),
                        ITUZ: new Map(),
                        DXCC: new Map(),
                    },
                    tx_pwr: {
                        QRO: 0,
                        LP: 0,
                        QRP: 0,
                        QRPp: 0,
                    },
                    callsigns: {
                        CALL: new Set(),
                    },
                    dist: [],
                    pota: {
                        hunter_qso: 0,
                        hunted_parks: new Set(),
                        activator_qso: 0,
                        activated_parks: new Set(),
                        p2p_qso: 0,
                    },
                    sota: {
                        chaser_qso: 0,
                        chased_summits: new Set(),
                        activator_qso: 0,
                        activated_summits: new Set(),
                        s2s_qso: 0,
                    },
                };

                parser.addEventListener('Header', e => {
                    Object.assign(header, e.detail);
                });

                parser.addEventListener('QSO', e => {
                    const qso = e.detail;

                    if (typeof qso.DISTANCE === 'string' && qso.DISTANCE.length > 0) {
                        stats.dist.push(parseFloat(qso.DISTANCE));
                    } else if (typeof qso.GRIDSQUARE === 'string' && qso.GRIDSQUARE.length > 0 && typeof qso.MY_GRIDSQUARE === 'string' && qso.MY_GRIDSQUARE.length > 0) {
                        stats.dist.push(GridSquare.distance(qso.MY_GRIDSQUARE, qso.GRIDSQUARE));
                    }

                    if (typeof qso.GRIDSQUARE === 'string' && qso.GRIDSQUARE.length > 4) {
                        qso.GRIDSQUARE = qso.GRIDSQUARE.slice(0, 4);
                    }

                    stats.nqso++;

                    // fill in stats.tally
                    Object.keys(stats.tally).filter(key => key in qso).forEach(key => {
                        const oldValue = stats.tally[key].get(qso[key]) ?? 0;
                        stats.tally[key].set(qso[key], oldValue + 1);
                    });

                    // fill in stats.timeseries
                    const year = qso.QSO_DATE.slice(0, 4);
                    const month = qso.QSO_DATE.slice(4, 6);
                    const day = qso.QSO_DATE.slice(6, 8);

                    const TIME_ON = qso.TIME_ON.length === 4 ? `${qso.TIME_ON}00` : qso.TIME_ON; /* normalize to 6 digit time */

                    const hour = TIME_ON.slice(0, 2);
                    const minute = TIME_ON.slice(2, 4);
                    const second = TIME_ON.slice(4, 6);

                    const ts = moment(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`, moment.ISO_8601);

                    if (stats.date_first_qso === null || ts.isBefore(stats.date_first_qso)) {
                        stats.date_first_qso = ts;
                    }
                    if (stats.date_last_qso === null || ts.isAfter(stats.date_last_qso)) {
                        stats.date_last_qso = ts;
                    }

                    Object.keys(stats.timeseries).forEach(key => {
                        const label = key in timeseriesLabels ? timeseriesLabels[key][ts[key]()] : ts[key]();
                        const oldValue = stats.timeseries[key].get(label) ?? 0;
                        stats.timeseries[key].set(label, oldValue + 1);
                    }); 


                    [ 'DXCC', 'CQZ', 'ITUZ', 'GRIDSQUARE' ].forEach(place => {
                        if (typeof qso[place] === 'string' && qso[place] !== '') {
                            const oldValue = stats.places[place].get(qso[place]) ?? 0;
                            stats.places[place].set(qso[place], oldValue + 1);
                        }
                    });

                    switch (qso.COUNTRY) {
                        case 'CANADA':
                            if (typeof qso.STATE === 'string' && qso.STATE !== '') {
                                const oldValue = stats.places.canada.get(qso.STATE) ?? 0;
                                stats.places.canada.set(qso.STATE, oldValue + 1);
                            }
                            break;
                        case 'UNITED STATES OF AMERICA':
                            if (typeof qso.STATE === 'string' && qso.STATE !== '') {
                                const oldValue = stats.places.usa.get(qso.STATE) ?? 0;
                                stats.places.usa.set(qso.STATE, oldValue + 1);
                            }
                            if (typeof qso.CNTY === 'string' && qso.CNTY !== '') {
                                const oldValue = stats.places.usacnty.get(qso.CNTY) ?? 0;
                                stats.places.usacnty.set(qso.CNTY, oldValue + 1);
                            }
                            break;
                        default:
                            break;
                    }

                    if (typeof qso.TX_PWR === 'string' && qso.TX_PWR !== '') {
                        const tx_pwr = parseFloat(qso.TX_PWR);
                        if (tx_pwr > 100) {
                            stats.tx_pwr.QRO++;
                        } else if (tx_pwr > 5) {
                            stats.tx_pwr.LP++;
                        } else if (tx_pwr > 1) {
                            stats.tx_pwr.QRP++;
                        } else {
                            stats.tx_pwr.QRPp++;
                        }
                    }

                    // POTA
                    const pota_ref = qso.SIG === 'POTA' ? qso.SIG_INFO : qso.POTA_REF;
                    if (typeof pota_ref === 'string' && pota_ref !== '') {
                        stats.pota.hunter_qso++;
                        pota_ref.split(',').map(ref => ref.split('@')[0]).forEach(ref => {
                            stats.pota.hunted_parks.add(ref);
                        });
                    }

                    const my_pota_ref = qso.MY_SIG === 'POTA' ? qso.MY_SIG_INFO : qso.MY_POTA_REF;
                    if (typeof my_pota_ref === 'string' && my_pota_ref !== '') {
                        stats.pota.activator_qso++;
                        my_pota_ref.split(',').map(ref => ref.split('@')[0]).forEach(ref => {
                            stats.pota.activated_parks.add(ref);
                        });
                    }

                    if (
                            (typeof pota_ref === 'string' && pota_ref !== '')
                        &&
                            (typeof my_pota_ref === 'string' && my_pota_ref !== '')
                    ) {
                        stats.pota.p2p_qso++;
                    }

                    // SOTA
                    const sota_ref = qso.SIG === 'SOTA' ? qso.SIG_INFO : qso.SOTA_REF;
                    if (typeof sota_ref === 'string' && sota_ref !== '') {
                        stats.sota.chaser_qso++;
                        stats.sota.chased_summits.add(sota_ref);
                    }

                    const my_sota_ref = qso.MY_SIG === 'SOTA' ? qso.MY_SIG_INFO : qso.MY_SOTA_REF;
                    if (typeof my_sota_ref === 'string' && my_sota_ref !== '') {
                        stats.sota.activator_qso++;
                        stats.sota.activated_summits.add(my_sota_ref);
                    }

                    if (
                            (typeof sota_ref === 'string' && sota_ref !== '')
                        &&
                            (typeof my_sota_ref === 'string' && my_sota_ref !== '')
                    ) {
                        stats.sota.s2s_qso++;
                    }
                });

                parser.addEventListener('done', e => {
                    Object.keys(stats.tally).forEach(key => {
                        stats.tally[key] = Object.fromEntries(stats.tally[key]);
                    });
                    Object.keys(stats.timeseries).forEach(key => {
                        stats.timeseries[key] = Object.fromEntries(stats.timeseries[key]);
                    });
                    Object.keys(stats.places).forEach(key => {
                        stats.places[key] = Object.fromEntries(stats.places[key]);
                    });
                    plotIt(stats, adif_file, header, startTime);
                });

                try {
                    $('#error').text('');
                    parser.parse(chunks.join(''));
                } catch (err) {
console.log(err);
                    $('#error').text('parse error: ' + err.message + ((err.hasOwnProperty('field') && err.hasOwnProperty('value')) ? ' ' + err.field + '=' + err.value : ''));
                }
                $('#spinner').removeClass('spinner');
                return;
            }
            chunks.push(decoder.decode(value));
            return reader.read().then(ondata);
        });

        return false;
    });
});
