<?php
require 'dbconfig.php';
// include("header.php"); 

// First Put the person in the correct Room/Session ie:  D&D Talk 
//See if gcpseid is set. If not, set it to get variable.  Will check below if no variable.

// if a new seid is sent via url (get) then set $gcpseid to it
// otherwise gcpseid stays as it was empty or full
// if there is a session gcpseid then set gcpseid to that
// if there is no session gcpseid then use existing $gcpseid
// if after all that gcpseid is still empty, then set it to 1
// and set session to that also
// hierarchy:  Get, session, variable

if (isset($_GET["seid"]) && $_GET["seid"]>0)
{
	$gcpseid = $_GET["seid"];
	$_SESSION['gcpseid']= $gcpseid;
}
else
{
	$gcpseid = "1";
	$_SESSION['gcpseid']= $gcpseid;
}
/**
* ########################################################## <br>
* Get root session <br>
* ##########################################################<br>
*/
$query = "select * from Sessions WHERE seid=$gcpseid";
$session= mysqli_query($connection, $query);
$timestamp=$_SERVER['REQUEST_TIME'];
$root = null;
$max_depth = 1;
$max_usercount = 1;

if ($session->num_rows > 0) 
// if this session exists then get session details
{
	while($row = $session->fetch_assoc()){
		//$title = htmlspecialchars($row["stitle"]);
		//$admin = $row["adminid"];
		$youtube = $row["youtube"];
		$hseid = $row["seid"];
		$ctgcpseid = $hseid;
		//$hseid = "1";
		$stitle = htmlspecialchars($row['stitle']);
		$sdesc = htmlspecialchars($row['sdesc']);
		$adminid = $row['adminid'];
		$topicfocusid = $row['topicfocusid'];
		$facilid = $row['facilid'];

		$root['seid'] = $hseid;
		$root['name'] = "$stitle($hseid)";
		$root['children']=[];
		$root['userlist']=getUserStateBySeid($hseid);
		$max_usercount = $max_usercount>count($root['userlist'])?$max_usercount:count($root['userlist']);
	}
	$children = sub_topics($root['seid'], 1);

	// making response..
	$root['children']=$children;
	echo json_encode(["data"=>$root, "max_depth"=>$max_depth, "max_usercount"=>$max_usercount]);
}
else
	echo 'Thats not a valid node in this hive.';

function sub_topics($seid , $depth){
	global $connection , $root , $max_depth, $max_usercount;
	// select all topics focused on $hseid (parent topic)
	$query = "select * from Topics WHERE seid=$seid ORDER BY upvotes DESC, topid DESC";
	$topics= mysqli_query($connection, $query);
	$timestamp=$_SERVER['REQUEST_TIME'];

	$children = [];
	if ($topics->num_rows > 0) 
	{
		while($row = $topics->fetch_assoc()) 
		{
			if($row['seidperm']==$root['seid'])	 // in logical error case...
				continue;
			$stitle = htmlspecialchars($row['topic']);
			$subseid = $row["seidperm"];
			$parent = $seid;
			$child = [];
			$child['seid'] = $subseid;
			$child['name'] = "$stitle($subseid)(".$row['children'].")";
			$child['userlist'] = getUserStateBySeid($subseid);
			$max_usercount = $max_usercount>count($child['userlist'])?$max_usercount:count($child['userlist']);
			if($row["children"]>0)
				$child['children']=sub_topics($subseid, $depth+1);
			array_push($children, $child);
		}
		/******Get Max Depth & Max Children******/
		$max_depth = $max_depth>$depth?$max_depth:$depth;
	}
	else
		return [["seid"=>-1, "name"=>'no topics in this node!!' , "userlist"=>[]]];
	return $children;
}

function getUserStateBySeid($seid){
	global $connection;
	$query = "SELECT UID as id, Ffname as name FROM Users WHERE seid=$seid";

	$result = mysqli_query($connection, $query);
	$userlist = [];
	$result->num_rows > 0 && $userlist = mysqli_fetch_all($result, MYSQLI_ASSOC);

	return $userlist;
}