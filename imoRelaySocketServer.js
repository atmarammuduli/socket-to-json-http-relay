const DATABASE_HOST = 'localhost';
const DATABASE_USER = 'root';
const DATABASE_PASSWORD = 'xxxxx';
const DATABASE_NAME = 'database';

const HTTP_SERVER_PORT = 3000;

const IMO_ICD_SERVER_HOST = "portal.sockhost.com";
const IMO_CPT_SERVER_HOST = "portal.sockhost.com";
const IMO_ICD_SERVER_PORT = "8022";
const IMO_CPT_SERVER_PORT = "8021";
const mysql = require('mysql');

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME
});
var authToken;
connection.connect((err) => {
  if (err) throw err;
  connection.query("select desc from tbl_constants where fld_type='auth_token'", function (err, result, fields) {
	    if (err) throw err;
	    authToken = result[0].desc;
	    console.log('Mysql Connected!');
	    console.log('IMO Relay Auth Token :'+ authToken);
	    var net = require('net');
	    var server = net.createServer(function(socket) {
	    	socket.on('data', function(data) {
	    		if(authToken == null){
	    			 console.log('No auth token found in db!');
	    			process.exit();
	    		}
	    		 var req = JSON.parse(data.toString('utf8'));
	    		 var imoHost = null;
	    		 var imoPort = null;
	    		if(req.data.type == 'icd'){
	    			imoHost = IMO_ICD_SERVER_HOST;
	    			imoPort = IMO_ICD_SERVER_PORT;
	    		}
	    		if(req.data.type == 'cpt'){
	    			imoHost = IMO_CPT_SERVER_HOST;
	    			imoPort = IMO_CPT_SERVER_PORT;
	    		}
	    		 var net = require('net');
	    		 var imoClient = new net.Socket();
	    		 imoClient.connect(imoPort, imoHost, function() {
	    		 	imoClient.write(req.data.request+'\n');
	    		 });
	    		 imoClient.on('data', function(data) {
	    		 	if(data.length > 4){
	    		 		socket.write(data);
	    		 	}
	    		 });
	    		 imoClient.setTimeout(IMO_CLIENT_TIMEOUT);
	    		 imoClient.on('timeout', function() {
	    			 imoClient.destroy();
	 	        });
	    		 imoClient.on('close', function() {
	    		 	console.log('IMO Connection closed.');
	    		 });
	    		 imoClient.on('disconnect', function() {
		    		 	console.log('IMO Connection disss.');
		    		 });
	    		 imoClient.on('error', function(err) {
	    		 	   console.log(err);
	    		 	});
	    		 imoClient.on('end', function (){
	    			    socket.disconnect(0);
	    			});
	    	});
	    });
	    server.listen(SOCKET_SERVER_PORT, SOCKET_SERVER_HOST, function() {
	    	console.log('Server started on :'+ server.address().port);
	    	
	    	//Testing ICD.....
	    	var client = new net.Socket();
	    	client.connect(3000, 'localhost', function() {
	    		console.log('Test Client Connected for ICD...');
	    		client.write('{"data": {"username": "user1","type": "icd","request": "search^20|0|2|1^heart|ShowFields(title, ICD10CM_CODE, ICD10CM_TITLE, SECONDARY_ICD10_CODE1, SECONDARY_ICD10_TEXT1, SECONDARY_ICD10_CODE2, SECONDARY_ICD10_TEXT2, SECONDARY_ICD10_CODE3, SECONDARY_ICD10_TEXT3, SECONDARY_ICD10_CODE4, SECONDARY_ICD10_TEXT4)^absdfsocdser"}}\n');
	    	});
	    	client.on('data', function(data) {
	    		console.log('ICD RESULT : '+data.toString());
	    		
	    	});

	    	client.on('close', function() {
	    		console.log('Connection closed');
	    	});
	    	client.on('error', function(err) {
	    		   console.log(err)
	    	});
	    	
	    	//Testing ICD.....
	    	var cptClient = new net.Socket();
	    	cptClient.connect(3000, 'localhost', function() {
	    		console.log('Test cptClient Connected for CPT...');
	    		cptClient.write('{"data": {"username": "user1","type": "cpt","request": "search^20|0|2|1^heart|ShowFields(title,CPT_CODE,CPT_DESC_MEDIUM,CPT_DESC_LONG,HCPCS_CODE)^absdfsocdser"}}\n');
	    	});
	    	cptClient.on('data', function(data) {
	    		console.log('CPT RESULT : '+data.toString());
	    		
	    	});

	    	cptClient.on('close', function() {
	    		console.log('Connection closed');
	    	});
	    	cptClient.on('error', function(err) {
	    		   console.log(err)
	    	});
	    });
	  });
});








