module.exports = function(express, app, path) {
    app.use('/', express.static(__dirname + '/'));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,UPDATE,POST,DELETE');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    /*app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname+"/app/www/index.html"));
    });*/
}