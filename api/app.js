const logger = require('pino')()
const app = require('express')()
const Sentry = require('@sentry/node')
Sentry.init({ dsn: process.env.SENTRY_DSN })
const passport = require('passport')
const session = require('express-session')
const TwitterStrategy = require('passport-twitter').Strategy
const GithubStrategy = require('passport-github').Strategy
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const MongoStore = require('connect-mongo')(session)
const UserInfo = require('./modules/UserInfo')
const User = require('./models/User')
const Event = require('./models/Event')
const middlewares = require('./middlewares')
const hasActiveSubscription = user => user && user.subscription && user.subscription.status === 'active'

app.set('trust proxy', 1)
app.use(...middlewares)

if (process.env.USE_AUTH || process.env.NODE_ENV === 'production') {
  const redirectRoutes = { failureRedirect: process.env.BASE_URL, successRedirect: process.env.BASE_URL }
  logger.info('using auth', { redirectRoutes })
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'foo',
    cookie: {
      domain: process.env.NODE_ENV === 'production' ? '.pomodoro.cc' : 'localhost',
      sameSite: false
    },
    store: new MongoStore({
      collection: 'sessions',
      url: process.env.MONGO_URL
    })
  }))

  app.use(passport.initialize())
  app.use(passport.session())
  passport.serializeUser(function (user, done) {
    done(null, user)
  })

  passport.deserializeUser(function (user, done) {
    done(null, user)
  })

  if (process.env.TWITTER_CONSUMER_KEY) {
    passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL
    }, upsertAuthenticatedUser))
    app.get('/twitter', passport.authenticate('twitter'))
    app.get('/twitter/callback', passport.authenticate('twitter', redirectRoutes))
  } else {
    logger.info('process.env.TWITTER_CONSUMER_KEY not set', process.env.TWITTER_CONSUMER_KEY)
  }

  if (process.env.GITHUB_CLIENT_ID) {
    passport.use(new GithubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL
    }, upsertAuthenticatedUser))
    app.get('/github', passport.authenticate('github'))
    app.get('/github/callback', passport.authenticate('github', redirectRoutes))
  } else {
    logger.info('process.env.GITHUB_CLIENT_ID not set', process.env.GITHUB_CLIENT_ID)
  }

  if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, upsertAuthenticatedUser))
    app.get('/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }))
    app.get('/google/callback', passport.authenticate('google', redirectRoutes))
  } else {
    logger.info('process.env.GOOGLE_CLIENT_ID not set', process.env.GOOGLE_CLIENT_ID)
  }

  if (process.env.NODE_ENV !== 'production') {
    const MockStrategy = require('passport-mock-strategy')
    passport.use(
      new MockStrategy({
        name: 'mock',
        user: {
          _id: '5a9fe4e085d766000c002636',
          apikey: 'xxx',
          id: '2662706',
          avatar: 'https://avatars0.githubusercontent.com/u/2662706?v=4',
          username: 'christian-fei'
        }
      })
    )
    app.get('/user/fake', passport.authenticate('mock'), (req, res) => { res.writeHead(200); res.end() })
    logger.info('using mock auth - process.env.NODE_ENV', process.env.NODE_ENV)
  } else {
    logger.info('not using mock auth - process.env.NODE_ENV', process.env.NODE_ENV)
  }
} else {
  logger.info('not using auth')
}

module.exports = app

function upsertAuthenticatedUser (token, tokenSecret, profile, done) {
  var user = new UserInfo(profile).toJSON()
  logger.info('user', user)

  User.findOne({ id: user.id })
    .then(user => {
      if (user) {
        Object.assign(user, { hasActiveSubscription: hasActiveSubscription(user) })
        return done(null, user)
      }
      return User.insert(new UserInfo(profile))
        .then(async user => {
          await Event.insert({ name: 'createUserSucceeded', createdAt: new Date(), user }).catch(Function.prototype)
          return done(null, user)
        })
        .catch(async err => {
          await Event.insert({ name: 'createUserFailed', createdAt: new Date(), err }).catch(Function.prototype)
          return done(err, null)
        })
    })
}
