'use strict';

const crypto = require('crypto');
const passport = require('passport');
const Q = require('q');
const db = require('./db');
const mail = require('./mail');
const passwords = require('./passwords');

module.exports = exports = require('./router')();

exports.post('/login', (req, res, next) => {
  function handler(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).render('error', {
        message: '누구세요? O_O'
      });
    }
    return req.login(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect(303, 'back');
    });
  }
  return passport.authenticate('local', handler)(req, res, next);
});

exports.qget('/logout', req => {
  req.logout();
  req.session = null;
  return {
    redirect: '/'
  };
});

const SCHOOLS = [
  {
    img: 'yonsei',
    name: '연희전문학교',
    remark: '신촌',
    value: '2'
  }, {
    img: 'ewha',
    name: '이화학당',
    remark: '',
    value: '4'
  }, {
    img: 'sogang',
    name: '서강고등학교',
    remark: '',
    value: '1'
  }, {
    img: 'yonsei',
    name: '연희전문학교',
    remark: '원주',
    value: '3'
  }
];

exports.qget('/add', () => ({
  render: 'user_add',
  locals: {
    controller: 'user',
    SCHOOLS: SCHOOLS
  }
}));

exports.qpost('/add', req => {
  let userid = req.body.userid;
  let passwd = req.body.passwd;
  let email = req.body.email;
  let univ = parseInt(req.body.univ);
  let message = null;
  if (!/^\S{3,16}$/.test(userid)) {
    message = '아이디는 세 글자 이상, 열여섯 글자 이하여야 해요.';
  }
  if (passwd.length < 6) {
    message = '암호는 여섯 글자 이상이어야 해요.';
  }
  if (passwd !== req.body.passwd2) {
    message = '입력한 두 암호가 서로 달라요.';
  }
  if ([1, 2, 3, 4].indexOf(univ) < 0) {
    message = '학교를 선택하셔야죠.';
  }
  if (message) {
    return {
      status: 400,
      render: 'error',
      locals: {
        message: message
      }
    };
  }
  return db.q('INSERT INTO students (userid,passwd,email,univ,created,mute_till,last_access) VALUES (?,?,?,?,NOW(),NOW()+INTERVAL 1 WEEK,NOW())', [userid, passwords.hash(passwd), email, univ]).then(() => ({
    status: 201,
    render: 'error',
    locals: {
      message: '가입되었어요. 이제 로그인 해주세요.',
      next: '/'
    }
  })).fail(() => ({
    status: 409,
    render: 'error',
    locals: {
      message: '이미 사용중인 아이디예염.'
    }
  }));
});

exports.qget('/edit', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return db.qone('SELECT userid, email FROM students WHERE id = ? LIMIT 1', [req.user.id]).then(row => ({
    render: 'user_edit',
    locals: row
  }));
});

exports.qpost('/update', req => {
  var email, passwd, userid;
  if (!req.isAuthenticated()) {
    return 401;
  }
  if (userid = req.body.userid) {
    if (!/^\S{3,16}$/.test(userid)) {
      return {
        status: 400,
        render: 'error',
        locals: {
          message: '이런 아이디 인정 못 해.'
        }
      };
    }
    return db.q('UPDATE students SET userid=? WHERE id=? LIMIT 1', [userid, req.user.id]).then(result => {
      if (result.affectedRows === 0) {
        return {
          status: 409,
          render: 'error',
          locals: {
            message: "누가 " + userid + " 쓰고 있당."
          }
        };
      } else {
        return {
          render: 'error',
          locals: {
            message: '변경됐어요.'
          }
        };
      }
    }).fail(() => ({
      status: 409,
      render: 'error',
      locals: {
        message: "누가 " + userid + " 쓰고 있당."
      }
    }));
  } else if (passwd = req.body.passwd) {
    if (passwd.length < 6) {
      return {
        status: 400,
        render: 'error',
        locals: {
          message: '암호는 여섯 글자 이상으로 제한됩니다.'
        }
      };
    }
    if (passwd !== req.body.passwd2) {
      return {
        status: 400,
        render: 'error',
        locals: {
          message: '입력한 두 암호가 서로 다릅니다.'
        }
      };
    }
    passwd = passwords.hash(passwd);
    return db.q('UPDATE students SET passwd=? WHERE id=? LIMIT 1', [passwd, req.user.id]).thenResolve({
      render: 'error',
      locals: {
        message: '변경됐어요.'
      }
    });
  } else if (email = req.body.email) {
    return db.q('UPDATE students SET email=? WHERE id=? LIMIT 1', [email, req.user.id]).thenResolve({
      render: 'error',
      locals: {
        message: '변경됐어요.'
      }
    });
  }
});

exports.qpost('/delete', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  if (req.body.sure) {
    db.q("UPDATE students SET userid=CONCAT('#',id) WHERE id=? LIMIT 1", [req.user.id]);
    req.logout();
    return {
      render: 'error',
      locals: {
        message: '잘 가요.'
      }
    };
  } else {
    return 205;
  }
});

exports.qget('/lost', () => ({
  render: 'user_lost',
  locals: {
    controller: 'user'
  }
}));

exports.qpost('/lost', req => {
  let user = null;
  let passwd = null;
  return db.qone('SELECT id, userid, email FROM students WHERE userid=? AND email!="" AND email=? LIMIT 1', [req.body.userid, req.body.email]).then(user => {
    if (!user) {
      return {
        render: 'error',
        locals: {
          message: '그런 사람 없네.'
        }
      };
    }
    passwd = crypto.pseudoRandomBytes(15).toString('base64').replace(/\W+/g, '');
    return db.q('UPDATE students SET passwd=? WHERE id=? LIMIT 1', [passwords.hash(passwd), user.id]).then(result =>
      mail.qsend(user.userid + " <" + user.email + ">", '타임테이블에서 알려드립니다.', user.userid + " 님의 암호가 “" + passwd + "”로 변경되었습니다.")
    ).then(() => ({
      render: 'error',
      locals: {
        message: user.email + "로 이메일 보냈어요."
      }
    }));
  });
});

exports.qpost('/mute', req => {
  if (req.user.userid !== 'holies') {
    return 403;
  }
  return db.q("UPDATE students SET mute_till = NOW() + INTERVAL 1 WEEK WHERE id = ?", [req.body.id]).thenResolve({
    json: 'ok'
  }).fail(() => ({
    json: {
      error: err
    }
  }));
});

exports.qpost('/release', req => {
  if (req.user.userid !== 'holies') {
    return 403;
  }
  return db.q("UPDATE students SET mute_till = NULL WHERE id = ?", [req.body.id]).thenResolve({
    json: 'ok'
  }).fail(() => ({
    json: {
      error: err
    }
  }));
});
