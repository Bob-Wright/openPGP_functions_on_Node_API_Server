// ---------------------------------
// Simple openPGPjs Node Server API
// based on openPGPjs library
//
// usage:
//  use a form action to "https://messenga.net:8080/[function]"
//  with method="post" and enctype="text" name="email"
//  value="email@email.com" | "email1@email.com, email2@email.com"
//  
// where [function] is one of
//  /keygen - create a key pair for users or signers
//  /encrypt - encrypt message with public key
//  /encryptsign - encrypt and sign message
//  /decrypt - decrypt message with private key
//  /decryptverify - decrypt and verify message
//  /sign - sign plaintext message
//  /verify - verify plaintext message sign
// ---------------------------------
const https = require('https')
const fs = require('fs')
const express = require('express')
const path = require('path')
const date = require('date-and-time')
const openpgp = require('openpgp')
const mysql = require('mysql')
const usersdb_conn = require('./modules/usersdb_conn.js')
const dn = require('./dirname');
 const getUserData = require('./getUserData')

const app = express();
app.use(express.urlencoded({extended: false})); // Parses the POST body for data
//app.use(express.json());
const writefiles = true; // flag to also write keys to files
const messenganetpassphrase = "AUniqueAndCleverPassphrase"; //signer passphrase
const syntheticrealitynetpassphrase = "AnotherUniqueAndCleverPassphrase"; //signer passphrase

// --------------
// get current working directory
const cwd = dn.__dirname+'/';
console.log('dirname -- ', cwd);

var typ; var bits;
var firstname; var lastname; var factors; var passphrase;
//var em = "";
var privKey ='-'; var pubKey ='-';

// ==============
// create and save a key pair
// ==============
//
app.post('/keygen', (req, res) => {
  console.log("\n==== generate key pair ====");
  const mail = req.body.email; // req.body contains the parsed body of the request.
  var em = mail;
  console.log("POST email value: ", em);
// --------------------------
// perform the tasks
async function performKeygenAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = console.log(await getUserData);
//const thirdRequest = await dbUserData(em);
//const fourthRequest = await keygen(); // an async function
//console.log(firstname+' '+lastname+' '+passphrase)
    /*console.log("\nAll tasks complete.");
    console.log('firstname -- ',firstname);
    console.log('lastname -- ',lastname);
    console.log('passphrase -- ',passphrase);
    console.log('email -- ',em);
    */
    console.log('==== keygen function complete ====\n')
}
// ---------------
performKeygenAsyncFunctions();
console.log(getUserData);
// ------------------
}); // end keygen



//
// ==============
// create and save a key pair
// ==============
//
app.post('/keygen_save', (req, res) => {
  console.log("\n==== generate key pair ====");
  const mail = req.body.email; // req.body contains the parsed body of the request.
  var em = mail;
  console.log("POST email value: ", em);

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
// get user data
const dbUserData = (em) => {
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
  
// -------------
// show the results web page to the user
 const keygenWebpage = () => { // function shows web page
  return new Promise(resolve => {
// tell the user we created the key pair and jump to next URL
	const top = fs.readFileSync("./public/sfTop.html");
	const bottom = fs.readFileSync("./public/sfBottom.html");
		console.log('A PGP Key File pair was saved at '+value);
		valuestring = '<h3>A PGP Key File pair was saved at '+value+'</h3>';
		resolve(res.send(top+valuestring+bottom));
    });
  }

// --------------------------
// perform the tasks
async function performKeygenAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getParmstext();
//const secondRequest = await dbConnect();
const thirdRequest = await dbUserData(em);
const fourthRequest = await keygen(); // an async function
const fifthRequest = await writeprivkeyfile();
const sixthRequest = await writepubkeyfile();
const seventhRequest = await checkPrkeyexists();
const eigthRequest = await checkPukeyexists();
const ninthRequest = await setPrivkey();
const tenthRequest = await setPubkey();
const eleventhRequest = await keygenWebpage();

    /*console.log("\nAll tasks complete.");
    console.log('type -- ',typ);
    console.log('bits -- ',bits);
    console.log('firstname -- ',firstname);
    console.log('lastname -- ',lastname);
    console.log('passphrase -- ',passphrase);
    console.log('email -- ',em);
    console.log('private key in db -- ',prkeyexists);
    console.log('public key in db -- ',pukeyexists);
    console.log('private key --\n',privKey);
    console.log('public key --\n',pubKey);
    */
    console.log('==== keygen function complete ====\n')
}
// ---------------
performKeygenAsyncFunctions();
// ------------------
}); // end keygen

//
// ==============
// encrypt message
// ==============
// 
app.post('/encrypt', (req, res) => {
  console.log("\n==== encrypt message ====");
  const mail = req.body.email; // req.body contains the parsed body of the request.
  var em = mail;
  console.log("POST email value: "+ em);

// ----------------
// get plaintext file
plaintextfile = 'data/plaintext.txt';
var plaintext; // message to encrypt
const getPlaintext = () => {
return new Promise(resolve => {
  plaintext = fs.readFileSync(cwd+plaintextfile).toString();
  //console.log('plaintext -- ',plaintext);
	resolve (plaintext);
  })
}

// -------------
// get public key from database
	//console.log([public]Key);     // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
 const getpublickey = () => { // function gets public key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT pubkey FROM pubkey WHERE email LIKE '"+em+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PUR_ERROR", error });
        return result.JSON({ status: "PUR_ERROR", error });
      };
      console.log('Publickeydata --',JSON.stringify(result, null, 2));
      console.log('publickey -- ',result[0].pubkey);
      publicKeyArmored = result[0].pubkey;
      resolve(publicKeyArmored);
    });
  });
}

// ------------
// encrypt message
var encryptedText;
async function encryptText() {
  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
  const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: plaintext }), // input as Message object
        encryptionKeys: publicKey
    });
    console.log('plaintext -- ',plaintext);
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
    encryptedText = encrypted;
        return encrypted;
}

// ----------
// write encrypted message to file
encryptedMsg = cwd+'data/encrypted.msg'
const writeEncryptedmsg = () => {
return new Promise(resolve => {
	fs.writeFile(encryptedMsg, encryptedText, err => {
		if (err) {
			console.error(err);
		} else {
		  resolve (console.log('// unsigned encrypted message file written successfully'));
		}
	})
})
}

async function performEncryptAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getPlaintext();
const secondRequest = await getpublickey();
const thirdRequest = await encryptText(); // an async function
const fourthRequest = await writeEncryptedmsg();
//const eleventhRequest = await encryptedMsgWebpage();

    //console.log("\nAll tasks complete.");
    console.log('==== encrypt function complete ====\n')
}
// ---------------
performEncryptAsyncFunctions();
// ------------------
}); // end encrypt

//
// ==============
// decrypt message
// ==============
// 
app.post('/decrypt', (req, res) => {
  console.log("\n==== decrypt message ====");
  const mail = req.body.email; // req.body contains the parsed body of the request.
  var em = mail;
  console.log("POST email value: "+ em);

	// encrypted text filename
enctextfile = 'data/encrypted.msg';
var enctext; // message to decrypt
const getEnctext = () => {
return new Promise(resolve => {
  enctext = fs.readFileSync(cwd+enctextfile).toString();
  //console.log('encryptedtext -- ',enctext);
	resolve (enctext);
  })
}

// decrypter data
// ---------------
// get user data
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

// -------------
// get private key from database
	//console.log(privateKey);     // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
 const getprivatekey = () => { // function gets private key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT prvkey FROM prvkey WHERE email LIKE '"+em+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PRR_ERROR", error });
        return result.JSON({ status: "PRR_ERROR", error });
      };
      console.log('Privatekeydata --',JSON.stringify(result, null, 2));
      console.log('privatekey -- ',result[0].prvkey);
      privateKeyArmored = result[0].prvkey;
      resolve(privateKeyArmored);
    });
  });
}

// -------------
// decrypt message
var decryptedText;
async function decryptText() {
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase
    });
    const message = await openpgp.readMessage({ armoredMessage: enctext // parse armored message 
    });
    //console.log(message);
    const decrypted  = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey
    });
    console.log(decrypted.data); // should be our original text
    decryptedText = decrypted.data;
}

// ---------
// write decrypted message to file
var decryptedMsgfile = cwd+'data/decrypted.msg'
const writeDecryptedmsg = () => {
return new Promise(resolve => {
	fs.writeFile(decryptedMsgfile, decryptedText, err => {
		if (err) {
			console.error(err);
		} else {
		  resolve (console.log('// decrypted message file written successfully'));
		}
	})
})
}

async function performDecryptAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getEnctext();
const secondRequest = await dbUserData();
const thirdRequest = await getprivatekey();
const fourthRequest = await decryptText(); // an async function
const fifthrequest = await writeDecryptedmsg();
//const eleventhRequest = await encryptedMsgWebpage();

    //console.log("\nAll tasks complete.");
    console.log('==== decrypt function complete ====\n')
}
// ---------------
performDecryptAsyncFunctions();
// ------------------
}); // end decrypt

//
// ==============
// sign plaintext message
// ==============
//
app.post('/sign', (req) => {
  console.log("\n==== sign plaintext message ====");
  mail = req.body.email; // req.body contains the parsed body of the request.
  var em = mail; //signer as email
  console.log("POST email value: "+ em);

// ----------------
// get plaintext file
var plaintextfile = 'data/plaintext.txt';
var plaintext; // message to sign
const getPlaintext = () => {
return new Promise(resolve => {
  plaintext = fs.readFileSync(cwd+plaintextfile).toString();
  //console.log('plaintext -- ',plaintext);
	resolve (plaintext);
  })
}

// ---------------
// get signer data
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
    //console.log('passphrase -- ',passphrase);
        resolve (firstname, lastname, passphrase);
        return firstname, lastname, passphrase;
      });
})
}

// -------------
// get private key from database
	//console.log(privateKey);     // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
 const getprivatekey = () => { // function gets private key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT prvkey FROM prvkey WHERE email LIKE '"+em+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PRR_ERROR", error });
        return result.JSON({ status: "PRR_ERROR", error });
      };
      console.log('Privatekeydata --',JSON.stringify(result, null, 2));
      console.log('privatekey -- ',result[0].prvkey);
      privateKeyArmored = result[0].prvkey;
      resolve(privateKeyArmored);
    });
  });
}

// ----------
// sign the message
var signedMessage;
async function signText() {
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase
    });
    const unsignedMessage = await openpgp.createCleartextMessage({ text: plaintext }); // input as Message object
    const cleartextMessage = await openpgp.sign({
        message: unsignedMessage, // CleartextMessage or Message object
        signingKeys: privateKey
    });
    console.log(cleartextMessage); // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
    signedMessage = cleartextMessage;
}

// ---------
// write signed message to file
var 	signedMsg = cwd+'data/signedplaintext.msg'
const writeSignedmsg = () => {
return new Promise(resolve => {
	fs.writeFile(signedMsg, signedMessage, err => {
		if (err) {
			console.error(err);
		} else {
		  resolve (console.log('// signed plaintext message file written successfully'));
		}
	})
})
}

async function performSignAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getPlaintext();
const secondRequest = await dbUserData();
const thirdRequest = await getprivatekey();
const fourthRequest = await signText(); // an async function
const fifthrequest = await writeSignedmsg();
//const eleventhRequest = await encryptedMsgWebpage();

    //console.log("\nAll tasks complete.");
    console.log('==== sign msg function complete ====\n')
}
// ---------------
performSignAsyncFunctions();
// ------------------
}); // end sign

//
// ==============
// verify signed message
// ==============
//
//needs signer as email
app.post('/verify', (req, res) => {
  console.log("\n==== verify signed plaintext message ====");
  mail = req.body.email; // req.body contains the parsed body of the request.
  var em = mail;
  console.log("POST email value: "+ em);

	// signed plaintext filename
	signedMsg = 'data/signedplaintext.msg'
var cleartextMessage;
const getSignedtext = () => {
return new Promise(resolve => {
  cleartextMessage = fs.readFileSync(cwd+signedMsg).toString();
	resolve (cleartextMessage);
})
} //console.log('signedMsg -- ',cleartextMessage);

// verifier data
// -------------
// get public key from database
	//console.log([public]Key);     // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
 const getpublickey = () => { // function gets public key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT pubkey FROM pubkey WHERE email LIKE '"+em+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PUR_ERROR", error });
        return result.JSON({ status: "PUR_ERROR", error });
      };
      console.log('Publickeydata --',JSON.stringify(result, null, 2));
      console.log('publickey -- ',result[0].pubkey);
      publicKeyArmored = result[0].pubkey;
      resolve(publicKeyArmored);
    });
  });
}

// verify
async function verifyText() {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const signedMessage = await openpgp.readCleartextMessage({
        cleartextMessage // parse armored message
    });
    const verificationResult = await openpgp.verify({
        message: signedMessage,
        verificationKeys: publicKey
    });
    console.log(verificationResult);
    const { verified, keyID } = verificationResult.signatures[0];
    //try {
    //    await verified; // throws on invalid signature
        console.log('Signed by hex key id ' + keyID.toHex());
    //} catch (e) {
    //    throw new Error('Signature could not be verified: ' + e.message);
    // Error: Could not find signing key with key ID 7a570e8ecbd88a6c
    console.log('// signed message file was not verified');
// }
}

async function performVerifyAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getSignedtext();
const secondRequest = await getpublickey();
const thirdRequest = await verifyText(); // an async function
//const eleventhRequest = await encryptedMsgWebpage();

    //console.log("\nAll tasks complete.");
    console.log('==== verify signed msg function complete ====\n')
}
// ---------------
performVerifyAsyncFunctions();
// ------------------
}); // end verify

//
// ==============
// encrypt and sign message
// ==============
// 
//needs signerem and email
app.post('/encryptsign', (req, res) => {
  console.log("\n==== encrypt and sign message ====");
  const mail = req.body.email; // req.body contains the parsed body of the request.
  console.log("POST email value: "+mail); // contains encrypter email and signer email
  var em = mail.split(' ')[0]; console.log(em);
  var signerem = mail.split(' ')[1]; console.log(signerem);

// ----------------
// get plaintext file
var plaintextfile = 'data/plaintext.txt';
var plaintext; // message to encrypt
const getPlaintext = () => {
return new Promise(resolve => {
  plaintext = fs.readFileSync(cwd+plaintextfile).toString();
  //console.log('plaintext -- ',plaintext);
	resolve (plaintext);
  })
}

// -------------
// get public key from database
	//console.log([public]Key);     // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
 const getpublickey = () => { // function gets public key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT pubkey FROM pubkey WHERE email LIKE '"+em+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PUR_ERROR", error });
        return result.JSON({ status: "PUR_ERROR", error });
      };
      console.log('Publickeydata --',JSON.stringify(result, null, 2));
      console.log('publickey -- ',result[0].pubkey);
      publicKeyArmored = result[0].pubkey;
      resolve(publicKeyArmored);
    });
  });
}

var passphrase;
// ---------------
// get signer data
const dbUserData = () => {
return new Promise(resolve => {
usersdb_conn.query("SELECT firstname, lastname, factors FROM users WHERE email LIKE '"+signerem+"'", (error, result) => {
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
    //console.log('passphrase -- ',passphrase);
        resolve (firstname, lastname, passphrase);
        return firstname, lastname, passphrase;
      });
})
}

// -------------
// get private key from database
	//console.log(privateKey);     // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
 const getprivatekey = () => { // function gets private key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT prvkey FROM prvkey WHERE email LIKE '"+signerem+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PRR_ERROR", error });
        return result.JSON({ status: "PRR_ERROR", error });
      };
      console.log('Privatekeydata --',JSON.stringify(result, null, 2));
      //console.log('privatekey -- ',result[0].prvkey);
      privateKeyArmored = result[0].prvkey;
      resolve(privateKeyArmored);
    });
  });
} // console.log('signing user -- ', signerem, passphrase);

// --------------
// encrypt and sign the message
var encsigned;
async function encsignText() {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase
    });
    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: plaintext }), // input as Message object
        signingKeys: privateKey, // optional
        encryptionKeys: publicKey
    });
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
    encsigned = encrypted;
}
// ---------
// write signed message to file
var encryptedMsg = cwd+'data/signedencrypted.msg';
const writeSignedmsg = () => {
return new Promise(resolve => {
	fs.writeFile(encryptedMsg, encsigned, err => {
		if (err) {
			console.error(err);
		} else {
		  resolve (console.log('// signed encrypted message file written successfully'));
		}
	})
})
}

async function performEncryptSignAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getPlaintext();
const secondRequest = await getpublickey();
const thirdRequest = await dbUserData();
const fourthRequest = await getprivatekey();
const fifthrequest = await encsignText(); // an async function
const sixthRequest = await writeSignedmsg();
//const eleventhRequest = await encryptedMsgWebpage();

    //console.log("\nAll tasks complete.");
    console.log('==== encrypt and sign msg function complete ====\n')
}
// ---------------
performEncryptSignAsyncFunctions();
// ------------------
}); // end encrypt and sign

//
// ==============
// decrypt and verify message
// ==============
//
//needs signerem and email
app.post('/decryptverify', (req, res) => {
  console.log("\n==== decrypt and verify message ====");
  mail = req.body.email; // req.body contains the parsed body of the request.
  console.log("POST email value: "+mail); // contains encrypter email and signer email
  var em = mail.split(' ')[0]; console.log(em);
  var signerem = mail.split(' ')[1]; console.log(signerem);

// ----------------
// get signed encrypted file
var senctextfile = 'data/signedencrypted.msg';
var senctext; // message to decrypt and verify
const getSenctext = () => {
return new Promise(resolve => {
  senctext = fs.readFileSync(cwd+senctextfile).toString();
  //console.log('signed-encrypted text -- ',senctext);
	resolve (senctext);
  })
}

var passphrase;
// ---------------
// get signer data
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
    //console.log('passphrase -- ',passphrase);
        resolve (firstname, lastname, passphrase);
        return firstname, lastname, passphrase;
      });
})
}

// -------------
// get private key from database
	//console.log(privateKey);     // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
 const getprivatekey = () => { // function gets private key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT prvkey FROM prvkey WHERE email LIKE '"+em+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PRR_ERROR", error });
        return result.JSON({ status: "PRR_ERROR", error });
      };
      console.log('Privatekeydata --',JSON.stringify(result, null, 2));
      //console.log('privatekey -- ',result[0].prvkey);
      privateKeyArmored = result[0].prvkey;
      resolve(privateKeyArmored);
    });
  });
}

// -------------
// get (signerem) public key from database
	//console.log([public]Key);     // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
 const getpublickey = () => { // function gets public key record
  return new Promise(resolve => {
    usersdb_conn.query("SELECT pubkey FROM pubkey WHERE email LIKE '"+signerem+"'", (error, result) => {
      if (error) {
        //return result.status(500).JSON({ status: "PUR_ERROR", error });
        return result.JSON({ status: "PUR_ERROR", error });
      };
      console.log('Publickeydata --',JSON.stringify(result, null, 2));
      console.log('publickey -- ',result[0].pubkey);
      publicKeyArmored = result[0].pubkey;
      resolve(publicKeyArmored);
    });
  });
}

// decrypt and verify
var decvfyed;
async function decvfyText() {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase
    });
    const message = await openpgp.readMessage({ armoredMessage: senctext // parse armored message 
    });
    //console.log(message);
    const decrypted  = await openpgp.decrypt({
        message,
        verificationKeys: publicKey, // optional
        decryptionKeys: privateKey
    });
    console.log(decrypted.data); // 'Hello, World!'
    decvfyed = decrypted.data;
}

// ---------
// write signed message to file
var decryptedMsg = cwd+'data/verifieddecrypted.msg';
const writedecvfy = () => {
return new Promise(resolve => {
	fs.writeFile(decryptedMsg, decvfyed, err => {
		if (err) {
			console.error(err);
		} else {
		  resolve (console.log('// verified decrypted message file written successfully'));
		}
	})
})
}

async function performDecryptVerifyAsyncFunctions(){
// list of promises to execute sequentially
const firstRequest = await getSenctext();
const secondRequest = await dbUserData();
const thirdRequest = await dbUserData();
const fourthRequest = await getprivatekey();
const fifthrequest = await getpublickey();
const sixthRequest = await decvfyText(); // an async function
const seventhrequest = await writedecvfy();
//const eleventhRequest = await encryptedMsgWebpage();

    //console.log("\nAll tasks complete.");
    console.log('==== decrypt and verify msg function complete ====\n')
}
// ---------------
performDecryptVerifyAsyncFunctions();
// ------------------
}); // end decrypt and verify

//
// ==================
// set up the HTTPS server
// =================
// Certificates
const priKey = fs.readFileSync('/etc/letsencrypt/live/syntheticreality.net/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/syntheticreality.net/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/syntheticreality.net/chain.pem', 'utf8');
const credentials = {
	key: priKey,
	cert: certificate,
	ca: ca
};
//const httpsServer = https.createServer({key, cert}, app);
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(8080, () => {
	console.log('HTTPS Server running on port 8080');
})