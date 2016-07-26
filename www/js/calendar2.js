try {
    document.execCommand('BackgroundImageCache', false, true);
} catch (e) {}

$.ajaxSetup({
	cache: false,
	beforeSend: function() { $('#loading').show() },
	complete: function() { $('#loading').hide() },
	error: function() { $('#error').show() }
});

var HOLIDAY = {
	20070101: '신정',
	20070217: '설날',
	20070218: '설날',
	20070219: '설날',
	20070301: '3.1절',
	20070505: '어린이날',
	20070524: '석가탄신일',
	20070606: '현충일',
	20070815: '광복절',
	20070924: '추석',
	20070925: '추석',
	20070926: '추석',
	20071003: '개천절',
	20071225: '크리스마스',
	20080101: '신정',
	20080206: '설날',
	20080207: '설날',
	20080208: '설날',
	20080301: '3.1절',
	20080512: '석가탄신일',
	20080505: '어린이날',
	20080606: '현충일',
	20080815: '광복절',
	20080913: '추석',
	20080914: '추석',
	20080915: '추석',
	20081003: '개천절',
	20081225: '크리스마스',
	20090101: '신정',
	20090125: '설날',
	20090126: '설날',
	20090127: '설날',
	20090301: '3.1절',
	20090502: '석가탄신일',
	20090505: '어린이날',
	20090606: '현충일',
	20090815: '광복절',
	20091002: '추석',
	20091003: '추석',
	20091004: '추석',
	20091003: '개천절',
	20091225: '크리스마스',
	_: 0
}

Date.unserialize = function(n) {
	return new Date(n / 10000 | 0, n / 100 % 100 - 1 | 0, n % 100)
}

Date.prototype.serialize = function() {
	return this.getFullYear() * 10000 + this.getMonth() * 100 + 100 + this.getDate()
}

Date.TODAY = new Date();
Date.TODAY.setHours(0, 0, 0, 0);

jQuery.fn.extend({
	emphaKeywords: function(e) {
		return this.html(this.html().replace(/♥|♡/g, '<em>$&</em>'));
	}
});

function addYear(d) {
	var n = Math.max(2007, Math.min(2009,
		parseInt($('#year').text()) + d));
	$('#year').text(n)
	$('#months a' + (d > 0 ? ':first' : ':last')).click();
}

function prevMonth(e) {
	e.preventDefault();
	var o = $('#months')[0];
	o.selectedIndex = Math.max(0, o.selectedIndex - 1);
	setMonth(e);
}

function nextMonth(e) {
	e.preventDefault();
	var o = $('#months')[0];
	o.selectedIndex = Math.min(o.options.length - 1, o.selectedIndex + 1);
	setMonth(e);
}

function setMonth(e) {
	e.preventDefault();
	var n = $('#months').val();
	Cal.setYearMonth(n.substring(0, 4), n.substring(4));
}

Cal = {
	init: function() {
		this.d = new Date() // the first date
		this.d.setDate(1);
		this.d.setHours(0, 0, 0, 0);
		this.draw();
		$('#prev-year').click(prevMonth);
		$('#next-year').click(nextMonth);
		$('#months').change(setMonth);
	},

	setYearMonth: function(y, m) {
		this.d.setFullYear(y, m - 1);
		this.draw();
	},

	draw: function() {
		$('#month').text(this.d.getFullYear() + '년 ' + (this.d.getMonth() + 1) + '월');
		var d = new Date(this.d.getTime())
		d.setDate(d.getDate() - d.getDay())
		var from = d.serialize()
		var ld = new Date(this.d.getTime())
		ld.setMonth(this.d.getMonth() + 1, 0)
		ld.setDate(ld.getDate() + 6 - ld.getDay())
		var cal = $('#cal')
		cal.empty();
		var ROW = $('#row')
		while (d.getTime() < ld.getTime()) {
			var tr = ROW.clone().appendTo(cal)[0]
			tr.id = 'R' + d.serialize()
			for (var j = 0; j < 7; j++) {
				var td = $(tr.cells[j])
				td.attr('id', 'T' + d.serialize())
				  .children('h4').text(d.getDate());
				if (d.serialize() in HOLIDAY) {
					td.addClass('holiday')
					  .children('h5').text(HOLIDAY[d.serialize()]);
				}
				if (d.getTime() == Date.TODAY.getTime())
					td.addClass('today');
				if (d.getMonth() != Cal.d.getMonth())
					td.addClass('alt');
				d.setHours(24)
			}
		}
		$.get('listing', { date: from, days: 6 * 7 }, Cal.dataHandler, 'json');
	},

	submitEvent: function(e) {
		e.preventDefault()
		$.post('create', {
			wdate:   this.elements.wdate.value,
			period:  this.elements.period.value,
			message: this.elements.message.value,
			link:    this.elements.link.value }, Cal.dataHandler, 'json')
		this.style.display = ''
	},

	calcPeriod: function(e) {
		var d = Date.unserialize(this.form.wdate.value)
		var n = Math.max(0, (parseInt(this.value) || 0) - 1)
		d.setDate(d.getDate() + n)
		this.form.elements.until.value = d.serialize()
	},

	newEvent: function(e) {
		e.preventDefault();
		e.stopPropagation();
		var f = $(document.forms.create)
		f.submit(Cal.submitEvent)
		var id = $(this).parents('td').attr('id').substring(1);
		f[0].elements.wdate.value = id;
		f[0].elements.period.onkeyup = Cal.calcPeriod
		f.find('h3').text('새 일정 (' + id + ')')
		f.show()
		setTimeout(function() { f[0].elements.message.focus() }, 0)
	},

	closeEventForm: function() {
		$(document.forms.create).hide()
	},

	dataToMap: function(data) {
		// data[ id seq period deleted message link important ]

		var r = [ ], l = [ ], e, h, i, offset

		// sort by seq and deleted
		data.sort(function(a, b) { return a.date - b.date || a.deleted - b.deleted })

		while (e = data.shift()) {
			e.seq = e.date;
			if (!e.deleted && e._period > 1) {
				e.first = Math.max(0, e.seq)
				r[e.first] = r[e.first] || [ ]
				for (offset = 0; r[e.first][offset]; offset++) {}
				e.last = e.seq + e._period - 1
				for (i = e.first; i <= e.last; i++) {
					r[i] = r[i] || [ ]
					h = { id: e.id, txt: e.message, url: e.link }
					r[i][offset] = h
					if (e.seq  == i) h.first = 1
					if (e.last == i) h.last  = 1
				}
			} else if (e.seq >= 0) {
				l[e.seq] = l[e.seq] || [ ]
				h = { id: e.id, txt: e.message, url: e.link }
				l[e.seq].push(h)
				if (e.deleted) h.deleted = 1
			}
		}

		return { ranges: r, events: l }
	},

	fill: function(lst, ranges, events) {
		var i, n, item, li, link

		lst.empty()

		for (i = 0, n = ranges.length; i < n; i++) {
			item = ranges[i]
			if (item) {
				li = $('<li>').appendTo(lst)//.addClass('a' + (i & 3))
				if (item.first)
					li.append($('<a href=# class=del></a>').attr('cid', item.id))
				li.append($('<span/>').text(item.txt).emphaKeywords())
				if (item.first)                li.addClass('b')
				if (item.last)                 li.addClass('e')
				if (!item.first && !item.last) li.addClass('m')
			} else {
				$('<li class=x>&nbsp;').appendTo(lst)
			}
		}

		for (i = 0, n = events.length; i < n; i++) {
			item = events[i]
			if (item.deleted) {
				$('<li>').appendTo(lst)
					.append($('<a href=# class=add></a>').attr('cid', item.id))
					.append($('<del/>').text(item.txt))
			} else {
				$('<li>').appendTo(lst)
					.append($('<a href=# class=del></a>').attr('cid', item.id))
					.append($('<span/>').text(item.txt).emphaKeywords())
			}
		}

		lst.append('<li class=new><a href=#></a>');
	},

	dataHandler: function(obj) {
		var rs = Cal.dataToMap(obj.rs)

		var d = Date.unserialize(obj.date)
		var td
		for (var i = 0, n = obj.days; i < n; i++) {
			td = $('#T' + d.serialize())
			Cal.fill(td.children('UL'), rs.ranges[i] || [], rs.events[i] || [])
			d.setHours(24)
		}
		$('#cal a.add').click(Cal.add);
		$('#cal a.del').click(Cal.del);
		$('#cal li.new a').click(Cal.newEvent);
		if (!window.XMLHttpRequest)
            $('#cal td').bind('mouseenter', onCellMouseenter)
                        .bind('mouseleave', onCellMouseleave);
	},

	add: function(e) {
		e.preventDefault()
		$.post('add', { id: this.getAttribute('cid') }, Cal.dataHandler, 'json')
	},

	del: function(e) {
		e.preventDefault()
		$.post('del', { id: this.getAttribute('cid') }, Cal.dataHandler, 'json')
	}
}

$(function() {
	Cal.init()
	$('#create').click(Cal.closeEventForm);
	$('#create>fieldset').click(function(e) { e.stopPropagation(); });
})

function onCellMouseenter(e) {
	this.className += ' hover';
}

function onCellMouseleave(e) {
	this.className = this.className.replace(/\s+hover/);
}
