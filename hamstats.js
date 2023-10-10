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

const plugins = [];
let pluginInstances = [];

class HsPlugin {
    constructor(category) {
        this.category = category;
    }
    init(adif_file) {}
    processHeader(header) {}
    processQso(qso) {}
    render() { }
    exit() {}

    createTaggedText(tag, text, classes = []) {
        const elem = document.createElement(tag);
        classes.forEach(clazz => elem.classList.add(clazz));
        const textNode = document.createTextNode(text);
        elem.appendChild(textNode);
        return elem;
    }

    createSection(title, content) {
        const section = document.createElement('section');
        section.appendChild(this.createTaggedText('h2', title));
        section.appendChild(content);
        return section;
    }

    createTimestamp(DATE, TIME) {
        const year = DATE.slice(0, 4);
        const month = DATE.slice(4, 6);
        const day = DATE.slice(6, 8);

        TIME = TIME.length === 4 ? `${TIME}00` : TIME; /* normalize to 6 digit time */

        const hour = TIME.slice(0, 2);
        const minute = TIME.slice(2, 4);
        const second = TIME.slice(4, 6);

        return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
    }
}

function hs_plugin_register(Plugin) {
    plugins.push(Plugin);
}

function hs_plugin_init(adif_file) {
    hs_plugin_clear();
    plugins.forEach(Plugin => pluginInstances.push(new Plugin()));
    pluginInstances.forEach(plugin => plugin.init(adif_file));
}

function hs_plugin_header(header) {
    pluginInstances.forEach(plugin => plugin.processHeader(header));
}

function hs_plugin_qso(qso) {
    pluginInstances.forEach(plugin => plugin.processQso(qso));
}

function hs_plugin_render(qso) {
    pluginInstances.forEach(plugin => plugin.render());
}

function hs_plugin_exit(qso) {
    pluginInstances.forEach(plugin => plugin.exit());
}

function hs_plugin_clear() {
    pluginInstances = [];
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

        $('#results').empty();

        const files = $('input[name="adif_file"]').prop('files');
        if (files.length !== 1) {
            alert('Please select one file');
            return false;
        }

        const [ adif_file ] = files;

        hs_plugin_init(adif_file);

        const chunks = [];

        const decoder = new TextDecoder('utf-8');
        const reader = adif_file.stream().getReader();
        reader.read().then(function ondata({ done, value }) {
            if (done) {
                const parser = new AdifParser();

                const header = {};

                parser.addEventListener('Header', e => {
                    hs_plugin_header(e.detail);
                });

                parser.addEventListener('QSO', e => {
                    hs_plugin_qso(e.detail);
                });

                parser.addEventListener('done', e => {
                    hs_plugin_render();
                    $('#spinner').removeClass('spinner');
                    $('#results').removeClass('hidden');
                    hs_plugin_exit();
                });

                try {
                    $('#error').text('');
                    parser.parse(chunks.join(''));
                } catch (err) {
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
