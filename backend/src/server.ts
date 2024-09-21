import express = require('express');
import { Request, Response} from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
