const { spawn } = require('child_process');
const path = require('path');

process.env.NODE_ENV = 'development';

let child;

function startServer() {
  child = spawn('npm', ['run', 'start:dev'], {
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: true
  });
}

process.on('exit', () => {
  if (child) {
    child.kill();
  }
});

export default startServer;
