const DATABASE_HOST = 'localhost';
const DATABASE_USER = 'root';
const DATABASE_PASSWORD = 'xxxxx';
const DATABASE_NAME = 'database';

const HTTP_SERVER_PORT = 3000;

const IMO_ICD_SERVER_HOST = "portal.sockhost.com";
const IMO_CPT_SERVER_HOST = "portal.sockhost.com";
const IMO_ICD_SERVER_PORT = "8022";
const IMO_CPT_SERVER_PORT = "8021";

const IMO_CLIENT_TIMEOUT = 5000;

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME
});
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
var router = express.Router();

var authToken;
connection.connect((err) => {
    if (err) throw err;
    connection.query("CREATE TABLE IF NOT EXISTS tbl_imo_access (fld_username VARCHAR(255) NOT NULL,fld_accesscount MEDIUMINT(10) NOT NULL DEFAULT 1,PRIMARY KEY (fld_username))", function(err, result, fields) {
        if (err) throw err;
        	console.log(result);
      });
    connection.query("select fld_desc2 from tbl_gen_desc where fld_type='ent_imo_relay_node_auth_token'", function(err, result, fields) {
        if (err) throw err;
        authToken = result[0].fld_desc2;
        console.log('Mysql Connected!');

        router.post('/', function(request, response) {
            var req = request.body;
            var autenticated = authToken == req.data.token;
            console.log('IMO Relay Autenticated ('+ req.data.username +') :' + autenticated);
            if(autenticated){
            	console.log(req.data.request);
                var imoResponse = '';
                var imoDataTimer = null;
                var timer = setInterval(function() {
                	console.log('timeout with no result');
                    response.json('{}');
                }, IMO_CLIENT_TIMEOUT);

                var imoHost = null;
                var imoPort = null;
                if (req.data.type == 'icd') {
                    imoHost = IMO_ICD_SERVER_HOST;
                    imoPort = IMO_ICD_SERVER_PORT;
                }
                if (req.data.type == 'cpt') {
                    imoHost = IMO_CPT_SERVER_HOST;
                    imoPort = IMO_CPT_SERVER_PORT;
                }
                var net = require('net');
                var imoClient = new net.Socket();
                imoClient.connect(imoPort, imoHost, function() {
                    imoClient.write(req.data.request + '\n');
                });
                imoClient.on('data', function(data) {
                    if (data.length > 4) {
                        imoResponse = imoResponse + data;
                        if (imoDataTimer != null) {
                            clearInterval(imoDataTimer);
                        }
                        imoDataTimer = setInterval(function() {
                        	console.log(imoResponse);
                        	response.write(imoResponse);
                        	response.end();
                            clearInterval(timer);
                            imoClient.setTimeout(1);
                            clearInterval(imoDataTimer);
                            connection.query("INSERT INTO tbl_imo_access(fld_username,fld_accesscount) VALUES('"+req.data.username+"',1) ON DUPLICATE KEY UPDATE fld_accesscount=fld_accesscount+1", function (err, result, fields) {
                                // if any error while executing above query, throw error
                                if (err) throw err;
                                // if there is no error, you have the result
                                console.log(result);
                              });
                        }, 100);
                    }
                });
                imoClient.setTimeout(IMO_CLIENT_TIMEOUT * 0.80);
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
            }else{
            	response.write('{}');
            	response.end();
            }
        });
        app.use('/', router);
        app.listen(HTTP_SERVER_PORT, function() {
            console.log('Listening at http://localhost:' + HTTP_SERVER_PORT);

            //Testing ICD...
            var Request = require("request");

            Request.post({
                "headers": {
                    "content-type": "application/json"
                },
                "url": "http://192.168.1.177:3000",
                "body": '{"data": {"username": "mdemodoc1","token": "*^$FRqE#^YiS#;$)&t_$#p#GRx*^%)#&%*TUOrr%^FJ#$3_gttr$)(_R$*j!*~Jt$f^&k(dTE$,(-_0","type": "icd","request": "search^20|0|2|1^heart|ShowFields(title, ICD10CM_CODE, ICD10CM_TITLE, SECONDARY_ICD10_CODE1, SECONDARY_ICD10_TEXT1, SECONDARY_ICD10_CODE2, SECONDARY_ICD10_TEXT2, SECONDARY_ICD10_CODE3, SECONDARY_ICD10_TEXT3, SECONDARY_ICD10_CODE4, SECONDARY_ICD10_TEXT4)^abcdefghijki"}}'
            }, (error, response, body) => {
                if (error) {
                    return console.dir(error);
                }
                console.log(body);
               // process.exit(1);
            });
            
            //Testing CPT...
            var Request = require("request");

            Request.post({
                "headers": {
                    "content-type": "application/json"
                },
                "url": "http://localhost:3000",
                "body": '{"data": {"username": "mdemocol1","token": "*^$FRqE#^YiS#;$)&t_$#p#GRx*^%)#&%*TUOrr%^FJ#$3_gttr$)(_R$*j!*~Jt$f^&k(dTE$,(-_0","type": "cpt","request": "search^20|0|2|1^heart|ShowFields(title,CPT_CODE,CPT_DESC_MEDIUM,CPT_DESC_LONG,HCPCS_CODE)^abcdefghijki"}}\n'

            }, (error, response, body) => {
                if (error) {
                    return console.dir(error);
                }
                console.log(body);
               // process.exit(1);
            });
        });
    });
});