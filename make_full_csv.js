const fs = require('fs');
const http = require('https');

http.get('https://raw.githubusercontent.com/wilsonprashanth-code/pure-sure-backend/main/make_csv.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('make_csv.js', data);
    require('./make_csv.js');
  });
});
