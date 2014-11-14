(function ($) {
    'use strict'

    $.fn.shmui = function (options) {

        var TRAPPED = ['Esc', 'Left', 'Right', ' ']


        function getLightbox () {
            var content, controls, prev, next;

            if (!lightbox) {
                lightbox = $('<div />', {
                    'class': 'shmui-wrap',
                });

                content = $('<div />', {
                    'class': 'shmui-content'
                });

                controls = $('<div />', {
                    'class': 'shmui-controls'
                });

                prev = $('<button />', {
                    'class': 'shmui-prev'
                });

                next = $('<button />', {
                    'class': 'shmui-next'
                });
                controls.append(prev, next);
                lightbox.append(content);
                lightbox.append(controls);

                prev.on('click', function (e) { $(this).blur(); move(-1); });
                next.on('click', function (e) { $(this).blur(); move(1); });
                $('body').prepend(lightbox).addClass('shmui-stop-scrolling');
            }
            return lightbox;
        }

        function move (offset) {
            var pos = (current + offset) % images.length;
            if (pos == -1)
                pos = images.length - 1
            show(pos);
        };

        function show (index) {
            var lightbox = getLightbox(),
                content = lightbox.find('.shmui-content'),
                newContent = $('<div />', { 'class': 'shmui-content' }),
                img = images[index],
                url = img.attr('data-large-src') || img.attr('src');
            content.after(newContent);
            newContent.css('background-image', 'url("'+ url + '")');

            newContent.on('click', close);

            content.fadeOut('fast', function () {
                content.remove()
            });
            newContent.hide().fadeIn('fast');
            current = index;
        }

        function close () {
            $('.shmui-wrap').remove();
            $('body').removeClass('shmui-stop-scrolling');
            lightbox = null;
            current = null;
        }

        function clicked (e) {
            var img = $(this);
            if (!lastLocation)
                lastLocation = window.location.pathname + window.location.search;
            show(img.data('index'));
        }

        function keypress (e) {
            var k = e.key;

            if(!lightbox)
                return;

            if (k == 'Esc')
                close();
            else if (k == 'Left')
                move(-1);
            else if (k == 'Right' || k == ' ')
                move(1);

            if (TRAPPED.indexOf(k) != -1)
                e.preventDefault();
        }

        function init () {
            $(document).on('keypress', keypress);
        }

        var images = [],
            lastLocation, current, lightbox;

        init();

        return this.each(function (i) {
            var img = $(this);
            images.push(img);
            img.addClass('shmui-item');
            img.click(clicked);
            img.data('index', i);
        });
    };
}) (jQuery);

