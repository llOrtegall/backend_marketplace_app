import express from 'express';
import cors from 'cors';
import logs from 'morgan';

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(logs('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
