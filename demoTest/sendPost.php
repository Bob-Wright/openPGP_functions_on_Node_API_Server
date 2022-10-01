<?php
// disable this error reporting for production code
error_reporting(E_ALL);
ini_set('display_errors', TRUE);

// Start session
session_name("Storybook");
//	@session_start(); // we use Zebra database sessions handler
require("/var/www/session2DB/Zebra.php");

$_SESSION["email"] = "itzbobwright@gmail.com";

// HTML head and styles section content
$htmltop = <<< html1
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Storybook Mugshots</title>
	<!-- <base href="./"> -->
	<base href="./">
    <meta name="description" content="part of the Synthetic Reality Storybook comic book gallery">
    <meta name="author" content="Bob Wright and other contributors">
    <!-- Bootstrap core CSS -->
	<link href="../css/bootstrap.min.css" rel="stylesheet">
   <!--    <link rel="manifest" href="site.webmanifest"> -->
	<link rel="icon" href="../favicon.ico" type="image/ico"/>
	<link rel="shortcut icon" href="../favicon.ico" type="image/x-icon"/>
<script src="../js/jquery.min.js"></script>
<script src= "../js/bootstrap.min.js"></script>
<style>
.pageWrapper:before {
    content: ' ';
    display: block;
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
/*	background: #008; */
	z-index: -1;
    opacity: 0.6;
    background-image: url("../images/RockwallBackground.jpg");
	background-position: top center;
    background-repeat: no-repeat;
    -ms-background-size: 100% 100%;
    -o-background-size: 100% 100%;
    -moz-background-size: 100% 100%;
    -webkit-background-size: 100% 100%;
    background-size: 100% 100%;
}
body {
width: 100%;
 font-size: 2.4vw;
 overflow-x: hidden;
}
main {
width: 100%;
}
h1 {
font-size: 4vw;
}
h2 {
font-size: 3.2vw;
}
h3 {
font-size: 2.6vw;
}
h4 {
font-size: 2vw;
}
.suspect {
max-height: 5vw;
margin: .1vw;
padding: .2vw;
/*transform: translateX(30%);*/
}
a:focus, a:hover {
  /*background-color: GreenYellow;*/
  	outline: .5vw solid GreenYellow;
	outline-offset: .1vw;
	cursor: pointer;
}
input:focus, input:hover {
  /*background-color: GreenYellow;*/
  	outline: .5vw solid GreenYellow;
	outline-offset: .1vw;
	cursor: pointer;
}
button.gallery {
background: rgba(0,0,0,0);
border: 0;
}
button:focus, button:hover {
  background-color: GreenYellow;
  	outline: .5vw solid #b22242;
} 
</style>
</head>
<!-- Page display begins -->
<body class="pageWrapper">
<main class="container" role="main">
<div class="container flex-col col-11">
	<form action="https://messenga.net:8080/keyz" method="post" enctype="text">
    <button type="submit" name="email" value="itzbobwright@gmail.com"><h2 style="background:#f3ff86;color: blue;">Send Post to Messenga</h2></button>
  </form>
</div>
</main></body></html>
html1;
echo $htmltop; // display the HTML head and styles content above
?>