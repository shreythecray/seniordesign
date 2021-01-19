var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var uuid = require('uuid');
const db = require('./db');
const bcrypt = require('bcrypt');
var bodyParser = require('body-parser');

var sitesRouter = require('./routes/sites');
var stageRouter = require('./routes/stages');
var recRouter = require('./routes/recommendations');
var newpapersRouter = require('./routes/newpapers');
var signupRouter = require('./routes/signup');
var addRatingRouter = require('./routes/addRating');
var ratedpapersRouter = require('./routes/ratedpapers');
var getRatingRouter = require('./routes/getRating');
var updateRatingRouter = require('./routes/updateRating');
var runModelRouter = require('./routes/runModel');
var favePaperRouter = require('./routes/favePaper');
var getFavesRouter = require('./routes/getFaves');
var unfavePaperRouter = require('./routes/unfavePaper');
var generateResetRouter = require('./routes/generateReset');
var validateResetRouter = require('./routes/validateReset');
var submitResetRouter = require('./routes/submitReset');
var suggestPaperRouter = require('./routes/suggestPaper');
var queryRunningRouter = require('./routes/queryRunning');


// BEGIN authentication login
// see passport.js docs for help
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  (email, password, done) => {
    // check if user exists
    db.query(`SELECT * FROM users WHERE email = '${email}'`, (err, resp) => {
      if (err) console.error(err);
      // user does not exist
      if (resp.rows.length == 0) {
        return done(null, false);
      }
      // user exists, compare hashed passwordd
      else {
        bcrypt.compare(password, resp.rows[0].password, (err, res) => {
          // pw match
          if (res == true) {
            return done(null, resp.rows[0]);
          }
          // pw no match
          else {
            return done(null, false);
          }
        })
      }
    })
  }
));

passport.serializeUser((user, done) => {
  done(null, {email: user.email, id: user.id});
});

passport.deserializeUser((user, done) => {
  done(null, {email: user.email, id: user.id});
});
// END authentication logic

// BEGIN express boilerplate
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', true);

app.use(session({
  genid: (req) => {
    return uuid();
  },
  store: new FileStore(),
  secret: 'test',
  resave: false,
  rolling: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600000
  }
}));
app.use(passport.initialize());
app.use(passport.session());
// END express boilerplate

// declare routes
app.use('/sites', sitesRouter);
app.use('/stages', stageRouter);
app.use('/recs', recRouter);
app.use('/newpapers', newpapersRouter);
app.use('/ratedpapers', ratedpapersRouter);
app.use('/auth/signup', signupRouter);
app.use('/addRating', addRatingRouter);
app.use('/getRating', getRatingRouter);
app.use('/updateRating', updateRatingRouter);
app.use('/runModel', runModelRouter);
app.use('/favePaper', favePaperRouter);
app.use('/getFaves', getFavesRouter);
app.use('/unfavePaper', unfavePaperRouter);
app.use('/generateReset', generateResetRouter);
app.use('/validateReset', validateResetRouter);
app.use('/submitReset', submitResetRouter);
app.use('/suggestPaper', suggestPaperRouter);
app.use('/queryRunning', queryRunningRouter);

// BEGIN authentication routes
// these must be in app.js instead of routes/ (I could not get it to work in routes/)
// see passport.js docs for help
app.post('/auth/login', passport.authenticate('local'), (req, res) => {
  res.sendStatus(200);
});

app.get('/auth/getUser', (req, res) => {
  if (req.user === undefined) res.sendStatus(204);
  else res.send(req.user);
})

app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('/');
})
// END authentication routes

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
