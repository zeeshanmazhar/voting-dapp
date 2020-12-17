const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');
const cron = require('node-cron');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors');
const app = express();


var bindip = process.env.BINDIP || "127.0.0.1";
var port = process.env.PORT || 3000;


// const ccbemails = require('./controllers/emails');

// mongoose.connect(config.database, { useNewUrlParser: true });
// let db = mongoose.connection;

// db.once('open', function() {
//     console.log('Connected to MongoDB');
// });

var db = require('./config/database').MongoURI;
mongoose.connect(db , {useNewUrlParser : true ,  useUnifiedTopology: true})
.then(() => console.log('Database Connected...!'))
.catch(err => console.log(err));
mongoose.set('useCreateIndex', true);


app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
//app.use(express.static(path.join(__dirname,'public')));

// Express Session Middleware
app.use(session({
    secret: 'SVEgb8eEYb0OoAWGbchichu',
    resave: true, 
    saveUninitialized: true,
    store: new MongoStore({ 
        //mongooseConnection: db,
        mongooseConnection: mongoose.connection,
    }),
    cookie: {
        expires: 3600000
    }
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function(req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

var passportOneSessionPerUser = require('passport-one-session-per-user');
passport.use(new passportOneSessionPerUser());
app.use(passport.authenticate('passport-one-session-per-user'));

app.get('*', function(req, res, next) {
    // console.log(req.user);
    res.locals.user = req.user || null;
    next();
});

app.get("/", (req, res) => {
        res.render('index', {
        });
});


var user = require('./controllers/user');
 app.use('/', user);

var candidate = require('./controllers/candidate');
app.use('/candidate', candidate);

var ballot = require('./controllers/ballot');
app.use('/ballot', ballot);

var dashboard = require('./controllers/dashboard');
app.use('/dashboard', dashboard);



app.get('*', function(req, res) {
    res.status(400).render('404');
});


app.listen(port, bindip, () => {
    console.log('Server listing on IP ' + bindip + ' and port ' + port);
});

// cron.schedule('*/1 * * * *', function() {
//     if (!(db.readyState == 1)) {
//         console.log('Checking DB Connection: ' + ((db.readyState == 1)? 'Connected' : 'Not Connected'));        
//     }
// });