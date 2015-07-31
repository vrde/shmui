'use strict';

/**
 * Dear friend, thanks for taking a look at the code.
 * It's still refactored, I'll do it when I'm sure this gallery has a decent
 * performance on different mobile devices. Once I'm sure about it, I'll clean
 * up my code a bit :)
 *
 * Anyway, if you have any suggestion, feel free to contact me on Github.
 *
 *  -vrde
 */

(function($) {

    // Keys to trap when plugin is active
    var TRAPPED = ['Esc', 'Left', 'Right', ' '],
        DEVICE_IMAGE_MAX_RATIO = 2;

    $.fn.shmui = function () {

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
                el: null,

                // the id for the inertia timer
                inertia: null
            };

            // soon...
            // settings = $.extend({
            // }, options);

        function change (offset) {
            var gallery = state.galleries[state.currentGallery],
                pos = (state.currentImage + offset) % gallery.length;

            if (gallery.length === 1) {
                return;
            }

            if (pos === -1) {
                pos = gallery.length - 1;
            }
            state.currentImage = pos;

            update();
        }

        function toggleZoom (e) {
            if (state.el.find('.zoom').length !== 0) {
                unzoom();
            } else {
                zoom(e);
            }
        }

        function getEl() {
            var content, controls, prev, $zoom, next;

            if (!state.el) {
                state.el = $('<div />', {
                    'class': 'shmui-wrap'
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


                if (state.galleries[state.currentGallery].length > 1) {
                    controls.append(prev, $zoom, next);
                } else {
                    controls.append($zoom);
                }

                state.el.append(content);
                state.el.append(controls);
                state.el.on('click', function (e) {
                    if ($(e.target).hasClass('shmui-wrap')) {
                        close();
                    }
                });

                prev.on('click', function () { $(this).blur(); change(-1); });
                $zoom.on('click', function (e) { $(this).blur(); toggleZoom(e); });
                next.on('click', function () { $(this).blur(); change(1); });
                $('body').prepend(state.el).addClass('shmui-stop-scrolling');
            }
            return state.el;
        }

        function getSrc() {
            var img = state.galleries[state.currentGallery][state.currentImage],
                url = img.attr('data-large-src') || img.attr('src');
            return url;
        }

        function preloadNextImage() {
            var gallery = state.galleries[state.currentGallery],
                pos = (state.currentImage + 1) % gallery.length,
                imgObj = new Image(),
                img, url;

            if (pos === -1) {
                pos = gallery.length - 1;
            }

            img = state.galleries[state.currentGallery][pos];
            url = img.attr('data-large-src') || img.attr('src');
            imgObj.src = url;
            return url;
        }

        function goto(imageIndex, galleryIndex) {
            state.currentImage = imageIndex;
            state.currentGallery = galleryIndex;

            update();
        }

        function update() {
            var el = getEl(),
                content = el.find('.shmui-content'),
                newContent = $('<div />', { 'class': 'shmui-content' }),
                url = getSrc(),
                i = new Image();

            unzoom();

            content.after(newContent);
            newContent.css('background-image', 'url("' + url + '")');

            newContent.on('click', close);
            el.addClass('loading');
            newContent.hide();
            el.find('.shmui-controls').hide();
            i.onload = function () {
                el.removeClass('loading');
                newContent.fadeIn('fast');
                el.find('.shmui-controls').fadeIn('fast');
                preloadNextImage();
            };
            i.src = url;

            content.fadeOut('fast', function () {
                content.remove();
            });
        }

        function close() {
            $('.shmui-wrap').remove();
            $('body').removeClass('shmui-stop-scrolling');
            state.el = null;
            state.currentGallery = null;
            state.currentImage = null;
        }

        function clicked() {
            var img = $(this);
            if (!state.lastLocation) {
                state.lastLocation = window.location.pathname + window.location.search;
            }

            goto(img.data('imageIndex'), img.data('galleryIndex'));
        }


        function optimizeImageSize(imageWidth, imageHeight) {
            var deviceSize = Math.max($(window).width(), $(window).height()),
                imageSize = Math.max(imageWidth, imageHeight),
                maxSize = deviceSize * DEVICE_IMAGE_MAX_RATIO,
                resizeRatio = maxSize / imageSize;

            // do not stretch the image
            if (resizeRatio > 1) {
                resizeRatio = 1;
            }

            return {
                width: imageWidth * resizeRatio,
                height: imageHeight * resizeRatio
            };
        }

        function zoom() {
            var el = getEl(),
                content = el.find('.shmui-content'),
                img = new Image(),
                lastTouchX = null, lastTouchY = null,
                lastX, lastY, lastOffsetX, lastOffsetY;

            content.off('click');
            content.on('click', unzoom);
            content.addClass('zoom');

            img.onload = function() {
                var imageWidth = this.width,
                    imageHeight = this.height,
                    resizedImageDimension = optimizeImageSize(imageWidth, imageHeight);

                function mouseAdaptor(e) {
                    var w = el.width(),
                        h = el.height(),
                        x = -e.clientX * (imageWidth - w) / w,
                        y = -e.clientY * (imageHeight - h) / h;

                    reposition(x, y);
                    e.preventDefault();
                }

                function touchAdaptor(e) {
                    var touch = e.originalEvent.touches[0],
                        w = el.width(),
                        h = el.height();

                    //content.css('background-image', 'url("'+ '/img/small-01.jpg' + '")');
                    //content.css('background-size', 'contain');

                    getEl().addClass('moving');

                    lastOffsetX = touch.clientX - lastTouchX;
                    lastOffsetY = touch.clientY - lastTouchY;

                    lastX += lastOffsetX;
                    lastY += lastOffsetY;

                    lastTouchX = touch.clientX;
                    lastTouchY = touch.clientY;

                    lastX = Math.min(0, lastX);
                    lastY = Math.min(0, lastY);

                    lastX = Math.max(lastX, w - imageWidth);
                    lastY = Math.max(lastY, h - imageHeight);

                    reposition(lastX, lastY);
                    e.preventDefault();
                }

                function inertiaAdaptor() {
                    var w = el.width(),
                        h = el.height();

                    if ((Math.abs(lastOffsetX) < 0.5) && (Math.abs(lastOffsetY) < 0.5)) {
                        clearInterval(state.inertia);
                        getEl().removeClass('moving');
                    }

                    lastX += lastOffsetX;
                    lastY += lastOffsetY;

                    lastX = Math.min(0, lastX);
                    lastY = Math.min(0, lastY);

                    lastX = Math.max(lastX, w - imageWidth);
                    lastY = Math.max(lastY, h - imageHeight);

                    lastOffsetX /= 1.1;
                    lastOffsetY /= 1.1;

                    reposition(lastX, lastY);
                }

                function reposition(x, y) {
                    x = x + 'px';
                    y = y + 'px';

                    /*
                    if (imageWidth <= w)
                        x = '-50%';
                    if (imageHeight <= h)
                        y = '-50%';
                        */

                    content.css({
                        'transform': 'translate3d(' + x + ', ' + y + ', 0px)',
                        '-webkit-transform': 'translate3d(' + x + ', ' + y + ', 0px)'
                    });
                    //content.css('background-position', x + ' ' + y);
                }


                imageWidth = resizedImageDimension.width;
                imageHeight = resizedImageDimension.height;


                lastX = -(imageWidth - el.width()) / 2;
                lastY = -(imageHeight - el.height()) / 2;

                content.css({
                    'background-position': '0 0',
                    'background-size': 'cover',
                    'width': imageWidth + 'px',
                    'height': imageHeight + 'px',
                    'transform': 'translate3d(' + lastX + 'px, ' + lastY + 'px, 0px)',
                    '-webkit-transform': 'translate3d(' + lastX + 'px, ' + lastY + 'px, 0px)'
                });
                //content.css('background-position', lastX + 'px ' + lastY + 'px');

                //if (e.type == 'click')
                //    mouseAdaptor(e);

                el.on('mousemove', mouseAdaptor);
                el.on('touchmove', function(e) {
                    if($(e.target).hasClass('zoom')) {
                        touchAdaptor(e);
                    } else {
                        e.preventDefault();
                    }
                });
                el.on('touchstart', function(e) {
                    var t = e.originalEvent.touches[0];
                    clearInterval(state.inertia);
                    lastTouchX = t.clientX;
                    lastTouchY = t.clientY;
                });
                el.on('touchend', function(e) {
                    if($(e.target).hasClass('zoom')) {
                        inertiaAdaptor();
                        state.inertia = setInterval(inertiaAdaptor, 30);
                    } else {
                        clearInterval(state.inertia);
                        lastTouchX = null;
                        lastTouchY = null;
                    }
                    //e.preventDefault();
                });
            };

            img.src = getSrc();
        }

        function unzoom() {
            var el = getEl(),
                content = el.find('.shmui-content');

            clearInterval(state.inertia);
            el.removeClass('moving');

            content.removeClass('zoom');
            content.css({
                'background-position': 'center',
                'background-size': 'contain',
                'width': 'auto',
                'height': 'auto',
                'transform': 'translate3d(0px, 0px, 0px)',
                '-webkit-transform': 'translate3d(0px, 0px, 0px)'
            });

            content.off('click');
            el.off('mousemove');
            el.off('touchstart');
            el.off('touchmove');
            el.off('touchend');

            content.on('click', close);
        }

        function keypress(e) {
            var k = e.key;

            if(!state.el) {
                return;
            }

            if (k === 'Esc') {
                close();
            } else if (k === 'Left') {
                change(-1);
            } else if (k === 'Right' || k === ' ') {
                change(1);
            } else if (k === 'z') {
                toggleZoom(e);
            }

            if (TRAPPED.indexOf(k) !== -1) {
                e.preventDefault();
            }
        }

        function init() {
            $(document).on('keypress', keypress);
        }

        function appendImage(galleryIndex, imageIndex, image) {
            if (!state.galleries[galleryIndex]) {
                state.galleries[galleryIndex] = [];
            }
            state.galleries[galleryIndex].push(image);

            image.addClass('shmui-item');
            image.click(clicked);
            image.data('galleryIndex', galleryIndex);
            image.data('imageIndex', imageIndex);
        }


        init();

        return this.each(function (i) {
            var el = $(this);

            if (el[0].tagName === 'IMG') {
                appendImage(0, i, el);
            } else {
                el.find('img').each(function (j) {
                    appendImage(i, j, $(this));
                });
            }
        });
    };
}) (jQuery);
