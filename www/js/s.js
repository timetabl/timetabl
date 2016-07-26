(function() {

var window = this, undefined,

tframe = function() { return parent.tframe },

contains = window.Node && Node.prototype && !Node.prototype.contains ?
function(a, d) {
    try { return !!(a.compareDocumentPosition(d) & 16) }
    catch (e) {}
    return false
} :
function(a, d) { return a.contains(d) },

resultsetlabelClicked = function(e) {
    if (e.target.tagName == 'A') {
        e.preventDefault();
        var statement =
            $(e.target).addClass('s').siblings().removeClass('s').end().text();
        var id = e.target.href.replace(/[^#]*/, '');
        $(id).show().siblings().hide();
        if (/search\d+/.test(id))
            $('#searchform input[name=statement]').val(statement);
    }
},

sid = parseInt(/\?s=(\d+)/.exec(location.search)[1]),

seq = 0,

searchformSubmitted = function(e) {
    e.preventDefault();

    var statement = this.elements.statement.value;

    if (!/\S/.test(statement))
        return;

    if (seq >= 5) {
        $('#resultsetlabel>:last-child').remove();
        $('#resultset>:eq(2)').remove();
    }

    $('<a class=s />').attr('href', '#search' + seq).text(statement)
        .insertAfter('#resultsetlabel a:first')
        .siblings().removeClass('s');

    $('<div class=ld />').attr('id', 'search' + seq).appendTo('#resultset')
        .show().siblings().hide().end()
        .load(this.action + ' .wrap', {
            sid: sid,
            cid: this.elements.excl.checked ? tframe().getCid() : undefined,
            statement: statement },
            function() { $(this).removeClass('ld') });

    ++seq;

    hideHelp();
},

reloadFavorite = function() {
    // $('#resultsetlabel>:first-child').css('backgroundColor', '#ffc')
    $('#favorite').addClass('ld').load(
        'favorite?s=' + sid + ' .wrap',
        undefined,
        function() { $(this).removeClass('ld') });
},

searchOffset = function(n) {
    var $form = $('#searchform');
    $form[0].elements.statement.value =
        $form[0].elements.statement.value.replace(/(^|\s)#\d+(\s|$)/g, '') +
        ' #' + n;
    $form.triggerHandler('submit');
},

resultsetClicked = function(e) {
    var m;
    if (e.target.tagName == 'A' && (m = /#(\w)\/(\d+)/.exec(e.target.href))) {
        e.preventDefault();
        var id = parseInt(m[2]);
        switch (m[1]) {
        case 'a':
            tframe().add(id);
            break;
        case 'f':
            var isAdded = $(e.target).toggleClass('on').hasClass('on');
            $.post(isAdded ? 'addLecture' : 'removeLecture',
                   { sid: sid, cid: 0, lid: id }, reloadFavorite, 'json');
            break;
        case 'm':
            searchOffset(id);
            break;
        case 'n':
            window.open('/curriculum/editnickname/' + id, 'nickname',
                'width=300,height=200,left=' + (e.screenX - 150) +
                ',top=' + (e.screenY - 100));
        }
    }
},

domainChanged = function(e) {
    if (this.selectedIndex > 0) {
        var f = this.form.statement;
        f.value = jQuery.trim(f.value + ' ' + this.options[this.selectedIndex].text);
        this.selectedIndex = 0;
    }
},

STATEMENT_SELECTOR = '#searchform input:text[name=statement]',

showHelp = function(e) {
    $('#help').show();//slideDown('fast');
    $(STATEMENT_SELECTOR).unbind('keydown', showHelp);
    //$('#resultset').mousemove(hideHelp);
},

hideHelp = function(e) {
    $('#help').hide();//slideUp('fast');
    $(STATEMENT_SELECTOR).keydown(showHelp);
    //$('#resultset').unbind('mousemove', hideHelp);
},

remarkToggled = function(e) {
    $('body')
        [$(this).is(':checked') ? 'removeClass' : 'addClass']('hide-remark');
},

lecturePreviewed = function(e) {
    var target = e.target, from = e.relatedTarget || e.fromElement;
    while (target && target.tagName != 'TR')
        target = target.parentNode;
    if (target && !contains(target, from)) {
        tframe().clearPreview();
        tframe().showPreview($(target.cells[9]).text());
    }
},

noLecturePreviewed = function(e) {
    contains(this, e.relatedTarget || e.toElement) ||
        tframe().clearPreview();
},

resizingTimer = 0,

doResize = function(e) {
    $('#resultset').height(document.documentElement.clientHeight - 67);
};

$('#resultset').each(function() {
    if (this.offsetTop == 67) { // means ie6-7
        window.frameElement.onresize = function() {
            clearTimeout(resizingTimer);
            resizingTimer = setTimeout(doResize, 100);
        };
        doResize();
    }
});

$('body').bind('ajaxStart', function() { $(this).addClass('loading0') })
         .bind('ajaxStop', function() { $(this).removeClass('loading0') })
         .bind('ajaxError', function(e, xhr) {
                        xhr.status < 200 || $(this).addClass('error0') });

$('#resultsetlabel').click(resultsetlabelClicked);
$('#favorite').load('favorite?s=' + sid + ' .wrap');
$('#searchform').submit(searchformSubmitted);
$('#resultset').click(resultsetClicked)
               .mouseover(lecturePreviewed)
               .mouseout(noLecturePreviewed);
$('#domain').change(domainChanged);
$('#sw-remark').click(remarkToggled);
$(STATEMENT_SELECTOR).focus(showHelp).blur(hideHelp);

})();
