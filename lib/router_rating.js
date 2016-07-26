'use strict';

const util = require('util');
const Q = require('q');
const db = require('./db');

module.exports = exports = require('./router')();

const BANNERS = [];

function pickBanner() {
  var banners = BANNERS.filter(e => Date.now() < e.until);
  return banners[Math.random() * banners.length | 0];
}

const commentsCache = {};

const CACHE_JOBS = [0, 1, 2, 3, 4].map(univ => () =>
    db.q("SELECT univ|0 univ, LEFT(comment, 80) comment, UNIX_TIMESTAMP(created_at) created, lecture_id, title, lecturer FROM rating_comments INNER JOIN course ON lecture_id = course.id NATURAL LEFT JOIN nicknames WHERE univ IN (?) AND NOT FIND_IN_SET('hidden', opts) AND created_at>=CURDATE()-INTERVAL 2 DAY ORDER BY created_at DESC LIMIT 100", [univ || [1, 2, 3, 4]])
    .then(rows => commentsCache[univ] = rows)
    .fail(err => {
      if (err) {
        return util.log("couldn't update comments cache (" + err + ")");
      }
    })
);

(function updateCache() {
  return CACHE_JOBS.reduce(Q.when, Q()).finally(() => setTimeout(updateCache, 30 * 1000));
})();

exports.qget('/', req => {
  if (req.isAuthenticated()) {
    let univ = req.user.univ;
    return db.q('SELECT scenario_id, c.id, c.title, c.lecturer FROM course c INNER JOIN lectures l ON c.id = course_id INNER JOIN my_lectures m ON l.id = lecture_id WHERE student_id=?', [req.user.id]).then(rows => {
      let my_lectures = {};
      for (let row of rows) {
        let name = row.scenario_id >> 3;
        let a = my_lectures[name] || (my_lectures[name] = []);
        if (a.every(e => e.id !== row.id)) {
          a.push(row);
        }
      }
      return {
        render: 'rating_index',
        locals: {
          controller: 'rating',
          currentMenu: 'rating',
          banner: pickBanner(),
          univ,
          ratings: commentsCache[univ] || [],
          number_of_students: db.cache["s" + univ],
          top_choices: db.cache["t" + univ],
          my_lectures
        }
      };
    });
  } else {
    return {
      render: 'rating_index',
      locals: {
        controller: 'rating',
        currentMenu: 'rating',
        banner: pickBanner(),
        univ: 0,
        ratings: commentsCache[0] || [],
        top_choices: null
      }
    };
  }
});

const BLIND_LECTURERS = [];

const BLIND_TITLES = [];

exports.qget('/show/:id', req => {
  let id = req.params.id | 0;
  let locals = {
    controller: 'rating',
    currentMenu: 'rating',
    banner: pickBanner()
  };
  return Q.all([
    db.qone("SELECT id, univ, title, nickname, lecturer FROM course NATURAL LEFT JOIN nicknames WHERE id = ?", [id]),
    db.q("SELECT DISTINCT semester|0 semester, domain, credits FROM lectures WHERE course_id = ? ORDER BY semester DESC", [id]),
    db.q("SELECT a.id, a.lecturer, a.lecturer = b.lecturer self FROM course a INNER JOIN course b USING (univ, title) WHERE b.id = ? ORDER BY a.lecturer", [id]),
    db.q("SELECT a.id, a.title, a.title = b.title self FROM course a INNER JOIN course b USING (univ, lecturer) WHERE b.id = ? AND b.lecturer != '' ORDER BY a.title", [id])
  ]).then(values => {
    locals.course = values[0];
    if (!locals.course) {
      return 404;
    }
    locals.blinded = BLIND_LECTURERS.indexOf(locals.course.lecturer) >= 0 || BLIND_TITLES.indexOf(locals.course.title) >= 0;
    locals.lectures = values[1];
    locals.lectures_of_same_title = values[2];
    locals.lectures_of_same_lecturer = values[3];
    locals.page = req.query.p | 0;
    locals.comments = [];
    locals.pages = 0;
    if (locals.blinded) {
      return {
        render: 'rating_show',
        locals: locals
      };
    } else {
      let offset = 20 * locals.page;
      return Q.all([
        db.q("SELECT id, student_id, comment, UNIX_TIMESTAMP(created_at) created, FIND_IN_SET('hidden', opts) hidden, anon_id FROM rating_comments WHERE lecture_id = ? ORDER BY created_at DESC LIMIT ?,20", [id, offset]),
        db.qget('SELECT COUNT(*) FROM rating_comments WHERE lecture_id = ?', [id])
      ]).then(values => {
        locals.comments = values[0];
        locals.pages = Math.ceil(values[1] / 20);
        return {
          render: 'rating_show',
          locals: locals
        };
      });
    }
  });
});

exports.qpost('/create/:id', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let id = req.params.id | 0;
  if (id && req.user.id && /\S/.test(req.body.comment)) {
    return db.q("INSERT INTO rating_comments SELECT NULL id, ? lecture_id, ? student_id,\n? comment, NOW() created_at, '' opts, IFNULL(\n(SELECT MIN(anon_id) FROM rating_comments WHERE lecture_id=? AND student_id=?),\nIFNULL(MAX(t.anon_id),0)+1) anon_id FROM rating_comments t WHERE lecture_id=?", [id, req.user.id, req.body.comment, id, req.user.id, id]).then(() => ({
      redirect: 'back'
    }));
  } else {
    return 205;
  }
});

exports.qpost('/hideoshow', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return db.q('UPDATE rating_comments SET opts=opts^1 WHERE id=? AND (student_id=? OR ?) LIMIT 1', [req.body.id, req.user.id, req.admin]).then(() => ({
    redirect: 'back'
  }));
});

exports.qget('/search', req => {
  let univ = req.query.univ | 0;
  let keyword = req.query.keyword || '';
  let keywords = keyword.split(/\s+/);
  if (!keywords[0]) {
    return 204;
  }
  let sql = "SELECT id, title, lecturer FROM course NATURAL LEFT JOIN nicknames WHERE univ IN (?) AND (" + (keywords.map(() =>
    "(LOCATE(?,title)>0 OR nickname=? OR LOCATE(?,lecturer)>0)"
  ).join(' AND ')) + ") LIMIT 51";
  let values = [univ];
  for (let e of keywords) {
    values.push(e, e, e);
  }
  return db.q(sql, values).then(ratings => ({
    render: 'rating_search',
    locals: {
      controller: 'rating',
      currentMenu: 'rating',
      keyword: keyword,
      univ: univ,
      ratings: ratings
    }
  }));
});
