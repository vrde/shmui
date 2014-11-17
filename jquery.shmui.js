(function ($) {
    'use strict'

    // Keys to trap when plugin is active
    var TRAPPED = ['Esc', 'Left', 'Right', ' '];

    $.fn.shmui = function (options) {

        var state = {
                // array containing the galleries
                galleries: [],

                // last URL location before activating
                // the plugin
                lastLocation: null,

                // index of the active gallery
                currentGallery: null,

                // index of the active image
                currentImage: null,

                // root element containing everything
                // related to the plugin
                el: null
            },

            // soon...
            settings = $.extend({
            }, options);

        function getEl () {
            var content, controls, prev, $zoom, next;

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

                $zoom = $('<button />', {
                    'class': 'shmui-zoom'
                });

                next = $('<button />', {
                    'class': 'shmui-next'
                });

                controls.append(prev, $zoom, next);
                state.el.append(content);
                state.el.append(controls);

                prev.on('click', function (e) { $(this).blur(); move(-1); });
                $zoom.on('click', function (e) { $(this).blur(); zoom(e); });
                next.on('click', function (e) { $(this).blur(); move(1); });
                $('body').prepend(state.el).addClass('shmui-stop-scrolling');
            }
            return state.el;
        }

        function getSrc () {
            var img = state.galleries[state.currentGallery][state.currentImage],
                url = img.attr('data-large-src') || img.attr('src');
            return url;
        }

        function move (offset) {
            var gallery = state.galleries[state.currentGallery],
                pos = (state.currentImage + offset) % gallery.length;

            if (pos == -1)
                pos = gallery.length - 1
            show(pos);
        };

        function show (imageIndex) {
            var el = getEl(),
                content = el.find('.shmui-content'),
                newContent = $('<div />', { 'class': 'shmui-content' }),
                img = state.galleries[state.currentGallery][imageIndex],
                url = img.attr('data-large-src') || img.attr('src');

            content.after(newContent);
            newContent.css('background-image', 'url("'+ url + '")');

            newContent.on('click', close);

            content.fadeOut('fast', function () {
                content.remove()
            });
            newContent.hide().fadeIn('fast');
            state.currentImage = imageIndex;
        }

        function close () {
            $('.shmui-wrap').remove();
            $('body').removeClass('shmui-stop-scrolling');
            state.el = null;
            state.currentGallery = null;
            state.currentImage = null;
        }

        function clicked (e) {
            var img = $(this);
            if (!state.lastLocation)
                state.lastLocation = window.location.pathname + window.location.search;

            state.currentGallery = img.data('galleryIndex');

            show(img.data('imageIndex'));
        }

        function zoom (e) {
            var el = getEl(),
                content = el.find('.shmui-content'),
                img = new Image();

            content.off('click');
            content.on('click', unzoom);
            content.addClass('zoom');

            img.onload = function () {
                function reposition (e) {
                    var x = -e.clientX * (imageWidth - el.width()) / el.width(),
                        y = -e.clientY * (imageHeight - el.height()) / el.height();

                    content.css('background-position', x + 'px ' + y + 'px');
                }

                var imageWidth = this.width,
                    imageHeight = this.height;

                reposition(e);

                el.find('.shmui-controls').hide();
                content.css('background-size', 'auto');
                el.on('mousemove', reposition);
            }

            img.src = getSrc();
        }

        function unzoom () {
            var el = getEl(),
                content = el.find('.shmui-content');

            content.removeClass('zoom');
            el.find('.shmui-controls').show();
            content.css({
                'background-size': 'contain',
                'background-position': 'center'
            });

            content.off('click');
            content.on('click', close);
            el.off('mousemove');
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
            else if (k == 'z')
                zoom(e);

            if (TRAPPED.indexOf(k) != -1)
                e.preventDefault();
        }

        function init () {
            $(document).on('keypress', keypress);
        }

        function appendImage(galleryIndex, imageIndex, image) {
            if (!state.galleries[galleryIndex])
                state.galleries[galleryIndex] = []
            state.galleries[galleryIndex].push(image);

            image.addClass('shmui-item');
            image.click(clicked);
            image.data('galleryIndex', galleryIndex);
            image.data('imageIndex', imageIndex);
        }


        init();

        return this.each(function (i) {
            var el = $(this);

            if (el[0].tagName == 'IMG') {
                appendImage(0, i, el)
            } else {
                el.find('img').each(function (j) { 
                    appendImage(i, j, $(this));
                });
            }
        });
    };
}) (jQuery);

