var timetable = { // parent fallback
    showPreview: function() {},
    clearPreview: function() {}
};

function showHowto() {
    document.getElementById('howto').style.display = 'block';
}

function hideHowto() {
    document.getElementById('howto').style.display = '';
}

(function() {

var editNickname = function(e) {
	e = e || event;
	e.preventDefault && e.preventDefault();
	e.returnValue = false;
	open(this.href, this.target,
		[ 'width=320,height=200,left=', e.screenX - 160,
			',top=', e.screenY - 100 ].join('')).focus();
},

fixSid = function(e) {
	var sid = parent.frames[0].location.pathname.match(/\d+$/)[0];
	this.href = this.href.replace(/sid=\d+/, 'sid=' + sid);
},

selectDomain = function() {
	if (this.selectedIndex)
		addDomain(this.options[this.selectedIndex].text);
},

domainCount = 0,

addDomain = function(s) {
	++domainCount;

	var el = document.getElementById('seldomain');
	var l;

	l = document.createElement('SPAN');
	l.className = 'domain';
	l.title = '제외하려면 클릭';
	el = el.parentNode.insertBefore(l, el);
	
	l = document.createElement('INPUT');
	l.id = 'domain' + domainCount;
	l.type = 'checkbox';
	l.defaultChecked = true;
	l.name = 'domain[]';
	l.value = s;
	l.onclick = removeDomain;
	el.appendChild(l);

	l.focus();

	l = document.createElement('LABEL');
	l.htmlFor = 'domain' + domainCount;
	l.textContent = l.innerText = s;
	el.appendChild(l);

	document.getElementById('domain0').style.display = 'none';
},

removeDomain = function() {
	this.parentNode.parentNode.removeChild(this.parentNode);
	if (!--domainCount)
		document.getElementById('domain0').style.display = '';
	document.getElementById('seldomain').focus();
},

selectOption = function(f, v) {
	var c = f.options;
	for (var i = 0, n = c.length; i < n; i++) {
		if (c[i].text == v) {
			c[i].selected = true;
			break;
		}
	}
},

LAST_TR,

tr_onmouseover = function(e) {
    e = e || event;
    var n = e.target || e.srcElement;
    while (n && n.tagName != 'TR')
        n = n.parentNode;
    if (n && n != LAST_TR && n.tagName == 'TR') {
        LAST_TR = n;
        parent.timetable.clearPreview();
        n.cells[7] && parent.timetable.showPreview(n.cells[7].innerHTML);
    } else if (!n) {
        parent.timetable.clearPreview();
    }
},

initPreviewer = function()
{
    document.onmouseover = tr_onmouseover;
},

justadd = function(e)
{
    if (e)
        e.preventDefault();
    else
        event.returnValue = false;
    if (/\bid=(\d+)\b/.test(this.href))
        parent.tframe.add(parseInt(RegExp.$1));
};

if (!parent.expanded && !document.getElementById('empty-result')) {
    parent.document.getElementsByTagName('frameset')[0].rows = '*,*';
    parent.expanded = true;
}

(function() {
    var a = document.links;
    for (var i = 0, n = a.length; i < n; i++) {
        var o = a[i];
        switch (o.className) {
        case 'nickname':
            o.onclick = editNickname;
            break;
        case 'add':
            o.onclick = parent.tframe ? justadd : fixSid;
        }
    }
})();

document.getElementById('seldomain').onchange = selectDomain;

initPreviewer();

document.forms[0].elements.statement.focus();

for (var i = 0; i < DOMAINS.length; ++i)
    addDomain(DOMAINS[i]);

})();
