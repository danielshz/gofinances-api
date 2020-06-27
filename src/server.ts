import app from './app';

import connection from './database';

connection();

app.listen(3333, () => {
  console.log('🚀 Server started on port 3333!');
});
