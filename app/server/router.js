var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var SS = require('./modules/shirtsize-list');

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
	if (req.cookies.user == undefined || req.cookies.pass == undefined){
	    res.render('login', { title: 'Hello - Please Login To Your Account' });
	}	else{
	    // attempt automatic login //
	    AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
		if (o != null){
		    console.log("Autologging in");
		    console.log(o);
		    req.session.user = o;
		    res.redirect('/home');
		}	else{
		    res.render('login', { title: 'Hello - Please Login To Your Account' });
		}
	    });
	}
    });
    
    app.post('/', function(req, res){
	AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
	    if (!o){
		res.send(e, 400);
	    }	else{
		req.session.user = o;
		if (req.param('remember-me') == 'true'){
		    res.cookie('user', o.user, { maxAge: 900000 });
		    res.cookie('pass', o.pass, { maxAge: 900000 });
		}
		res.send(o, 200);
	    }
	});
    });
    
    // logged-in user homepage //
    
    app.get('/home', function(req, res) {
	if (req.session.user == null){
	    // if user is not logged-in redirect back to login page //
	    res.redirect('/');
	}   else{
	    res.render('home', {
		title : 'WCHFF 2013 - Group Administration',
		countries : CT,
		udata : req.session.user
	    });
	}
    });
    
    app.post('/home', function(req, res){
	if (req.param('user') != undefined) {
	    AM.updateAccount({
		user: req.param('user'),
		name: req.param('name'),
		email: req.param('email'),
		groupname: req.param('groupname'),
		country: req.param('country'),
		pass: req.param('pass')
	    }, function(e, o){
		if (e){
		    res.send('error-updating-account', 400);
		}	else{
		    req.session.user = o;
		    // update the user's login cookies if they exists //
		    if (req.cookies.user != undefined && req.cookies.pass != undefined){
			res.cookie('user', o.user, { maxAge: 900000 });
			res.cookie('pass', o.pass, { maxAge: 900000 });	
		    }
		    res.send('ok', 200);
		}
	    });
	}	else if (req.param('logout') == 'true'){
	    res.clearCookie('user');
	    res.clearCookie('pass');
	    req.session.destroy(function(e){ res.send('ok', 200); });
	}
    });
 
    // dance information page //
    app.get('/dances', function(req, res) {
	console.log("Getting Dances...");
	console.log(req.session.user.dances);
	if (req.session.user == null){
	    // if user is not logged-in redirect back to login page //
	    res.redirect('/');
	}   else{
	    res.render('dances', {
		title : 'WCHFF 2013 - Dance Information',
		udata : req.session.user,
		ddata : req.session.user.dances
	    });
	}
    });
    
    app.post('/dances', function(req, res){
	console.log("Posting for "+req.session.user.user);
	if (req.session.user != undefined) {
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
	    }, function(e, o){
		if (e){
		    res.send('error-updating-account', 400);
		}	else{
		    req.session.user = o;
		    /* ^---- 
		       Okay folks, we've come to that point in the program where it's time to ask ourselves:
		       "Honestly, what the fuck is going on here?"
		       
		       Whenever I console.log this shit, it always gives me "1". Dear ExpressJS, I didn't
		       need the answer to the question "How many JavaScript coders does it take to create
		       a fucking horrible mess of a framework and call it fucking Express?". No. All I want
		       to know is why my goddamn session variable isn't working properly. To the writer of
		       the 'node-login' framework: my deepest sympathies. I heard that you were committed to
		       an insane asylum shortly after you finished writing your framework. I don't blame you.
		       If this fucking shitmess of silly string and JS-brogrammer spooge is all I had to work
		       with on a daily basis, mark my fucking words, I'd be in the foam hockey helmet right
		       next to you. 

		       How could anyone have thought that this "language", and above all, this bananarammer of
		       a goddamn "framework" was a good idea? There is no rational, thinking, coherent human
		       being capable of inflicting such atrocities on the world. WHY DO I DO THIS TO MYSELF?!
		       Why did I listen to the proclamations of the brogrammers, heralding the arrival of a
		       "tool" that has made me weep tears of my own blood?! 

		       I tried. I really did try to like this language. I went so far as to almost LOVE it.
		       But alas, it was not meant to be. Node.js has managed to suck every last drop of life
		       out of me. It has turned me into a hollow shell of a man who only exists to free
		       himself of the horrors that were committed against him by this trainwreck of a framework.

		       And so, since nobody else is going to say it, I'm going to say it: I dislike Node.js.
		       I _PROFOUNDLY_ dislike Express.js. I _EVEN MORE PROFOUNDLY_ dislike Javascript. It is
		       a nasty, awful, monstrous, disgusting, wretched, evil, moronic, malevolent, vile,
		       disfigured, whorish, retarded, schizophrenic, cocksucking, ass-munching, dumpster-diving,
		       rotting carcass of a language. To those more tenacious than I, mazal tov.  To the rest 
		       (and the sane), run fast, and run fucking far. /rant
		    */
		    res.send('success', 200); // Yay, success!
		}
	    });
	}	else if (req.param('logout') == 'true'){
	    res.clearCookie('user');
	    res.clearCookie('pass');
	    req.session.destroy(function(e){ res.send('ok', 200); });
	}
    });
 
   
    // creating new accounts //
    
    app.get('/signup', function(req, res) {
	res.render('signup', {  title: 'Signup', countries : CT });
    });
    
    app.post('/signup', function(req, res){
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
            }
	}, function(e){
	    if (e){
		res.send(e, 400);
	    }	else{
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