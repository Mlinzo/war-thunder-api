const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware.js');
const generalRouter = require('./routes/generalRouter.js');
const notFoundRouter = require('./routes/notFoundRouter.js');

const PORT = process.env.PORT ?? 8888;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', generalRouter);
app.use(notFoundRouter);

app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));