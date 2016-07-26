'use strict';

const Q = require('q');
const db = require('./db');
const semester = require('./semester');

module.exports = exports = require('./router')();

exports.qget('/:userid', req => {
  return db.qone("SELECT id,userid,univ,nickname FROM students WHERE userid = ? LIMIT 1", [req.params.userid]).then(user => {
    if (!user) {
      return 404;
    }
    var sid = semester.current[user.univ] << 3 | 1;
    var title_sql = user.nickname ? 'IFNULL(nickname,title)' : 'title';
    var join_sql = user.nickname ? ' NATURAL LEFT JOIN nicknames' : '';
    var cells = {};
    return db.q("SELECT day1,day2,day3,day4,day5,day6,day7,CONCAT(" + title_sql + ",' ',location) label FROM my_lectures INNER JOIN lectures ON lecture_id=id INNER JOIN lessons USING (id)" + join_sql + " WHERE student_id=? AND scenario_id=?", [user.id, sid]).then(lessons => {
      lessons.forEach(lesson => {
        for (let day = 1; day <= 7; day++) {
          let mask = lesson["day" + day];
          if (mask) {
            for (let time = 0; time <= 19; time++) {
              if (mask & 1 << time) {
                let name = time * 10 + day;
                (cells[name] || (cells[name] = [])).push(lesson.label);
              }
            }
          }
        }
      });
      return db.q('SELECT time*10+day code,message FROM my_events WHERE student_id=? AND scenario_id=?', [user.id, sid]);
    }).then(events => {
      events.forEach(e => {
        var name = e.code;
        (cells[name] || (cells[name] = [])).push(e.message);
      });
      var codes = Object.keys(cells);
      var days = codes.map(e => e % 10);
      return {
        expires: 60,
        render: 'x_timetable',
        locals: {
          user: user,
          sid: sid,
          cells: cells,
          first_day: Math.min.apply(Math, days),
          last_day: Math.max.apply(Math, days),
          first_time: Math.min.apply(Math, codes) / 10 | 0,
          last_time: Math.max.apply(Math, codes) / 10 | 0
        }
      };
    });
  });
});
