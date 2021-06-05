<?php
	if(isset($_GET['seid']) && $_GET['seid']>0){
		$seid = $_GET['seid'];
	}
	else
		$seid = 1;
?>
<head>
	<script src="https://d3js.org/d3.v3.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.5.1.min.js" 
            integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="
            crossorigin="anonymous"></script>
	<script src="./hiveVisitorTree.js" type="text/javascript"></script>
	<link rel="stylesheet" href="./custom.css">
	<script>
		var seid = <?=$seid?>;
	</script>
</head>
<body>
  	<div>
  		<?php include("navigation.php"); ?>
 	</div>
	<div class="controlDiv">
		<button id="backBtn" class="btn blue-btn">Back</button>
		<button id="switchViewBtn" class="btn blue-btn">Big Nodes/Small Nodes</button>
	</div>
	<div id="container">
	</div>
	<div class="detail-panel">
		<div class="node-detail">
			<div class="title"></div>
		</div>
		<div class="user-container">

		</div>
	</div>
</body>