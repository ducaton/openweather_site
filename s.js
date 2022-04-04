const express = require('express');
const app = express();
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const cookieParser = require('cookie-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var db = new sqlite3.Database('./users.db');

app.use(cookieParser());
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 10 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session('session'));
app.use(express.json());
//Client's HTML+CSS+JS
app.use(express.static("public"));
//Запись логов: Дата URL Статус-код ответа
app.use((req, res, next)=> {
  pDate = new Date
  next()
  fs.appendFileSync('log.txt', pDate.toLocaleString()+' '+req.method+' '+req.url+' '+res.statusCode+' '+'\n','utf-8')
})

passport.use(new LocalStrategy({
    usernameField: 'uname',
    passwordField: 'pwd'
  }, function(username, password, done) {
    db.get('SELECT salt FROM users WHERE username = ?', username, function(err, salt) {
      if (!salt) return done(null, false);
      crypto.pbkdf2(password, salt.salt, 310000, 32, 'sha256', function(err, hash) {
        db.get('SELECT id, username FROM users WHERE username = ? AND password = ?', username, hash, function(err, row) {
          if (!row) return done(null, false);
          let user = {
            id: row.id.toString(),
            username: row.username
          }
          return done(null, user);
        });
      });
    });
}));

passport.serializeUser(function(user, done) {
  return done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  db.get('SELECT users.id, users.username, users.id_units_temperature, cities.city AS current_city FROM users LEFT JOIN cities ON cities.id = users.id_current_city WHERE users.id = ?', id, function(err, user) {
    if (!user) return done(null, false);
    return done(null, user);
  });
});

app.post('/register', function (req, res) {
  //Надо бы валидации добавить...
  if (req.body.uname == '' || req.body.pwd == '') {
    res.status(400)
    res.send({
      cod:'400',
      message:'Вы не указали имя пользователя или пароль'
    })
    return
  }
  let salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.pwd, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)', [
      req.body.uname,
      hashedPassword,
      salt,
    ], function(err) {
      if (err) { 
        res.status(400)
        res.send({
          cod:'400',
          message:'Имя пользователя занято'
        })
        return
      }
      var user = {
        id: this.lastID.toString(),
        username: req.body.uname
      };
      req.login(user, function(err) {
        if (err) { return next(err); }
      });
    });
  });
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { 
      res.status(401)
      res.send({
        cod:'401',
        message:'Неверное сочетание имени пользователя и пароля'
      })
      return
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      res.status(200);
      //Иначе firefox ругается
      res.setHeader('Content-Type', 'text/plain');
      res.send();
      return
    });
  })(req, res, next);
});

app.post('/fav_cities', function (req, res) {
  //Надо бы валидации добавить...
  if (req.user == undefined) {
    res.status(401)
    res.send({
      cod:'401',
      message:'Вы неавторизованы'
    })
    return
  }
  db.run('INSERT INTO cities (city) VALUES (?)', [
    req.body.city,
  ], function(err) {
      //Не добавилось? Скорее всего уже есть
    }
  );
  db.run('INSERT INTO fav_cities (id_users, id_cities) VALUES (?, (SELECT id FROM cities WHERE city = ?))', [
    req.user.id,
    req.body.city,
  ], function(err) {
      if (err) {
        res.status(400)
        res.send({
          cod:'400',
          message:':)'
        })
      }
    }
  );
  res.status(200);
  //Иначе firefox ругается
  res.setHeader('Content-Type', 'text/plain');
  res.send();
});

app.put('/temp_unit', function(req, res) {
  if (req.user == undefined) {
    res.status(401)
    res.send({
      cod:'401',
      message:'Вы неавторизованы'
    })
    return
  }
  db.run('UPDATE users SET id_units_temperature = ? WHERE id = ?', req.body.unit, req.user.id, function(err) {
    if (err) {
      res.status(400)
      res.send({
        cod:'400',
        message:':)'
      })
      return
    }
  })
});

app.put('/current_city', function(req, res) {
  if (req.user == undefined) {
    res.status(200)
    res.send({
      cod:'200',
      message:'Вы неавторизованы'
    })
    return
  }
  db.run('INSERT INTO cities (city) VALUES (?)', [
    req.body.city,
  ], function(err) {
      //Не добавилось? Скорее всего уже есть
    }
  );
  db.run('UPDATE users SET id_current_city = (SELECT id FROM cities WHERE city = ?) WHERE id = ?', req.body.city, req.user.id, function(err) {
    if (err) {
      res.status(400)
      res.send({
        cod:'400',
        message:':)'
      })
      return
    }
  })
});

app.delete('/fav_cities', function (req, res) {
  if (req.user == undefined) {
    res.status(401)
    res.send({
      cod:'401',
      message:'Вы неавторизованы'
    })
    return
  }
  db.run('DELETE FROM fav_cities WHERE id = ? AND id_users = ?', [
    req.body.id,
    req.user.id,
  ]);
  res.status(200);
  //Иначе firefox ругается
  res.setHeader('Content-Type', 'text/plain');
  res.send();
});

app.get('/logout', function(req, res) {
  req.logout();
  res.status(200);
  //Иначе firefox ругается
  res.setHeader('Content-Type', 'text/plain');
  res.send({
    cod:'200',
    message:''
  });
});

app.get('/users', function(req, res) {
  res.status(200);
  res.send({
    user: req.user
  });
});

app.get('/fav_cities', function(req, res) {
  if (!(req.user)) {
    res.status(200);
    res.send(null);
    return
  }
  db.all('SELECT fav_cities.id, cities.city FROM fav_cities LEFT JOIN cities ON cities.id = fav_cities.id_cities WHERE fav_cities.id_users = ?', req.user.id, function(err, cities) {
    if (err) { 
      res.status(400)
      res.send({
        cod:'400',
        message:':)'
      })
      return
    }
    res.status(200);
    res.send(cities);
  })
});

app.listen(3000);
