<?php
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');    // DB username
define('DB_PASSWORD', 'blade');    // DB password
define('DB_DATABASE', 'hive1_beta4');      // DB name
//$connection = mysql_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD) or die( "Unable to connect");
//$database = mysql_select_db(DB_DATABASE) or die( "Unable to select database");

$connection = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_DATABASE)  or die( "Unable to connect");



/* Select queries return a resultset */
/*
if ($result = mysqli_query($connection, "SELECT * FROM Users")) {
    printf("Select returned %d rows.\n", mysqli_num_rows($result));


    mysqli_free_result($result);
}

mysqli_close($connection);
*/

?>