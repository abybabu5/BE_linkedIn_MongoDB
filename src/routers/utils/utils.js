const catchErrors = (server) => {
    //catch not found errors
    server.use((err, req, res, next) => {
        if (err.httpStatusCode === 404) {
            console.log(err);
            res.status(404).send("Resource not found!");
        }
        next(err);
    });
//catch not found errors
    server.use((err, req, res, next) => {
        if (err.httpStatusCode === 401) {
            console.log(err);
            res.status(401).send("Unauthorized!");
        }
        next(err);
    });
//catch forbidden errors
    server.use((err, req, res, next) => {
        if (err.httpStatusCode === 403) {
            console.log(err);
            res.status(403).send("Operation Forbidden");
        }
        next(err);
    });
//catch all
    server.use((err, req, res, next) => {
        if (!res.headersSent) {
            res.status(err.httpStatusCode || 500).send(err);
        }
    });

};

module.exports = {
    catchErrors
};