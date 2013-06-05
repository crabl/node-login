var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var SS = require('./modules/shirtsize-list');

function restrict(req, res, next) {
    if(req.session.user) {
	next();
    } else {
	res.redirect("/");
    }
}

module.exports = function(app) {

    // debugging sessions //
    app.get('/sessions', function(req, res) {
	var response = "<h1>Session Information</h1>";
	response += "<h4>req.session.user</h4><code>";
	response += JSON.stringify(req.session.user);
	response += "</code><h4>req.cookies.user</h4><code>";
	response += req.cookies.user;
	response += "</code>";
	res.send(response);
    });


    // main login page //

    app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
	if(req.cookies.user == undefined || req.cookies.pass == undefined) {
	    res.render('login', { title: 'Hello - Please Login To Your Account' });
	} else {
	    // attempt automatic login //
	    AM.autoLogin(req.cookies.user, req.cookies.pass, function(o) {
		if(o != null) {
		    req.session.user = o;
		    res.redirect('/home');
		} else {
		    res.render('login', { title: 'Hello - Please Login To Your Account' });
		}
	    });
	}
    });
    
    app.post('/', function(req, res){
	AM.manualLogin(req.param('user'), req.param('pass'), function(e, o) {
	    if(!o) {
		res.send(e, 400);
	    } else {
		req.session.user = o;
		if(req.param('remember-me') == 'true'){
		    res.cookie('user', o.user, { maxAge: 365 * 24 * 60 * 60 * 1000 });
		    res.cookie('pass', o.pass, { maxAge: 365 * 24 * 60 * 60 * 1000 });
		}
		res.send(o, 200);
	    }
	});
    });
    
    // logged-in user homepage //
    app.get('/home', restrict, function(req, res) {
	// need to get an updated user object from the database before we render the page
	AM.getUserObject(req.session.user.user, function(o) {
	    req.session.user = o;
	    
	    res.render('home', {
		title : 'WCHFF 2013 - Group Administration',
		countries : CT,
		udata : req.session.user
	    });
	});
    });
    
    app.post('/home', restrict, function(req, res) {
	AM.updateAccount({
	    user: req.param('user'),
	    name: req.param('name'),
	    email: req.param('email'),
	    groupname: req.param('groupname'),
	    country: req.param('country'),
	    pass: req.param('pass')
	}, function(e, o) {
	    if(e) {
		res.send('error-updating-account', 400);
	    } else {
		// update the user's login cookies if they exists //
		if (req.cookies.user != undefined && req.cookies.pass != undefined){
		    res.cookie('user', o.user, { maxAge: 365 * 24 * 60 * 60 * 1000 });
		    res.cookie('pass', o.pass, { maxAge: 365 * 24 * 60 * 60 * 1000 });	
		}
		res.send('ok', 200);
	    }
	});
    });

    app.post('/logout', restrict, function(req, res) {
	res.clearCookie('user');
	res.clearCookie('pass');
	//res.send('ok', 200);
	req.session.destroy(function(e){res.send('ok', 200); });
	res.redirect('/');
    });
    

    // transportation information page //
    app.get('/transport', restrict, function(req, res) {
        // need to get an updated user object from the database before we render the page                                                      
        AM.getUserObject(req.session.user.user, function(o) {
            req.session.user = o;

            res.render('transport', {
                title : 'WCHFF 2013 - Transportation Information',
                udata : req.session.user,
		tdata : req.session.user.transport
            });
        });
    });

    app.post('/transport', restrict, function(req, res) {
	AM.updateTransport({
	    user : req.session.user.user,
	    transport : {
		arrival : {
		    'method' : req.param('arrivalmethod-sf'),
                    'numpeople' : req.param('arrival-plane-numpeople'),
		    'carrier' : req.param('arrival-plane-carrier'),
                    'flight' : req.param('arrival-plane-flight'),
                    'eta_hour' : req.param('arrival-eta-hour'),
                    'eta_minute' : req.param('arrival-eta-minute'),
                    'eta_ampm' : req.param('arrival-eta-ampm') },
		departure : {
		    'method' : req.param('departuremethod-sf'),
                    'numpeople' : req.param('departure-plane-numpeople'),
		    'carrier' : req.param('departure-plane-carrier'),
                    'flight' : req.param('departure-plane-flight'),
                    'eta_hour' : req.param('departure-eta-hour'),
                    'eta_minute' : req.param('departure-eta-mimute'),
                    'eta_ampm' : req.param('departure-eta-ampm') }
	    }
	}, function(e, o) {
            if(e) {
                res.send('error-updating-account', 400);
            } else {
                res.send('success', 200);
            }
	});
    });

 
    // dance information page //
    app.get('/dances', restrict, function(req, res) {
	AM.getUserObject(req.session.user.user, function(o) {
	    req.session.user = o;

	    res.render('dances', {
		title : 'WCHFF 2013 - Dance Information',
		udata : req.session.user,
		ddata : req.session.user.dances
	    });
	});
    });
    
    app.post('/dances', restrict, function(req, res){
	AM.updateDances({
	    user: req.session.user.user,
	    dances: {
		'dance_hungariantitle': [req.param('dance1-hungariantitle'), 
					 req.param('dance2-hungariantitle'),
					 req.param('dance3-hungariantitle')],
		'dance_englishtitle': [req.param('dance1-englishtitle'),
				       req.param('dance2-englishtitle'),
				       req.param('dance3-englishtitle')],
		'dance_length' : [req.param('dance1-length'),
				  req.param('dance2-length'), 
				  req.param('dance3-length')],
		'dance_choreographer': [req.param('dance1-choreographer'),
					req.param('dance2-choreographer'),
					req.param('dance3-choreographer')],
		'dance_instructor': [req.param('dance1-instructor'),
				     req.param('dance2-instructor'),
				     req.param('dance3-instructor')],
		'dance_region': [req.param('dance1-region'),
                                 req.param('dance2-region'),
				 req.param('dance3-region')],
		'dance_type': [req.param('dance1-type'),
                               req.param('dance2-type'),
			       req.param('dance3-type')],
		'dance_village': [req.param('dance1-village'),
                                  req.param('dance2-village'),
				  req.param('dance3-village')],
		'dance_description': [req.param('dance1-description'),
				      req.param('dance2-description'),
				      req.param('dance3-description')]
	    }
	}, function(e, o) {
	    if(e) {
		res.send('error-updating-account', 400);
	    } else {
		res.send('success', 200); // Yay, success!
	    }
	});
    });
   
    // participants info page //
    app.get('/participants', restrict, function(req, res) {
        AM.getUserObject(req.session.user.user, function(o) {
            req.session.user = o;

            res.render('participants', {
                title : 'WCHFF 2013 - Group Participants',
                udata : req.session.user,
                pdata : JSON.stringify(req.session.user.participants)
            });
        });
    });

    app.post('/participants', restrict, function(req, res) {
        AM.updateParticipants({
            user : req.session.user.user,
            participants : JSON.parse(req.param('participantsarray'))
        }, function(e, o) {
            if(e) {
                res.send('error-updating-account', 400);
            } else {
                res.send('success', 200);
            }
        });
    });

    // ticketing system //
    app.get('/tickets', restrict, function(req, res) {
	AM.getUserObject(req.session.user.user, function(o) {
	    req.session.user = o;
	    
	    res.render('tickets', {
		title : 'WCHFF 2013 - Tickets',
		udata : req.session.user,
		tdata : req.session.user.tickets
	    });
	});
    });

    app.post('/tickets', restrict, function(req, res) {
	AM.updateTickets({
	    user: req.session.user.user,
	    festivalpasses : {
		'dancers' : req.param('dancers'),
		'administrators' : req.param('administrators'),
		'chaperones' : req.param('chaperones'),
		'musicalperformance' : req.param('musicalperformance') },
	    meals : {
		'lunch' : req.param('lunch'),
		'supper' : req.param('supper') },
	    tshirts : {
		'small' : req.param('small'),
		'medium' : req.param('medium'),
		'large' : req.param('large'),
		'xlarge' : req.param('xlarge'),
		'doublexlarge' : req.param('doublexlarge') },
	    festivaldvd : {
		'musicalperformance' : req.param('musicalperformancedvd'),
		'sundayafternoon' : req.param('sundayafternoondvd'),
		'sundayevening' : req.param('sundayeveningdvd'),
		'address' : '',
		'city' : '',
		'postalcode' : '',
		'permission' : '' },
	    tickets : {
		musicalperformance : {
		    'adult' : req.param('musicalperformanceadult'),
		    'studentsenior' : req.param('musicalperformancestudentsenior'),
		    'child' : req.param('musicalperformancechild') },
		galaperformance : {
		    afternoon : {
			'adult': req.param('galaafternoonadult'),
			'studentsenior' : req.param('galaafternoonstudentsenior'),
			'child' : req.param('galaafternoonchild') },
		    evening : {
			'adult' : req.param('galaeveningadult'),
			'studentsenior' : req.param('galaeveningstudentsenior'),
			'child' : req.param('galaeveningchild') } },
		packageprice : {
		    'adult' : req.param('packagepriceadult'),
		    'studentsenior' : req.param('packagepricestudentsenior'),
		    'child' : req.param('packagepricechild') },
		tanchaz : {
		    'friday' : req.param('tanchazfriday'),
		    'saturday' : req.param('tanchazsaturday'),
		    'sunday' : req.param('tanchazsunday') } }
	}, function(e, o) {
	    if(e) {
                res.send('error-updating-account', 400);
	    } else {
                res.send('success', 200);
	    }
	});
    });

    // billing information page //
    // this page has no corresponding POST request because it's just a summary //
    app.get('/billing', restrict, function(req, res) {
	AM.getUserObject(req.session.user.user, function(o) {
            req.session.user = o;

	    var priceData = {
		festivalpasses : {
		    'dancers' : 70,
		    'administrators' : 85,
		    'chaperones' : 85,
		    'musicalperformance' : 0 },
		meals : {
		    'lunch' : 0,
		    'supper' : 0 },
		tshirts : {
		    'small' : 0,
		    'medium' : 0,
		    'large' : 0,
		    'xlarge' : 0,
		    'doublexlarge' : 0 },
		festivaldvd : {
		    'musicalperformance' : 25,
		    'sundayafternoon' : 25,
		    'sundayevening' : 25 },
		tickets : {
		    musicalperformance : {
			'adult' : 20,
			'studentsenior' : 17.5,
			'child' : 10 },
		    galaperformance : {
			afternoon : {
			    'adult': 20,
			    'studentsenior' : 17.5,
			    'child' : 10 },
			evening : {
			    'adult' : 20,
			    'studentsenior' : 17.5,
			    'child' :  10 } },
		    packageprice : {
			'adult' : 50,
			'studentsenior' : 42.5,
			'child' :  27.5 },
		    tanchaz : {
			'friday' : 10,
			'saturday' : 10,
			'sunday' :  10}
		}
	    }

            res.render('billing', { 
		locals : {
		    title : 'WCHFF 2013 - Billing Information',
                    user : req.session.user,
                    tickets : req.session.user.tickets,
		    prices: priceData
		}
	    });
        });
    });
    

    // creating new accounts //
    app.get('/signup', function(req, res) {
	res.render('signup', {  title: 'Signup', countries : CT });
    });
    
    app.post('/signup', function(req, res){
	// create a new account accoring to the model defined below
	AM.addNewAccount({
	    name 	: req.param('name'),
	    email 	: req.param('email'),
	    groupname   : req.param('groupname'),
	    user 	: req.param('user'),
	    pass	: req.param('pass'),
	    country : req.param('country'),
	    dances: {
                'dance_hungariantitle': ['','',''],
                'dance_englishtitle': ['','',''], 
                'dance_length': ['','',''],
                'dance_choreographer': ['','',''],
                'dance_instructor': ['','',''],
                'dance_region': ['','',''],
                'dance_type': ['','',''],
                'dance_village': ['','',''],
                'dance_description': ['','','']
            },
	    transport : {
		'arrival' : {
		    'method' : '',
		    'numpeople' : '',
		    'carrier' : '',
		    'flight' : '',
		    'eta_hour' : '',
		    'eta_minute' : '',
		    'eta_ampm' : '' },
		'departure' : {
		    'method' : '',
		    'numpeople': '',
                    'carrier' :'',
		    'flight' : '',
                    'eta_hour' : '',
                    'eta_minute' : '',
                    'eta_ampm' : '' }
	    },
	    participants : [],
	    festivalpasses : {
		'dancers' : 0,
		'administrators' : 0,
		'chaperones' : 0,
		'musicalperformance' : 0 },
	    meals : {
		'lunch' : 0,
		'supper' : 0 },
	    tshirts : {
		'small' : 0,
		'medium' : 0,
		'large' : 0,
		'xlarge' : 0,
		'doublexlarge' : 0 },
	    festivaldvd : {
		'musicalperformance' : 0,
		'sundayafternoon' : 0,
		'sundayevening' : 0,
		'address' : '',
		'city' : '',
		'postalcode' : '',
	        'permission' : '' },
	    tickets : {
		musicalperformance : {
		    'adult' : 0,
		    'studentsenior' : 0,
		    'child' : 0 },
		galaperformance : {
		    afternoon : {
			'adult': 0,
			'studentsenior' : 0,
			'child' : 0 },
		    evening : {
			'adult' : 0,
			'studentsenior' : 0,
			'child' : 0 } },
		packageprice : {
		    'adult' : 0,
		    'studentsenior' : 0,
		    'child' : 0 },
		tanchaz : {
		    'friday' : 0,
		    'saturday' : 0,
		    'sunday' : 0 }
	    }
	}, function(e) {
	    if(e) {
		res.send(e, 400);
	    } else {
		res.send('ok', 200);
	    }
	});
    });

    // password reset //
    app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
	AM.getAccountByEmail(req.param('email'), function(o){
	    if (o){
		res.send('ok', 200);
		EM.dispatchResetPasswordLink(o, function(e, m){
		    // this callback takes a moment to return //
		    // should add an ajax loader to give user feedback //
		    if (!e) {
			//	res.send('ok', 200);
		    }	else{
			res.send('email-server-error', 400);
			for (k in e) console.log('error : ', k, e[k]);
		    }
		});
	    }	else{
		res.send('email-not-found', 400);
	    }
	});
    });

    app.get('/reset-password', function(req, res) {
	var email = req.query["e"];
	var passH = req.query["p"];
	AM.validateResetLink(email, passH, function(e){
	    if (e != 'ok'){
		res.redirect('/');
	    } else{
		// save the user's email in a session instead of sending to the client //
		req.session.reset = { email:email, passHash:passH };
		res.render('reset', { title : 'Reset Password' });
	    }
	})
    });
    
    app.post('/reset-password', function(req, res) {
	var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
	var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
	req.session.destroy();
	AM.updatePassword(email, nPass, function(e, o){
	    if (o){
		res.send('ok', 200);
	    }	else{
		res.send('unable to update password', 400);
	    }
	})
    });
    
    // view & delete accounts //
    app.get('/print', function(req, res) {
	AM.getAllRecords( function(e, accounts){
	    res.render('print', { title : 'Account List', accts : accounts });
	})
    });
    
    app.post('/delete', function(req, res){
	AM.deleteAccount(req.body.id, function(e, obj){
	    if (!e){
		res.clearCookie('user');
		res.clearCookie('pass');
	        req.session.destroy(function(e){ res.send('ok', 200); });
	    }	else{
		res.send('record not found', 400);
	    }
	});
    });
    
    app.get('/reset', function(req, res) {
	AM.delAllRecords(function(){
	    res.redirect('/print');	
	});
    });
    
    app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};