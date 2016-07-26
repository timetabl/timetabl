'use strict';

const util = require('util');
const fs = require('fs');
const path = require('path');

exports.buildPrefix = () => {
  var error;
  try {
    return '/' + fs.readFileSync(path.join(__dirname, 'revision'));
  } catch (error) {
    return '';
  }
}();

function _00(number) {
  return ("0" + number).slice(-2);
}

var TODAY = null;
var YESTERDAY = null;
var TWODAYSAGO = null;
var THISYEAR = null;
var LASTYEAR = null;

function updateDates() {
  var now = new Date;
  util.log('update dates');
  exports.YEAR = now.getFullYear();
  exports.thisSemester = now.getFullYear() - 2007 << 1 | now.getMonth() / 6;
  TODAY = new Date().setHours(0, 0, 0, 0);
  YESTERDAY = TODAY - 86400000;
  TWODAYSAGO = YESTERDAY - 86400000;
  THISYEAR = new Date(TODAY).setMonth(0, 1);
  LASTYEAR = new Date(TODAY).setMonth(-12, 1);
  setTimeout(updateDates, new Date().setHours(24, 0, 0, 0) - now);
}

updateDates();

exports.date2shortText = date => {
  var time = Date.now() - date;
  if (time < 30 * 1000) {
    return '방금';
  } else if (time < 59 * 60 * 1000) {
    return (Math.ceil(time / 60000)) + "분 전";
  } else {
    if (!util.isDate(date)) {
      date = new Date(date);
    }
    return (date.getFullYear() < exports.YEAR ? "'" + (_00(date.getFullYear() % 100)) + " " : "") + ((date.getMonth() + 1) + "/" + (date.getDate()) + " " + (_00(date.getHours())) + ":" + (_00(date.getMinutes())));
  }
};

const UNIV_PATTERNS = {
  0: /^holies$/,
  1: /[서숴쏘]강|sog|스으강|소강|알바트로스|西江/i,
  2: /연[대세희법돌공]|욘세|yon|ys|세순|아카라카|연고전|매지|원세|延世|여언세|세브란스/i,
  4: /이[대화법]|[화퐈]연|화[여욘]|리화|배꽃|ewh|梨花|슈네바렌/i,
  5: /홍[익대]/i,
  98: /고[려대법공경]|보성|안암|高大|입실렌티|고연전/i,
  99: /서울대|경성제국대|설대|snu|샤대/i
};

exports.detectUniv = text => {
  var result = '';
  var minIndex = Infinity;
  for (let key in UNIV_PATTERNS) {
    let pattern = UNIV_PATTERNS[key];
    let index = text.search(pattern);
    if (index >= 0 && index < minIndex) {
      result = key;
      minIndex = index;
    }
  }
  return result;
};

exports.numberFormat = number => {
  return String(number).replace(/(\d)(?=(?:\d{3})+\b)/g, "$1,");
};

exports.semesterName = id => {
  return 2007 + (id >> 1) + '년 ' + (id % 2 === 0 ? '봄' : '가을');
};

exports.formatDate = date => {
  var timestamp = +date;
  var now = Date.now();
  if (now - timestamp < 30 * 60 * 1000) {
    return '조금 전';
  } else if (now - timestamp < 6 * 60 * 60 * 1000) {
    return '몇 시간 전';
  } else if (timestamp >= TODAY) {
    return '오늘';
  } else if (timestamp >= YESTERDAY) {
    return '어제';
  } else if (timestamp >= TWODAYSAGO) {
    return '그제';
  } else {
    if (!util.isDate(date)) {
      date = new Date(date);
    }
    if (timestamp >= THISYEAR) {
      return (date.getMonth() + 1) + '/' + date.getDate();
    } else if (timestamp >= LASTYEAR) {
      return '작년 ' + (date.getMonth() + 1) + '/' + date.getDate();
    } else {
      return "'" + String(date.getFullYear()).slice(-2) + ' ' + (date.getMonth() + 1) + '/' + date.getDate();
    }
  }
};

exports.shortUnivName = univ => ['', '서강', '연세(신촌)', '연세(원주)', '이화'][univ];

exports.univName = univ => ['', '서강대학', '연희전문학교(신촌)', '연희전문학교(매지리)', '이화학당'][univ];

exports.univCurriculumURL = univ => ['', 'http://sis109.sogang.ac.kr/sap/bc/webdynpro/sap/zcmw9016?sap-language=KO', 'http://ysweb.yonsei.ac.kr:8888/curri120601/curri_new.jsp', 'http://uis.yonsei.ac.kr:8000/pls/red/ec_list_mod.list', 'http://eureka.ewha.ac.kr/eureka/hs/sg/openHssg504021q.do?popupYn=Y'][univ];

exports.trimmed = text => text.trim().replace(/(?:[ \t]*\n){3,}/g, '\n\n');

exports.univs = [1, 2, 3, 4];

exports.period2time = {
  1: time => 450 + time * 90,
  2: time => 480 + time * 60,
  3: time => 480 + time * 60,
  4: time => 390 + time * 90
};

exports.maxPeriod = {
  1: 7,
  2: 16,
  3: 12,
  4: 8
};

exports.range = (start, end) => {
  let results = [];
  for (let i = start; start <= end ? i <= end : i >= end; start <= end ? i++ : i--) {
    results.push(i);
  }
  return results;
};

exports.hasPlan = {
  4: true
};

exports.shorten = (s, n) => s.length <= n ? s : s.slice(0, n - 1) + '…';
