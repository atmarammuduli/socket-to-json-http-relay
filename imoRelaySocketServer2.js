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
const net = require('net');
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
	    authToken = result[0].fld_desc2;
	    console.log('Mysql Connected!');
	    console.log('IMO Relay Auth Token :'+ authToken);
	    
	    var icdServer = net.createServer(function(socket) {
	    	socket.on('data', function(data) {
	    		if(authToken == null){
	    			 console.log('No auth token found in db!');
	    			process.exit();
	    		}
	    		 var req = JSON.parse(data.toString('utf8'));
	    		 var imoClient = new net.Socket();
	    		 imoClient.connect(IMO_ICD_SERVER_PORT, IMO_ICD_SERVER_HOST, function() {
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
	    		 	console.log('IMO ICD Connection closed.');
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
	    icdServer.listen(SOCKET_SERVER_ICD_PORT, SOCKET_SERVER_HOST, function() {
	    	console.log('Server started on :'+ icdServer.address().port);
	    	
	    	//Testing ICD.....
	    	var cptClient = new net.Socket();
	    	cptClient.connect(SOCKET_SERVER_ICD_PORT, 'localhost', function() {
	    		console.log('Test icdClient Connected for ICD...');
	    		cptClient.write('{"data": {"username": "user1","type": "cpt","request": "search^20|0|2|1^heart|ShowFields(title,CPT_CODE,CPT_DESC_MEDIUM,CPT_DESC_LONG,HCPCS_CODE)^absdfsocdser"}}\n');
	    	});
	    	cptClient.on('data', function(data) {
	    		console.log('ICD RESULT : '+data.toString());
	    		
	    	});

	    	cptClient.on('close', function() {
	    		console.log('Connection closed');
	    	});
	    	cptClient.on('error', function(err) {
	    		   console.log(err)
	    	});
	    });
	    
	    
	    
	    var cptServer = net.createServer(function(socket) {
	    	socket.on('data', function(data) {
	    		if(authToken == null){
	    			 console.log('No auth token found in db!');
	    			process.exit();
	    		}
	    		 var req = JSON.parse(data.toString('utf8'));
	    		 var imoClient = new net.Socket();
	    		 imoClient.connect(IMO_CPT_SERVER_PORT, IMO_CPT_SERVER_HOST, function() {
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
	    		 	console.log('IMO CPT Connection closed.');
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
	    cptServer.listen(SOCKET_SERVER_CPT_PORT, SOCKET_SERVER_HOST, function() {
	    	console.log('Server started on :'+ cptServer.address().port);
	    	
	    	//Testing CPT.....
	    	var cptClient = new net.Socket();
	    	cptClient.connect(SOCKET_SERVER_CPT_PORT, 'localhost', function() {
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








