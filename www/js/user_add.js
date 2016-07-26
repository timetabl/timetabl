function doFill(e) {
    e.focus();
    e.style.backgroundColor = 'yellow';
    e.onblur = function() {
        this.style.backgroundColor = '';
        this.onblur = null;
    }        
    return false;
}

function warn(s) {
    alert(s);
    return false;
}

onload = function() {
    var f = document.forms[0];
    f.elements[0].focus();
    f.onsubmit = check;
}

function check() {
    var f = document.forms[0].elements;
    if (!f.userid.value)
        return doFill(f.userid);
    if (!f.passwd.value)
        return doFill(f.passwd);
    if (f.passwd.value != f.passwd2.value)
        return doFill(f.passwd2);
    if (!/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(f.email.value))
        return doFill(f.email);
    for (var i = 0; i < f.univ.length; ++i)
        if (f.univ[i].checked)
            return true;
    return warn('학교를 선택하셔요.');
}
