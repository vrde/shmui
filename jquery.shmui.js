(function ($) {
    'use strict'

    // Keys to trap when plugin is active
    var TRAPPED = ['Esc', 'Left', 'Right', ' '];


    $.fn.shmui = function (options) {

        var state = {
            // array with all the images to display
            // in the gallery
            images: [],

            // last URL location before activating
            // the plugin
            lastLocation: null,

            // index of the active slide
            current: null,

            // root element containing everything
            // related to the plugin
            el: null
        };

        function getEl () {
            var content, controls, prev, next;

            if (!state.el) {
                state.el = $('<div />', {
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
                state.el.append(content);
                state.el.append(controls);

                prev.on('click', function (e) { $(this).blur(); move(-1); });
                next.on('click', function (e) { $(this).blur(); move(1); });
                $('body').prepend(state.el).addClass('shmui-stop-scrolling');
            }
            return state.el;
        }

        function move (offset) {
            var pos = (state.current + offset) % state.images.length;
            if (pos == -1)
                pos = state.images.length - 1
            show(pos);
        };

        function show (index) {
            var el = getEl(),
                content = el.find('.shmui-content'),
                newContent = $('<div />', { 'class': 'shmui-content' }),
                img = state.images[index],
                url = img.attr('data-large-src') || img.attr('src');
            content.after(newContent);
            newContent.css('background-image', 'url("'+ url + '")');

            newContent.on('click', close);

            content.fadeOut('fast', function () {
                content.remove()
            });
            newContent.hide().fadeIn('fast');
            state.current = index;
        }

        function close () {
            $('.shmui-wrap').remove();
            $('body').removeClass('shmui-stop-scrolling');
            state.el = null;
            state.current = null;
        }

        function clicked (e) {
            var img = $(this);
            if (!state.lastLocation)
                state.lastLocation = window.location.pathname + window.location.search;
            show(img.data('index'));
        }

        function keypress (e) {
            var k = e.key;

            if(!state.el)
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

        init();

        return this.each(function (i) {
            var img = $(this);
            state.images.push(img);
            img.addClass('shmui-item');
            img.click(clicked);
            img.data('index', i);
        });
    };
}) (jQuery);

