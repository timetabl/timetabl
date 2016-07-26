try {
    document.execCommand('BackgroundImageCache', false, true);
} catch(e) { }

$.ajaxSetup({ cache: false });

(function() {

var window = this, undefined, parseInt = window.parseInt,

contains = window.Node && Node.prototype && !Node.prototype.contains ?
function(a, d) {
    try { return !!(a.compareDocumentPosition(d) & 16) }
    catch (e) {}
    return false
} :
function(a, d) { return a.contains(d) },

lastInArray = function(x, a) {
    var i = a.length - 1;
    while (i >= 0 && a[i] !== x)
        --i;
    return i;
},

SCENARIO_NAME = [undefined, '기본 시간표', '시간표 하나', '시간표 두울',
                            '시간표 세엣', '시간표 네엣', '시간표 다섯'],

init = function() {
    $('body').bind('ajaxStart', function() { $(this).addClass('loading0') })
             .bind('ajaxStop', function() { $(this).removeClass('loading0') })
             .bind('ajaxError', function(e, xhr) {
                            xhr.status < 200 || $(this).addClass('error0') });
    $.get('prefs', undefined, prefFetched, 'json');
},

externSid,

prefFetched = function(data) {
    var $hidectrl = $('#hidectrl').removeClass('hide-nickname')
                                  .removeClass('hide-location')
                                  .removeClass('hide-lecturer')
                                  .removeClass('hide-hideempty');
    data.prefs.nickname  || $hidectrl.addClass('hide-nickname');
    data.prefs.location  || $hidectrl.addClass('hide-location');
    data.prefs.lecturer  || $hidectrl.addClass('hide-lecturer');
    data.prefs.hideempty || $hidectrl.addClass('hide-hideempty');
    $('#sw-nickname').attr('checked', !!data.prefs.nickname);
    $('#sw-location').attr('checked', !!data.prefs.location);
    $('#sw-lecturer').attr('checked', !!data.prefs.lecturer);
    $('#sw-hideempty').attr('checked', !!data.prefs.hideempty);

    externSid = data.univ.THIS_SEMESTER;
},

sid = parseInt(/\?s=(\d+)/.exec(location.search)[1]),

cid = 1,

getCid = window.getCid = function() {
    return cid;
},

get = function(sid, cid) {
    $.get('lectures', { sid: sid, cid: cid }, lecturesFetched, 'json');
},

editing,

memoEdited = function(e) {
    var $editor = $(e.target);
    if ($editor.val() != e.target.defaultValue) {
        $.post('memo', {
            sid: sid,
            cid: cid,
            code: $editor.parent().attr('id').substring(1),
            txt: $editor.val()
        });
    }
    /\S/.test($editor.val()) ?
        $('<p class=memo />').text($editor.val()).replaceAll($editor) :
        $editor.remove();
    setTimeout(function() { editing = undefined }, 100);
},

memoClicked = function($p) {
    if (editing) return;
    if (!$p.is('p.memo')) {
        var $e = $p.find('p.memo');
        $p = $e.length ? $e : $('<p class=memo />').prependTo($p);
    }
    var txt = $p.text();
    var $textarea = $('<textarea></textarea>')
        .attr('defaultValue', txt).val(txt)
        .width($p.innerWidth() - 8)
        // .height($p.parent().innerHeight() - 6)
        // .keydown(function() { this.style.height = this.scrollHeight + 'px' })
        .blur(memoEdited)
        .replaceAll($p)
        .focus();
    editing = 1;
},

hasdone = {
    q: [],
    push: function(x) {
        this.q.push(x);
        $('#undo').attr('disabled', false);
    },
    pop: function() {
        this.q.length > 1 || $('#undo').attr('disabled', true);
        return this.q.pop();
    }
},

lectureDeleteClicked = function(e) {
    e.preventDefault();
    var id = $(e.target).data('id');
    $('p.n' + id).each(function() {
        if ($(this).siblings('p:not(.memo)').length == 0)
            $(this).parent().removeClass('non-empty');
    }).remove();
    $('#credits').text(credits -= $('li.n' + id).remove().attr('credits'));
    LessonColor.reset(id);
    $.post('removeLecture', { sid: sid, cid: cid, lid: id });
    hasdone.push(id);
},

LessonColor = {
    n: undefined,
    h: undefined,
    init: function() {
        this.n = [ 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 ];
        this.h = {};
    },
    set: function(a) {
        if (!(a in this.h))
            this.h[a] = this.n.pop() || 0;
    },
    get: function(a) {
        return this.h[a];
    },
    reset: function(a) {
        if (this.h[a])
            this.n.push(this.h[a]);
        delete this.h[a];
    }
};
LessonColor.init();

var emptyTable = function() {
    LessonColor.init();
    $('#lessons').find('td').removeClass('non-empty').end()
                 .find('p').remove();
    $('#nolesson').empty();
},

credits = 0,

lecturesFetched = function(data) {
    sid = data.sid;
    cid = data.cid;

    $('#extern')[sid == externSid && cid == 1 ? 'slideDown' : 'slideUp']('fast');

    emptyTable();

    jQuery.each(data.events, function() {
        $('<p class=memo />').text(this.message).appendTo('#c' + this.code);
    });

    credits = 0;

    jQuery.each(data.lectures, function() {
        credits += this.credits;
        LessonColor.set(this.id);
        addLesson(this);
        var lecture = this;
        jQuery.each(data.lessons[this.id] || {}, function(code, loc) {
            addLesson(lecture, code, loc);
        });
        lecture = undefined;
    });

    $('#credits').text(credits);

    parent.document.title = (SCENARIO_NAME[cid] || '') + ' (' +
        (data.semester_name || '') + ') - 타임테이블';

    toggleEmptyrows();
},

addLesson = function(lecture, code, loc) {
    lecture.nickname = lecture.nickname || lecture.title;
    var $p = (code ?
        $('<p />').appendTo('#c' + code).addClass('o' + LessonColor.get(lecture.id)) :
        $('<li />').appendTo('#nolesson').attr('credits', lecture.credits)
        ).addClass('n' + lecture.id);
    $('<a href=# class=remove>삭제</a>').data('id', lecture.id).appendTo($p);
    if (!code) {
        $('<span class=litid />').text(lecture.litid + ' ').appendTo($p);
    }
    $('<a href=# class=title />').text(lecture.title).appendTo($p)
                                 .data('id', lecture.id);
    $('<a href=# class=nickname />').text(' ' + lecture.nickname).appendTo($p)
                                    .data('id', lecture.id);
    $('<span class=lecturer />').text(' ' + lecture.lecturer).appendTo($p);
    code && $('<span class=location />').text(' ' + loc).appendTo($p);
    $p.parent().addClass('non-empty');
},

lectureAdded = function(data) {
    if (data.lecture) {
        LessonColor.set(data.lecture.id);
        addLesson(data.lecture);
        var lecture = data.lecture;
        jQuery.each(data.lessons[data.lecture.id] || {}, function(code, loc) {
            addLesson(lecture, code, loc);
        });
        lecture = undefined;
        $('#credits').text(credits += data.lecture.credits);
        toggleEmptyrows();
    }
},

add = window.add = function(id) {
    $.post('addLecture', { sid: sid, cid: cid, lid: id },
           lectureAdded, 'json');
},

scenarioClicked = function(e) {
    if (e.target.tagName == 'A') {
        $(e.target).addClass('s').siblings().removeClass('s');
        if (/#(\d+)$/.test(e.target.href))
            get(sid, RegExp.$1);
    }
},

prefChanged = function(e) {
    if (e.target.tagName == 'INPUT') {
        $('#hidectrl')[e.target.checked ? 'removeClass' : 'addClass']
            ('hide-' + e.target.name);
        var data = {};
        data[e.target.name] = e.target.checked ? 1 : 0;
        $.post('pref', data);
    }
},

onLecturesClicked = function(e) {
    var $target = $(e.target);
    if ($target.is('.remove')) {
        lectureDeleteClicked(e);
    } else if ($target.is('.memo,td')) {
        e.preventDefault();
        memoClicked($target);
    } else if ($target.is('p') && e.originalEvent.altKey) {
        e.preventDefault();
        memoClicked($target.parent());
    } else if ($target.is('.nickname,.title')) {
        return lecturesOvered(e);
    }
},

lecturesOvered = function(e) {
    if (e.target.tagName == 'A' &&
        /title|nickname/.test(e.target.className)) {
        e.preventDefault();
        $('#info')//.text('잠시만 기다려 봐...')
                  .load('/curriculum/info/' + $(e.target).data('id'))
                  .css({ left: e.pageX - 190, top: e.pageY - 80 }).show();
        $(document).mousedown(lecturesOut);
        //e.stopPropagation();
    }
},

lecturesOut = function(e) {
    if (/*e.target.tagName == 'SPAN' &&
        /title|nickname/.test(e.target.className)*/
        !contains($('#info')[0], e.target)) {
        $('#info').hide();
        $(document).unbind('mousedown', lecturesOut);
    }
},

emptyClicked = function(e) {
    if (confirm('정말 이 시간표를 비울까?')) {
        $.post('empty0', { sid: sid, cid: cid });
        emptyTable();
    }
},

clearPreview = window.clearPreview = function() {
    $('#lessons td.preview').removeClass('preview');
},

DAY = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 },

showPreview = window.showPreview = function(txt) {

    txt.replace(/([월화수목금토일]+)(\d+)(?:-(\d+))?/g, function(_, a, b, c) {
        c = c ? parseInt(c) : (b = parseInt(b));
        a.replace(/[월화수목금토일]/g, function(d) {
            d = DAY[d];
            for (var i = b; i <= c; ++i)
                $('#c' + i + d).addClass('preview');
        });
    });

},

toggleEmptyrows = function() {
    var $lessons = $('#lessons');
    $lessons.parent().attr('class', '');
    $lessons.attr('class',
        $lessons.attr('class').replace(/hide-r\d+/g, ''));

    var $tr = $lessons.find('tr');

    if (!$('#sw-hideempty:checked').length)
        return;

    var row = new Array($tr.length), col = new Array(8);

    $lessons.find('td:has(p)').each(function() {
        var code = this.id.substring(1);
        row[code / 10 | 0] = col[code % 10] = true;
    });

    col[7] || $lessons.parent().addClass(col[6] ? 'till-d6' : 'till-d5');

    var a = jQuery.inArray(true, row), b = lastInArray(true, row);
    if (a >= 0) {
        for (var i = 0; i < a; ++i)
            $lessons.addClass('hide-r' + i);
        for (var i = b + 1; i < row.length; ++i)
            $lessons.addClass('hide-r' + i);
    }
},

scenarioCopied = function(e) {
    $('#scenarios a').eq(cid - 1).addClass('c').siblings().removeClass('c');
    $('#paste-scenario').data('cid', cid).removeAttr('disabled');
},

scenarioPasted = function(e) {
    var src = $(this).data('cid');
    if (cid != src && src > 0 && cid > 0) {
        $.post('copy', { sid: sid, cid_from: src, cid: cid },
               function() { get(sid, cid) });
        $('#scenarios a').removeClass('c');
        $(this).attr('disabled', true);
    }
},

undo = function(e) {
    var x = hasdone.pop();
    x && $.post('addLecture', { sid: sid, cid: cid, lid: x },
                lectureAdded, 'json');
},

semesterChanged = function(e) {
    parent.location.replace('./?s=' + $(this).val());
};

$('#prefs').click(prefChanged);
$('#copy-scenario').click(scenarioCopied);
$('#paste-scenario').click(scenarioPasted);
$('#scenarios').click(scenarioClicked);
$('#lessons,#nolesson').click(onLecturesClicked)
                       /*.mouseover(lecturesOvered)
                       .mouseout(lecturesOut)*/;
$('#empty-scenario').click(emptyClicked);
$('#sw-hideempty').click(toggleEmptyrows);
$('#undo').click(undo);
$('#semester').change(semesterChanged);

init();
get(sid, 1);

$('#goSearch').click(function(e) {
    $('#statement', parent.frames[1].document).focus();
});

})();
