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

/*
    Version 2023.09.22a
 */

$(function () {
    $('.navtab').on('click', function () {
        $('.navtab').each(function () {
            $(this).removeClass('activetab');
        });
        $('.navtarget').each(function () {
            $(this).addClass('hidden');
        });
        $($(this).data('target')).removeClass('hidden');
        $(this).addClass('activetab');
    });

    $('.navtab').first().click();

    $(".clickable-row").click(function() {
        window.location = $(this).data("href");
    });

    $('input').on('input', function () {
        const maxLength = parseInt($(this).attr('maxlength'));
        if (isNaN(maxLength)) {
            return;
        } else if ($(this).val().length === maxLength) {
            const form = $(this).closest("form");
            const inputs = $(form).find('input, textarea');
            const thisInputIndex = $(inputs).index(this);
            if (thisInputIndex + 1 < inputs.length) {
                $(inputs[thisInputIndex + 1]).focus().select();
            }
        }
    });

    $('.toggle-visibility').on('click', function () {
        const target = $(this).data('target');
        $(`#${target}`).toggleClass('hidden');

        $(this).text( $(this).text() === '-' ? '+' : '-' );
    });

    $('select[data-autoselect]').each(function () {
        $(this).val($(this).data('autoselect')).change();
    });
});

function encodeHtmlEntities(str) {
    return $('<div>').text(`${str}`).html();
}

function tctypeahead(input, datalist, fn) {

    $(input).on('input', function (evt) {

        const input = $(this).val();

        fn(input, function (err, choices) {
            if (err) {
                console.log('error', err);
                return;
            }

            if (!Array.isArray(choices) && typeof choices === 'object' && choices !== null) {
                choices = Object.entries(choices);
            }

            if (!Array.isArray(choices)) {
                return;
            }

            const html = choices.map((choice, index) => {
                if (Array.isArray(choice)) {
                    return `<option value="${encodeHtmlEntities(choice[1])}">${encodeHtmlEntities(choice[0])}</option>`;
                } else {
                    return `<option>${encodeHtmlEntities(choice)}</option>`;
                }
            }).join('\n');

            $(datalist).html(html);
        });
    });

}

function completer(baseUrl, toUpper = false) {
    return function (input, callback) {
        const startsWith = toUpper ? `${input}`.toUpperCase() : `${input}`;
        fetch(baseUrl + encodeURIComponent(startsWith))
            .then((response) => response.json())
            .then(json => callback(null, json))
            .catch(err => callback(err));
    };
}
