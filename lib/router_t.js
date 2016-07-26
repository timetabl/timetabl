'use strict';

const Q = require('q');
const sprintf = require('extsprintf').sprintf;
const db = require('./db');
const semester = require('./semester');
const search = require('./search');
const locals = require('./locals');

module.exports = exports = require('./router')();

exports.qget('/', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let sid = parseInt(req.query.s) || semester.current[req.user.univ];
  return {
    render: 't_index',
    locals: {
      sid: sid
    }
  };
});

exports.qget('/edit', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return {
    render: 't_edit',
    locals: {
      controller: 't',
      currentMenu: 'timetable2',
      semester: req.query.s,
      semesters: semester.current[req.user.univ]
    }
  };
});

exports.qget('/i/:id', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let id = parseInt(req.params.id);
  return db.qone('SELECT univ|0 univ,semester|0 semester,litid,title FROM lectures WHERE id=? LIMIT 1', [id]).then(row => {
    if (!row) {
      return 404;
    }
    switch (row.univ) {
      case 4:
        let url = sprintf('http://was1.ewha.ac.kr:8320/epas/epas_ssg/ssg_s4004q.jsp?HELP_TASK_ID=-1&G2=%s%s0&G1=20&G3=%s&G4=%s', 2007 + (row.semester >> 1), 1 + (row.semester & 1), row.litid.slice(0, 5), row.litid.slice(6, 2));
        return {
          redirect: url
        };
      default:
        return 404;
    }
  });
});

exports.qget('/data', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return 't_data';
});

exports.qpost('/search', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return search.q(req.user.id, parseInt(req.body.sid), parseInt(req.body.cid), req.user.univ, req.body.statement).then(results => ({
    render: 't_resultset',
    locals: {
      list: results.list,
      favorite: results.favorite,
      wantNickname: results.wantNickname
    }
  }));
});

exports.qget('/favorite', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return Q.all([
    db.q('SELECT id,univ,litid,domain,year|0 year,title,nickname,lecturer,credits,location_txt,time_txt,remark,competitors,course_id FROM my_lectures INNER JOIN lectures ON lecture_id=id NATURAL LEFT JOIN nicknames WHERE student_id=? AND scenario_id=?<<3 LIMIT 100', [req.user.id, req.query.s]),
    db.qget('SELECT nickname FROM students WHERE id=? LIMIT 1', [req.user.id])
  ]).then(results => {
    let favorite = {};
    for (let e of results[0]) {
      favorite[e.id] = true;
    }
    return {
      render: 't_resultset',
      locals: {
        list: results[0],
        favorite: favorite,
        wantNickname: results[1]
      }
    };
  });
});

exports.qget('/prefs', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return db.qone('SELECT nickname,location,lecturer,hideempty FROM students WHERE id=? LIMIT 1', [req.user.id]).then(row => {
    if (!row) {
      return 404;
    }
    for (let k in row) {
      let v = row[k];
      row[k] = Boolean(v);
    }
    return {
      json: {
        prefs: row,
        univ: {
          THIS_SEMESTER: semester.current[req.user.univ]
        }
      }
    };
  });
});

exports.qpost('/pref', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let key = ['nickname', 'location', 'lecturer', 'hideempty'].find(e => e in req.body);
  if (!key) {
    return 400;
  }
  db.q("UPDATE students SET " + key + "=? WHERE id=? LIMIT 1", [req.body[key], req.user.id]);
  return 204;
});

function hashLessons(lessons) {
  let result = {};
  lessons.forEach(i => {
    for (let d = 1; d <= 7; d++) {
      let v = i["day" + d];
      for (let t = 0; t <= 19; t++) {
        if (v & 1 << t) {
          let name = i.id;
          (result[name] || (result[name] = {}))[t * 10 + d] = i.location;
        }
      }
    }
  });
  return result;
}

exports.qget('/lectures', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let sid = parseInt(req.query.sid);
  let cid = parseInt(req.query.cid);
  let lectures = null;
  let lessons = null;
  return db.q('SELECT id,litid,title,nickname,lecturer,credits FROM my_lectures INNER JOIN lectures ON lecture_id=id NATURAL LEFT JOIN nicknames WHERE student_id=? AND scenario_id=?<<3|?', [req.user.id, sid, cid]).then(rows => {
    for (let e of rows) {
      e.credits -= 0;
    }
    lectures = rows;
    if (rows[0]) {
      return db.q('SELECT id,day1,day2,day3,day4,day5,day6,day7,location FROM lessons WHERE id IN (?)', [
        rows.map(e => e.id)
      ]);
    } else {
      return [];
    }
  }).then(rows => {
    lessons = hashLessons(rows);
    return db.q('SELECT time*10+day code,message FROM my_events WHERE student_id=? AND scenario_id=?<<3|?', [req.user.id, sid, cid]);
  }).then(events => ({
    json: {
      semester_name: locals.semesterName(sid),
      sid,
      cid,
      lectures,
      lessons,
      events
    }
  }));
});

exports.qpost('/addLecture', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let sid = parseInt(req.body.sid);
  let cid = parseInt(req.body.cid);
  let lid = parseInt(req.body.lid);
  let output = {};
  return db.q("INSERT IGNORE INTO my_lectures SELECT ? student_id, semester<<3|? scenario_id, id lid FROM lectures WHERE id=? AND semester|0=? LIMIT 1", [req.user.id, cid, lid, sid]).then(result => {
    if (result.affectedRows === 0) {
      return {
        json: output
      };
    }
    return db.qone('SELECT id,litid,title,nickname,lecturer,credits FROM lectures NATURAL LEFT JOIN nicknames WHERE id=?', [lid]).then(row => {
      if (!row) {
        throw Error();
      }
      row.credits -= 0;
      return output.lecture = row;
    })
    .then(() => db.q('SELECT id,day1,day2,day3,day4,day5,day6,day7,location FROM lessons WHERE id=?', [lid]))
    .then(rows => {
      output.lessons = hashLessons(rows);
      return {
        json: output
      };
    });
  });
});

exports.qpost('/removeLecture', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let sid = parseInt(req.body.sid);
  let cid = parseInt(req.body.cid);
  let lid = parseInt(req.body.lid);
  return db.q('DELETE FROM my_lectures WHERE student_id=? AND scenario_id=?<<3|? AND lecture_id=?', [req.user.id, sid, cid, lid]).then(() => ({ json: {} }));
});

exports.qpost('/memo', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let sid = parseInt(req.body.sid);
  let cid = parseInt(req.body.cid);
  let code = parseInt(req.body.code);
  let txt = String(req.body.txt).trim();
  let q = /\S/.test(txt) ? db.q('REPLACE my_events (student_id,scenario_id,day,time,message) VALUES(?)', [[req.user.id, sid << 3 | cid, code % 10, code / 10 | 0, txt]]) : db.q('DELETE FROM my_events WHERE student_id=? AND scenario_id=?<<3|? AND time*10+day=?', [req.user.id, sid, cid, code]);
  return q.thenResolve(204);
});

exports.qpost('/copy', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let sid = parseInt(req.body.sid);
  let cid = parseInt(req.body.cid);
  let cid_from = parseInt(req.body.cid_from);
  return Q.all([
    db.q('INSERT IGNORE INTO my_lectures SELECT student_id,?<<3|? scenario_id,lecture_id FROM my_lectures WHERE student_id=? AND scenario_id=?<<3|?', [sid, cid, req.user.id, sid, cid_from]),
    db.q("INSERT INTO my_events SELECT student_id,?<<3|? scenario_id,day,time,message FROM my_events a WHERE student_id=? AND scenario_id=?<<3|? ON DUPLICATE KEY UPDATE message=CONCAT(VALUES(message),'\\n',a.message)", [sid, cid, req.user.id, sid, cid_from])
  ]).thenResolve(204);
});

exports.qpost('/empty0', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let sid = parseInt(req.body.sid);
  let cid = parseInt(req.body.cid);
  return Q.all([
    db.q('DELETE FROM my_lectures WHERE student_id=? AND scenario_id=?<<3|?', [req.user.id, sid, cid]),
    db.q('DELETE FROM my_events WHERE student_id=? AND scenario_id=?<<3|?', [req.user.id, sid, cid])
  ]).thenResolve(204);
});
