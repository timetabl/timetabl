'use strict';

const Q = require('q');
const semester = require('./semester');
const db = require('./db');

module.exports = exports = require('./router')();

exports.qget('/', req => ({
  render: 'system_index',
  locals: {
    count: db.cache.s0
  }
}));

const TASKS = [
  () => db.q("REPLACE INTO kv (k,v) SELECT CONCAT('s',IFNULL(univ,0)) k,FORMAT(COUNT(*),0) v FROM students WHERE last_access>CURRENT_DATE-INTERVAL 6 MONTH AND univ BETWEEN 1 AND 4 GROUP BY univ WITH ROLLUP"),
  () => db.q('UPDATE lectures SET competitors = (SELECT COUNT(DISTINCT student_id) FROM my_lectures WHERE lecture_id = id)')
].concat([1, 2, 3, 4].map(univ => () =>
    db.q("SELECT course_id, competitors, lecturer, nickname, title FROM lectures NATURAL LEFT JOIN nicknames WHERE univ=? AND semester=? ORDER BY competitors DESC LIMIT 50", [univ, semester.current[univ]]).then(rows => {
      var html = rows.map(e =>
        ("<li><a href=show/" + e.course_id + "><em>" + (e.competitors || 0) + "</em> ") + (e.lecturer + " <strong>" + (e.nickname || e.title) + "</strong></a>")
      ).join('');
      return db.query("REPLACE INTO kv (k,v) VALUES (?,?)", ["t" + univ, html]);
    })
));

exports.qget('/batch', () => TASKS.reduce(Q.when, Q()).thenResolve(204));
