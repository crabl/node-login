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

function restrictAdmin(req, res, next) {
    if(req.session.user && req.session.user.admin) {
	next();
    } else {
	res.redirect("/");
    }
}

module.exports = function(app) {

    // debugging sessions //
    app.get('/sessions', restrictAdmin, function(req, res) {
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
		remarks : req.param('remarks'),
		arrival : {
		    'method' : req.param('arrivalmethod-sf'),
                    'numpeople' : req.param('arrival-plane-numpeople'),
		    'carrier' : req.param('arrival-plane-carrier'),
                    'flight' : req.param('arrival-plane-flight'),
                    'eta_hour' : req.param('arrival-eta-hour-sf'),
                    'eta_minute' : req.param('arrival-eta-minute-sf'),
                    'eta_ampm' : req.param('arrival-eta-ampm-sf') },
		departure : {
		    'method' : req.param('departuremethod-sf'),
                    'numpeople' : req.param('departure-plane-numpeople'),
		    'carrier' : req.param('departure-plane-carrier'),
                    'flight' : req.param('departure-plane-flight'),
                    'eta_hour' : req.param('departure-eta-hour-sf'),
                    'eta_minute' : req.param('departure-eta-minute-sf'),
                    'eta_ampm' : req.param('departure-eta-ampm-sf') }
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
				      req.param('dance3-description')],
		'dance3_time': req.param('dance3_time')
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
            participants : JSON.parse(req.param('participants'))
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
		'package' : req.param('package'),
	        'packagechild': req.param('packagechild') },
	    tshirts : { 
		'menshortxs' : req.param('menshortxs'),
		'menlongxs' : req.param('menlongxs'),
		'menshorts' : req.param('menshorts'),
                'menlongs' : req.param('menlongs'),
		'menshortm' : req.param('menshortm'),
                'menlongm' : req.param('menlongm'),
		'menshortl' : req.param('menshortl'),
                'menlongl' : req.param('menlongl'),
		'menshortxl' : req.param('menshortxl'),
                'menlongxl' : req.param('menlongxl'),
		'menshortxxl' : req.param('menshortxxl'),
                'menlongxxl' : req.param('menlongxxl'),
		'menshortxxxl' : req.param('menshortxxxl'),
                'menlongxxxl' : req.param('menlongxxxl'),
		'ladiesshortxs' : req.param('ladiesshortxs'),
		'ladieslongxs' : req.param('ladieslongxs'),
		'ladiesshorts' : req.param('ladiesshorts'),
                'ladieslongs' : req.param('ladieslongs'),
		'ladiesshortm' : req.param('ladiesshortm'),
                'ladieslongm' : req.param('ladieslongm'),
		'ladiesshortl' : req.param('ladiesshortl'),
                'ladieslongl' : req.param('ladieslongl'),
		'ladiesshortxl' : req.param('ladiesshortxl'),
                'ladieslongxl' : req.param('ladieslongxl'),
		'ladiesshortxxl' : req.param('ladiesshortxxl'),
                'ladieslongxxl' : req.param('ladieslongxxl'),
		'ladiesshortxxxl' : req.param('ladiesshortxxxl'),
                'ladieslongxxxl' : req.param('ladieslongxxxl'),
		'youthshorts' : req.param('youthshorts'),
                'youthlongs' : req.param('youthlongs'),
		'youthshortm' : req.param('youthshortm'),
                'youthlongm' : req.param('youthlongm'),
		'youthshortl' : req.param('youthshortl'),
                'youthlongl' : req.param('youthlongl'),
		'youthshortxl' : req.param('youthshortxl'),
                'youthlongxl' : req.param('youthlongxl') } ,
	    festivaldvd : {
		'musicalperformance' : req.param('musicalperformancedvd'),
		'sundayafternoon' : req.param('sundayafternoondvd'),
		'sundayevening' : req.param('sundayeveningdvd'),
		'address' : req.param('address'),
		'city' : req.param('city'),
		'postalcode' : req.param('postalcode'),
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

    // Price Data for billing and billing-admin pages
    var priceData = {
	festivalpasses : {
	    'dancers' : 70,
	    'administrators' : 85,
	    'chaperones' : 85,
	    'musicalperformance' : 0 },
	meals : {
	    'package' : 30,
	    'packagechild' : 15 },
	tshirts : {
	    'menshortxs' : 25,
	    'menlongxs' : 30,
	    'menshorts' : 25,
            'menlongs' : 30,
	    'menshortm' : 25,
            'menlongm' : 30,
	    'menshortl' : 25,
            'menlongl' : 30,
	    'menshortxl' : 25,
            'menlongxl' : 30,
	    'menshortxxl' : 25,
            'menlongxxl' : 30,
	    'menshortxxxl' : 30,
            'menlongxxxl' : 35,
	    'ladiesshortxs' : 25,
	    'ladieslongxs' : 30,
	    'ladiesshorts' : 25,
            'ladieslongs' : 30,
	    'ladiesshortm' : 25,
            'ladieslongm' : 30,
	    'ladiesshortl' : 25,
            'ladieslongl' : 30,
	    'ladiesshortxl' : 25,
            'ladieslongxl' : 30,
	    'ladiesshortxxl' : 25,
            'ladieslongxxl' : 30,
	    'ladiesshortxxxl' : 30,
            'ladieslongxxxl' : 35,
	    'youthshorts' : 20,
            'youthlongs' : 25,
	    'youthshortm' : 20,
            'youthlongm' : 25,
	    'youthshortl' : 20,
            'youthlongl' : 25,
	    'youthshortxl' : 20,
            'youthlongxl' : 25 } ,
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

    app.get('/billingAdmin', restrictAdmin, function(req, res) {
	AM.getUserObject(req.param('user'), function(o) {
            var billingUser = o;
	    res.render('billing-admin', { 
		locals : {
		    title : 'WCHFF 2013 - Admin Billing Information',
		    user : billingUser,
		    tickets : billingUser.tickets,
		    prices: priceData
		}
	    });
        });	
    });

    app.get('/participantsAdmin', restrictAdmin, function(req, res) {
	AM.getUserObject(req.param('user'), function(o) {
	    var groupUser = o;
	    res.render('print-participants', {
		groupInfo : groupUser
	    });
	});
    });

    app.get('/dancesAdmin', restrictAdmin, function(req, res) {
        AM.getUserObject(req.param('user'), function(o) {
            var groupUser = o;
            res.render('print-dances', {
                groupInfo : groupUser
            });
        });
    });


    app.get('/transportAdmin', restrictAdmin, function(req, res) {
        AM.getAllRecords( function(e, accounts){
            res.render('transport-admin', { title : 'Transport List', accts : accounts });
        })
    });
    

    // billing information page //
    // this page has no corresponding POST request because it's just a summary //
    app.get('/billing', restrict, function(req, res) {
	AM.getUserObject(req.session.user.user, function(o) {
            req.session.user = o;

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
	    admin       : false,
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
                'dance_description': ['','',''],
		'dance3_time' : ''
            },
	    transport : {
		'remarks' : '',
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
		'package' : 0,
		'packagechild' : 0 },
	    tshirts : {
		'menshortxs' : 0,
		'menlongxs' : 0,
		'menshorts' : 0,
                'menlongs' : 0,
		'menshortm' : 0,
                'menlongm' : 0,
		'menshortl' : 0,
                'menlongl' : 0,
		'menshortxl' : 0,
                'menlongxl' : 0,
		'menshortxxl' : 0,
                'menlongxxl' : 0,
		'menshortxxxl' : 0,
                'menlongxxxl' : 0,
		'ladiesshortxs' : 0,
		'ladieslongxs' : 0,
		'ladiesshorts' : 0,
                'ladieslongs' : 0,
		'ladiesshortm' : 0,
                'ladieslongm' : 0,
		'ladiesshortl' : 0,
                'ladieslongl' : 0,
		'ladiesshortxl' : 0,
                'ladieslongxl' : 0,
		'ladiesshortxxl' : 0,
                'ladieslongxxl' : 0,
		'ladiesshortxxxl' : 0,
                'ladieslongxxxl' : 0,
		'youthshorts' : 0,
                'youthlongs' : 0,
		'youthshortm' : 0,
                'youthlongm' : 0,
		'youthshortl' : 0,
                'youthlongl' : 0,
		'youthshortxl' : 0,
                'youthlongxl' : 0 } ,
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
    app.get('/print', restrictAdmin, function(req, res) {
	AM.getAllRecords( function(e, accounts){
	    res.render('print', { title : 'Account List', accts : accounts });
	})
    });
    
    app.get('/shirtAdmin', restrictAdmin, function(req, res) {
        AM.getAllRecords( function(e, accounts){
            res.render('shirts-admin', { title : 'Shirt Order List', accts : accounts });
        })
    });

    app.post('/delete', restrict, function(req, res){
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
    
    app.get('/reset', restrictAdmin, function(req, res) {
	AM.delAllRecords(function(){
	    res.redirect('/print');	
	});
    });
    
    app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
