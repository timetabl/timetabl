'use strict';

const Q = require('q');
const db = require('./db');

const DAY = {
  '월': 0,
  '화': 1,
  '수': 2,
  '목': 3,
  '금': 4,
  '토': 5,
  '일': 6
};

function escapeRegexp(text) {
  return text.replace(/[.^$*+?|(){}[\]]/g, "\\$1");
}

module.exports = exports = function(uid, sid, cid, univ, statement, cb) {
  var credits = [];
  var location = [];
  var text = [];
  var timecode = [];
  var timecodeex = [];
  var timecodeas = [];
  var year = 0;
  var q = ['semester=?', 'univ=?'];
  var p = [sid, univ];

  function step1() {
    statement.toUpperCase().split(/\s+/).filter(Boolean).forEach(e => {
      var m;
      if (e[0] === '$') {
        credits.push(e.substring(1));
      } else if (e[0] === '@') {
        location.push(e.substring(1));
      } else if (e === '1학년') {
        year |= 1;
      } else if (e === '2학년') {
        year |= 2;
      } else if (e === '3학년') {
        year |= 4;
      } else if (e === '4학년') {
        year |= 8;
      } else if (e !== '수화' && (m = /^([-+]?)(?:[월화수목금토일]+(?:\d+(?:-\d+)?)?)+$/.exec(e))) {
        let x;
        switch (m[1]) {
          case '-':
            x = timecodeex;
            break;
          case '+':
            x = timecodeas;
            break;
          default:
            x = timecode;
        }
        x.push(0, 0, 0, 0, 0, 0, 0);
        x.length = 7;
        const RE = /([월화수목금토일]+)(?:(\d+)(?:-(\d+))?)?/g;
        let results1 = [];
        while (m = RE.exec(e)) {
          results1.push(m[1].split('').forEach(d => {
            d = DAY[d];
            if (m[2] != null) {
              if (m[3] != null) {
                x[d] |= (2 << m[3]) - (1 << m[2]);
              } else {
                if (/^(?:[2-9]|1\d){2,}$/.test(m[2])) {
                  m[2].match(/[2-9]|1\d/g).forEach(j => x[d] |= 1 << j);
                } else {
                  x[d] |= 1 << m[2];
                }
              }
            } else {
              x[d] |= 0x7FFFFFFF;
            }
          }));
        }
        results1;
      } else {
        text.push.apply(text, e.match(/[0-9A-Za-z가-힣]+/g));
      }
    });
    if (credits.length) {
      q.push('credits IN (?)');
      p.push(credits);
    }
    if (location.length) {
      q.push("location_txt!=''");
      q.push("EXISTS (SELECT * FROM lessons WHERE id=lectures.id AND location REGEXP ?)");
      p.push('^(' + location.map(escapeRegexp).join('|') + ')');
    }
    if (year) {
      q.push('year&?');
      p.push(year);
    }
    if (text.length === 1) {
      db.get('SELECT title FROM nicknames WHERE nickname=?', [text[0]], (err, title) => {
        if (err) {
          cb(err);
        }
        if (title) {
          q.push("(title=? OR INSTR(litid,?)=1 OR INSTR(domain,?) OR INSTR(title,?) OR INSTR(lecturer,?) OR INSTR(remark,?))");
          p.push(title, text[0] + "-", text[0], text[0], text[0], text[0]);
          step2();
        } else {
          step1a();
        }
      });
    } else {
      step1a();
    }
  }

  function step1a() {
    text.forEach(e => {
      q.push("(INSTR(litid,?)=1 OR INSTR(domain,?) OR INSTR(title,?) OR INSTR(lecturer,?) OR INSTR(remark,?))");
      p.push(e + "-", e, e, e, e);
    });
    step2();
  }

  function step2() {
    if (timecode.length) {
      q.push("time_txt!=''", "NOT EXISTS (SELECT * FROM lessons WHERE id=lectures.id AND (day1&~? OR day2&~? OR day3&~? OR day4&~? OR day5&~? OR day6&~? OR day7&~?))");
      p.push.apply(p, timecode);
    }
    if (cid) {
      db.all('SELECT day1,day2,day3,day4,day5,day6,day7 FROM lessons INNER JOIN my_lectures ON id=lecture_id WHERE student_id=? AND scenario_id=?<<3|?', [uid, sid, cid], (err, a) => {
        if (err) {
          cb(err);
        }
        timecodeex.push(0, 0, 0, 0, 0, 0, 0);
        timecodeex.length = 7;
        a.forEach(i => {
          var results1 = [];
          for (let j = 1, k = 1; k <= 7; j = ++k) {
            results1.push(timecodeex[j - 1] |= i["day" + j]);
          }
          results1;
        });
        step3();
      });
    } else {
      step3();
    }
  }

  function step3() {
    if (timecodeas.length) {
      q.push("time_txt!=''", "EXISTS (SELECT * FROM lessons WHERE id=lectures.id AND (day1&? OR day2&? OR day3&? OR day4&? OR day5&? OR day6&? OR day7&?))");
      p.push.apply(p, timecodeas);
    }
    if (timecodeex.length) {
      q.push("time_txt!=''", "NOT EXISTS (SELECT * FROM lessons WHERE id=lectures.id AND (day1&? OR day2&? OR day3&? OR day4&? OR day5&? OR day6&? OR day7&?))");
      p.push.apply(p, timecodeex);
    }
    q = q.join(' AND ');
    q = "SELECT id,litid,domain,year|0 year,title,nickname,lecturer,credits,location_txt,time_txt,remark,competitors,course_id FROM lectures NATURAL LEFT JOIN nicknames WHERE " + q + " ORDER BY litid LIMIT 101";
    Q.all([p.length > 2 ? db.q(q, p) : [], db.q('SELECT lecture_id id FROM my_lectures WHERE student_id=? AND scenario_id=?<<3 LIMIT 100', [uid, sid]), db.qget('SELECT nickname FROM students WHERE id=? LIMIT 1', [uid])]).then(results => {
      var list = results[0], favorites = results[1], wantNickname = results[2];
      var favorite = {};
      favorites.forEach(e => favorite[e.id] = true);
      cb(null, {
        list,
        favorite,
        wantNickname
      });
    }).fail(cb);
  }

  step1();
};

exports.q = Q.nfbind(exports);
