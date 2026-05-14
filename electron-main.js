const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const net = require('net');

let mainWindow = null;
let nextProcess = null;

// ─────────────────────────────────────────────
// 단일 인스턴스 잠금: 두 번째 실행 시 첫 번째 창을 포커스하고 종료
// ─────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 이미 실행 중인 인스턴스가 있음 → 그냥 종료
  app.quit();
} else {
  app.on('second-instance', () => {
    // 두 번째 실행 시도 → 기존 창을 앞으로
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // ─────────────────────────────────────────────
  // 포트가 이미 사용 중인지 확인
  // ─────────────────────────────────────────────
  function isPortInUse(port) {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(true))
        .once('listening', () => tester.close(() => resolve(false)))
        .listen(port, '127.0.0.1');
    });
  }

  // ─────────────────────────────────────────────
  // 창 생성
  // ─────────────────────────────────────────────
  function createWindow(port) {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 850,
      title: 'WorkLog Auto',
      icon: path.join(__dirname, 'public', 'logo.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      backgroundColor: '#000000',
      show: false, // 로딩 완료 후 표시
    });

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    mainWindow.loadURL(`http://localhost:${port}`);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  // ─────────────────────────────────────────────
  // Next.js production 서버 시작
  // ─────────────────────────────────────────────
  function startNextServer(port) {
    return new Promise(async (resolve, reject) => {
      // 이미 포트가 열려 있으면 (다른 프로세스가 서버 중) 바로 사용
      const inUse = await isPortInUse(port);
      if (inUse) {
        console.log(`Port ${port} already in use, reusing existing server.`);
        return resolve();
      }

      const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

      if (!fs.existsSync(nextBin)) {
        const msg = 'Next.js 실행 파일을 찾을 수 없습니다.\nnode_modules가 올바르게 설치되었는지 확인해 주세요.';
        dialog.showErrorBox('실행 오류', msg);
        return reject(new Error('Next.js binary not found'));
      }

      const dotNextPath = path.join(__dirname, '.next');
      if (!fs.existsSync(dotNextPath)) {
        const msg = '.next 빌드 결과물이 없습니다.\n먼저 npm run build 를 실행해 주세요.';
        dialog.showErrorBox('빌드 없음', msg);
        return reject(new Error('.next build not found'));
      }

      console.log(`Starting Next.js production server on port ${port}...`);

      // ★ 핵심: next start (production) 사용 + ELECTRON_RUN_AS_NODE=1 으로 무한 재귀 방지
      nextProcess = spawn(
        process.execPath,
        [nextBin, 'start', '-p', port.toString()],
        {
          cwd: __dirname,
          env: {
            ...process.env,
            NODE_ENV: 'production',
            ELECTRON_RUN_AS_NODE: '1', // Electron이 자기 자신을 재실행하지 않도록
          },
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );

      nextProcess.stdout.on('data', (data) => {
        console.log('[Next]', data.toString().trim());
      });

      nextProcess.stderr.on('data', (data) => {
        console.error('[Next ERR]', data.toString().trim());
      });

      nextProcess.on('error', (err) => {
        dialog.showErrorBox('서버 실행 오류', err.message);
        reject(err);
      });

      nextProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`Next.js exited with code ${code}`);
        }
      });

      // 서버가 응답할 때까지 폴링
      let attempts = 0;
      const maxAttempts = 60; // 최대 30초 대기

      const checkServer = () => {
        attempts++;
        if (attempts > maxAttempts) {
          return reject(new Error(`서버가 ${maxAttempts / 2}초 내에 시작되지 않았습니다.`));
        }
        http.get(`http://localhost:${port}`, (res) => {
          console.log(`Server is up! (status: ${res.statusCode})`);
          resolve();
        }).on('error', () => {
          setTimeout(checkServer, 500);
        });
      };

      setTimeout(checkServer, 1500);
    });
  }

  // ─────────────────────────────────────────────
  // 앱 이벤트 핸들러
  // ─────────────────────────────────────────────
  app.on('ready', async () => {
    const port = 3002;
    try {
      await startNextServer(port);
      createWindow(port);
    } catch (err) {
      console.error('Failed to start app:', err);
      dialog.showErrorBox('앱 시작 실패', String(err.message || err));
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    // macOS는 창을 닫아도 앱이 Dock에 남아 있어야 함
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // macOS: Dock 아이콘 클릭 시 창이 없으면 새로 열기
    if (mainWindow === null) {
      createWindow(3002);
    }
  });

  app.on('quit', () => {
    if (nextProcess && !nextProcess.killed) {
      nextProcess.kill('SIGTERM');
    }
  });
}
