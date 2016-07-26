try {
    if (window.ActiveXObject)
        document.execCommand('BackgroundImageCache', false, true);
} catch(e) {
    // ignore
}

(function() {

var undefined, parseInt = window.parseInt,

departed, $dragging, BoundaryWidth, delta,

ajaxForm = function(f, c) {
    return (f.method.toUpperCase() == 'POST' ? $.post : $.get)(
        f.action, $(f).serialize(), c);
},

IGNORE_ELEM = {
    LABEL: 1,
    INPUT: 1,
    BUTTON: 1,
    TEXTAREA: 1
},

TouchEvent = function(e) {
    return {
        preventDefault: function() {
            return e.preventDefault();
        },
        pageX: e.touches[0].clientX + pageXOffset,
        pageY: e.touches[0].clientY + pageYOffset,
        target: e.target
    };
},

touchReady = function(e) {
    return ready.call(this, TouchEvent(e));
},

mouseReady = function(e) {
    if (('which' in e ? e.which != 1 : e.button != 1))
        return;
    return ready.call(this, e);
},

ready = function(e) {
    if ($(this).css('position') == 'static')
        return;
    if (IGNORE_ELEM[e.target.tagName])
        return;
    e.preventDefault();
    departed = undefined;
    $dragging = $(this).addClass('dragged');
    BoundaryWidth = $('#chat').width();
    delta = $dragging.offset();
    delta.left -= e.pageX;
    delta.top  -= e.pageY;
    delta.top_offset = -$('#chat').offset().top;
    $(document).mouseup(stop)
               .mousemove(follow);
    document.ontouchmove = touchFollow;
    document.ontouchend = stop;
},

touchFollow = function(e) {
    return follow.call(this, TouchEvent(e));
},

follow = function(e) {
    e.preventDefault();
    var d = $dragging.offset();
    d.left -= e.pageX;
    d.top  -= e.pageY;
    if (Math.abs(delta.left - d.left) > 4 ||
        Math.abs(delta.top  - d.top ) > 4 ) {
        $(document).unbind('mousemove', follow)
                   .mousemove(sync);
        document.ontouchmove = touchSync;
    }
},

touchSync = function(e) {
    return sync.call(this, TouchEvent(e));
},

sync = function(e) {
    e.preventDefault();
    departed = 1;
    $dragging.css({
        left: Math.max(Math.min(e.pageX + delta.left, BoundaryWidth), 0) + 'px',
        top:  Math.max(e.pageY + delta.top + delta.top_offset, 0) + 'px' });
},

stop = function(e) {
    e.preventDefault();

    if (departed) {
        var pos = $dragging.position(),
            x = pos.left / BoundaryWidth,
            y = pos.top,
            id = parseInt($dragging.attr('id').substring(1));
        if (id) {
            $.post('/noticeboard/update', {
                id: id, x : x, y : y });
        }
        $dragging.css('left', x * 100 + '%');
    }

    $dragging.removeClass('dragged');

    $(document).unbind('mouseup', stop)
               .unbind('mousemove', sync)
               .unbind('mousemove', follow);
    document.ontouchmove = null;
    document.ontouchend = null;

    $dragging = undefined;
},

replyForm = $('#reply');

newSubMessage = function(e) {
    e.preventDefault();
    var p = $(this.parentNode),
        form = replyForm;
    form.insertAfter(p).hide().slideDown('fast');
    var fs = form[0].elements,
        cont = p.parents('div.outer');
    cont.addClass('focus').siblings().removeClass('focus');
    fs.id.value = cont.attr('id').substring(1);
    $(fs.message).val('').focus();
},
	
show = function(url) {
    if (/(\d+\/\d+)/.test(url))
        return jQuery.historyLoad(RegExp.$1);
    var d = new Date;
    get((d.getFullYear() * 10000 + d.getMonth() * 100 +
        100 + d.getDate()) + '/0');
},

get = function(code) {
    $.browser.msie || $('#chat').css('opacity', 0);
    try { ga('send', 'event', 'noticeboard', 'show', code); } catch (e) {}
    return $.get('/noticeboard/show/' + code, undefined, update);
},

update = function(d) {
    var a = d.split(',', 3);
    updateToday(parseInt(a[1]));
    updatePagelist(parseInt(a[0]), parseInt(a[2]), parseInt(a[1]));
    
    var new_form = $('#new').appendTo('BODY');

    $('#chat').html(d.substring(d.indexOf(';') + 1))
              .find('div.outer').mousedown(mouseReady).each(function() { this.ontouchstart = touchReady }).end()
              .find('div.action a.reply').click(newSubMessage).end()
              .append(new_form);
    $.browser.msie || $('#chat').css('opacity', 1);
},

showColorPreview = function(v) {
	$('#new').each(function() { this.className = 'outer color' + v });
},

// Cal

date = 0,

updatePagelist = function(pages, P, T) {
	var s = [ ];
	for (var i = pages - 1; i >= 0; --i)
		s.push(i == P ? '<A class=self ' : '<A ',
			'href=show/', T, '/', i, '>\u25cf</A>');
	$('#pagelist').html(s.join(''));
},

updateToday = function(T) {
	$('#cal a').eq(T % 100 - 1).addClass('self')
	                           .siblings().removeClass('self');
	date = T;
},

updateCal = function(html) {
	$('#months').html(html);
	$('#d' + date).addClass('td');
},

fillmonths = function() {
    var D = new Date(2007, 7, 1),
        T = +D,
        d = new Date,
        y,
        m,
        $month = $('#month').empty();
    for ( ; +d >= T; d.setDate(0)) {
        y = d.getFullYear();
        m = d.getMonth();
        $month.append('<option value=' + (y * 100 + m + 1) +
            '>' + y + '년 ' + (m + 1) + '월' + '</option>');
    }
},

drawcal = function(y, m) {
    var d = new Date, $cal = $('#cal').empty();
    if (y && m)
    	d.setFullYear(y, m - 1, 1);
	d.setHours(0, 0, 0, 0);
	
	d.setDate(1);
	var k = (8 - d.getDay()) % 7;
	d.setMonth(d.getMonth() + 1, 0);
	for (var i = 1, n = d.getDate(); i <= n; ++i)
        $cal.append(
            (i % 7 == k ? '<a class=sun href=show/' : '<a href=show/') + 
            (d.getFullYear() * 10000 + d.getMonth() * 100 + 100 + i) +
            '/0>' + i + '</a>');

    $('#pagelist').empty();
};

/* onload */

$('#month').change(function(e) {
	e.preventDefault();
	var c = $(this).val();
    drawcal(c.substring(0, 4), c.substring(4, 6));
    get(c + '01/0');
});

$('#new').mousedown(mouseReady).each(function() {
    this.ontouchstart = touchReady;
});

$('#cal, #pagelist').click(function(e) {
    e.preventDefault();
    e.target.href && show(e.target.href);
});

$('#new-form').submit(function(e) {
    e.preventDefault();
    if (this.elements.message && this.elements.message.value != '') {
        var cont = $('#new');
        this.elements.x.value = parseFloat(cont.css('left')) / 100;
        var y = parseInt(cont.css('top'));
        this.elements.y.value = y;
        ajaxForm(this, update);
        this.elements.message.value = '';
        cont.css('top', y + 64);
    }
});

$('#new-form textarea:first').focus(function(e) {
    $(this).animate({ height: '150px' }, 'fast')
           .unbind('focus', arguments.callee);
});

$('#new-form input[name=color]').click(function() {
    showColorPreview(this.value);
});

$('#reply').submit(function(e) {
    e.preventDefault();
    if (this.elements.message.value != '') {
        $(this).hide().appendTo(document.body)
        ajaxForm(this, update)
    }
});

$('#switch').click(function(e) {
    e.preventDefault();
    $(document.body).toggleClass('cal');
    drawcal();
    var month = (date / 100 | 0) % 100;
    $('#months-cont')[0].scrollLeft = month > 6 ? 1000 : 0;
});

$('body').bind('ajaxStart', function() { $(this).addClass('loading0') })
         .bind('ajaxStop', function() { $(this).removeClass('loading0') })
         .bind('ajaxError', function(e, xhr) {
                        xhr.status < 200 || $(this).addClass('error0') });

fillmonths();
drawcal();

jQuery.historyInit(function(hash) {
    get(hash);
});

location.hash || show();

})();
