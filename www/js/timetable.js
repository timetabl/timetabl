var sid = (location.pathname.match(/\d+$/) || [1])[0];
 
try { // IE only
    document.execCommand('BackgroundImageCache', false, true);
} catch(e) {}

function set(k, v) {
	var f = document.forms.updatesetting;
	f.elements.key.value = k;
	f.elements.value.value = v;
	f.submit();
}

function copyFrom(n) {
	if (!confirm('진짜요?'))
		return false;
	var f = document.forms.copyfrom;
	f.elements.src.value = n;
	f.submit();
}

function setter(e) {
	set(this.id, this.options[this.selectedIndex].value);
}

function on_click_viewopts(e) {
    var src = $(e.target);
    if (!src.is('INPUT')) return;
    e.preventDefault();
    set(src.attr('name'), src.val() | 0);
}

$(function() {
    var d = $('<BLOCKQUOTE><A href=# class=edit title="메모"/></BLOCKQUOTE>');

	$('#table DIV').each(function() {
		d.clone(true).prependTo(this).click(on_edit);
    });

    $('#timetable,#undated,#fav').mouseover(function(e) {
        if (e.target.className == 'title') {
            var no = e.target.getAttribute('no');
            $('#info').load('/curriculum/info/' + no)
                      .show().css({ left: e.pageX + 30, top: e.pageY });
        }
    }).mouseout(function(e) {
        if (e.target.className == 'title') {
            $('#info').hide().html('');
        }
    });

	$('#time_format').change(setter);
	$('#lastday').change(setter);
	$('#time_begins_at').change(setter);
	$('#time_ends_at').change(setter);

    $('#viewopts').click(on_click_viewopts);

    if (!window.XMLHttpRequest)
        $('#table TD').bind('mouseenter', function(e) {
            this.className += ' hover';
        })
                            .bind('mouseleave', function(e) {
            this.className = this.className.replace(/hover/g, '');
        });

});

function clearAll() {
	if (!confirm('정말요?'))
		return false;
	document.forms.clearall.submit();
}

var DAY_VALUE = {
    '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 };

function showPreview(data)
{
    var a = [ ];
    data.replace(/([월화수목금토일]+)(\d+)(-(\d+))?/g,
        function(r0, r1, r2, r3, r4) {
            r4 = parseInt(r4 || r2);
            for (var i = 0, n = r1.length; i < n; ++i) {
                var d = DAY_VALUE[r1.charAt(i)];
                for (var t = parseInt(r2); t <= r4; ++t)
                    a.push([ d, t ]);
            }
            return r0;
        }
    );

    var offset = $('#time_begins_at')[0].selectedIndex;
    var c = $('#table')[0];
    var r;
    while (r = a.shift()) {
        try {
            c.rows[r[1] - offset].cells[r[0]].className += 'pv';
        } catch (e) {}
    }
}

function clearPreview()
{
    $('#table TD').each(function() {
        this.className = this.className.replace(/pv/g, '');
    });
}

function on_edit(e) {
	e.preventDefault();
	var data = $(this).parents('TD:first').attr('id').substring(1);
	open('/timetable/editevent?sid=' + sid + '&data=' + data, 'EDITEVENT',
	    'width=320,height=240,left=' + e.screenX + ',top=' + e.screenY);
}
