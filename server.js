const express = require('express');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const port = process.env.PORT || 3000;

const app = express();
app.set('port', port);
app.use(express.static(publicDir));

app.listen(port, () = > {
  console.log(`App listening on port ${port}!`);
})