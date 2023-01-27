const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware.js');
const generalRouter = require('./routes/generalRouter.js');
const notFoundRouter = require('./routes/notFoundRouter.js');
const api = require('./api')

const PORT = process.env.PORT ?? 8888;
const app = express();

api.start();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', generalRouter);
app.use(notFoundRouter);

app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));

process.on('SIGTERM', api.finish);
process.on('SIGINT', api.finish);