(function(){
  "use strict";
const fs = require('fs')
const express = require('express')
const path = require('path')
const date = require('date-and-time')
const openpgp = require('openpgp')
const mysql = require('mysql')
//const usersdb_conn = require('./modules/usersdb_conn.js')
const dn = require('./dirname');
const usersdb_conn = require('./usersdb_conn.js')

const app = express();
app.use(express.urlencoded({extended: false})); // Parses the POST body for data
//app.use(express.json());

// --------------
// get current working directory
const cwd = dn.__dirname+'/';
console.log('dirname -- ', cwd);

var typ; var bits;
var firstname; var lastname; var factors; var passphrase;
const em = "itzbobwright@gmail.com";
const messenganetpassphrase = "AUniqueAndCleverPassphrase"; //signer passphrase
const syntheticrealitynetpassphrase = "AnotherUniqueAndCleverPassphrase"; //signer passphrase
var privKey ='-'; var pubKey ='-';

// ----------------
// get key parameters
  // key parameters file
const parmsfile = 'conf/parms.txt';
//var typ; var bits;
//async function getParmstext() {
const getParmstext = () => {
return new Promise(resolve => {
  var parmstext = fs.readFileSync(cwd+parmsfile).toString();
  typ = parmstext.split(',')[0];
  bits = parmstext.split(',')[1];
  console.log("get key parameters successful.");
	resolve (typ, bits);
})
}

// ---------------
// get user datat
const dbUserData = () => {
return new Promise(resolve => {
usersdb_conn.query("SELECT firstname, lastname, factors FROM users WHERE email LIKE '"+em+"'", (error, result) => {
        if (error) {
          //return result.status(500).JSON({ status: "PRR_ERROR", error });
          return result.JSON({ status: "UDR_ERROR", error });
        };
        console.log('dbUserdata --',JSON.stringify(result, null, 2));
        //result = JSON.stringify(result);
            firstname = result[0].firstname
            lastname = result[0].lastname
            factors = result[0].factors
            passphrase = factors.replace(/,/g, '')
        //console.log('result -- ', firstname, lastname, passphrase);
console.log("get user data successful.");
        resolve (firstname, lastname, passphrase);
        return firstname, lastname, passphrase;
      });
})
}

// -----------------
// generate key pair
async function keygen() {
//console.log('keys -- ',privateKey,publicKey);
		// have parameters, generate keys
		var { privateKey, publicKey } = await openpgp.generateKey({
			type: typ, // Type of the key
			rsaBits: parseInt(bits), // RSA key size (defaults to 4096 bits)
			userIDs: {name: firstname+' '+lastname, email: em, comment: ''} , // you can pass multiple user IDs
			passphrase: passphrase, // protects the private key
			format: 'armored'
		});
    privKey = privateKey; pubKey = publicKey;
    console.log('generated private key -- ');
    console.log('generated public key -- ');
        return privateKey, publicKey;
}

// -----------
// write keys to files
	var dateTime = new Date(); // use date-and-time module
	var value = date.format(dateTime,'YYYY/MM/DD HH:mm');
const writeprivkeyfile = () => {
return new Promise(resolve => {
	var privkeyfile = cwd+'data/'+firstname+lastname+'-'+typ+bits+'.prv' 
	console.log('Private Key filename -- ',privkeyfile); // key filename
  //console.log(privKey);
  fs.writeFile(privkeyfile, privKey, err => { 
		if (err) {
			console.error(err);
		} // else 
    resolve (console.log('// private key file written successfully at '+value));
	})
})
}
const writepubkeyfile = () => {
return new Promise(resolve => {
	var pubkeyfile = cwd+'data/'+firstname+lastname+'-'+typ+bits+'.pub'
	console.log('Public Key filename -- ',pubkeyfile);
  //console.log(pubKey);
	fs.writeFile(pubkeyfile, pubKey, err => {
		if (err) {
			console.error(err);
		} // else 
    resolve (console.log('// public key file written successfully at '+value));
	})
})
}

// -------------
// check if private key in database
var prkeyexists = false;
const checkPrkeyexists = () => { // tests existence of the key record
  return new Promise(resolve => {
   usersdb_conn.query("SELECT EXISTS(SELECT * FROM prvkey WHERE email LIKE '"+em+"')", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PRR_ERROR", error });
        return result.JSON({ status: "PRR_ERROR", error });
      };
      result = JSON.stringify(result).includes(":1");
      console.log('prkey exists -- ',result);
      prkeyexists = result;
      resolve(result);
    });
  });
}

// -------------
// check if public key in database
var pukeyexists = false;
const checkPukeyexists = () => { // tests existence of the key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT EXISTS(SELECT * FROM pubkey WHERE email LIKE '"+em+"')", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PUR_ERROR", error });
        return result.JSON({ status: "PUR_ERROR", error });
      };
      result = JSON.stringify(result).includes(":1");
      console.log('pukey exists -- ',result);
      pukeyexists = result;
      resolve(result);
    });
  });
}

// -----------------
// write private key to db
 const setPrivkey = () => { // function inserts or updates key as required
    return new Promise(resolve => {
      if (prkeyexists) {
        usersdb_conn.query("UPDATE prvkey SET email = '"+em+"', prvkey = '"+privKey+"' WHERE email LIKE '"+em+"'", (error, result) => {
        if (error) {
          //return result.status(500).JSON({ status: "PRR_ERROR", error });
          return result.JSON({ status: "PRW_ERROR", error });
        };
        resolve(console.log('updated private key record'));
        });
      } else {
        usersdb_conn.query("INSERT INTO prvkey (email, prvkey) VALUES('"+em+"', '"+privKey+"')", (error, result) => {
        if (error) {
          //return result.status(500).JSON({ status: "PRR_ERROR", error });
          return result.JSON({ status: "PRW_ERROR", error });
        };
        resolve(console.log('inserted private key record'));
        });
      }
    });
  }
  
// -----------------
// write public key to db
 const setPubkey = () => { // function inserts or updates key as required
    return new Promise(resolve => {
      if (pukeyexists) {
        usersdb_conn.query("UPDATE pubkey SET email = '"+em+"', pubkey = '"+pubKey+"' WHERE email LIKE '"+em+"'", (error, result) => {
        if (error) {
          //return result.status(500).JSON({ status: "PUR_ERROR", error });
          return result.JSON({ status: "PUW_ERROR", error });
        };
        resolve(console.log('updated public key record'));
        });
      } else {
        usersdb_conn.query("INSERT INTO pubkey (email, pubkey) VALUES('"+em+"', '"+pubKey+"')", (error, result) => {
        if (error) {
          //return result.status(500).JSON({ status: "PUR_ERROR", error });
          return result.JSON({ status: "PUW_ERROR", error });
        };
        resolve(console.log('inserted public key record'));
        });
      }
    });
  }
  
// ------------------
async function performAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getParmstext();
//const secondRequest = await dbConnect();
const thirdRequest = await dbUserData();
const fourthRequest = await keygen(); // an async function
const fifthRequest = await writeprivkeyfile();
const sixthRequest = await writepubkeyfile();
const seventhRequest = await checkPrkeyexists();
const eigthRequest = await checkPukeyexists();
const ninthRequest = await setPrivkey();
const tenthRequest = await setPubkey();

console.log("\nAll tasks complete.");
    console.log('type -- ',typ);
    console.log('bits -- ',bits);
    console.log('firstname -- ',firstname);
    console.log('lastname -- ',lastname);
    console.log('passphrase -- ',passphrase);
    console.log('email -- ',em);
    console.log('private key --\n',privKey);
    console.log('public key --\n',pubKey);
    console.log('private key in db -- ',prkeyexists);
    console.log('public key in db -- ',pukeyexists);

}
// ---------------
performAsyncFunctions();