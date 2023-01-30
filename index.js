const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware.js');
const router = require('./routes/router.js');
const routerNotFound = require('./routes/routerNotFound.js');
const api = require('./api')

const PORT = process.env.PORT ?? 8888;
const app = express();

api.start();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);
app.use(routerNotFound);

app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));

process.on('SIGTERM', async () => await api.finish());
process.on('SIGINT', async = () => api.finish())