const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

// ==================== 配置 ====================
const PORT = process.env.PORT || 3000;
const ACCESS_CODE = '150113';
const ROOM_EXPIRY = 30 * 60 * 1000; // 30分钟无活动清理
const PING_INTERVAL = 20 * 1000; // 20秒心跳
const GAMES_DIR = path.join(__dirname, 'games');

// 确保保存目录存在
if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR, { recursive: true });

// ==================== HTTP 服务器 ====================
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const resolvedPath = path.resolve(__dirname, filePath);
    if (!resolvedPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
    };

    const contentType = contentTypes[extname] || 'text/plain; charset=utf-8';

    fs.readFile(resolvedPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('<h1>Server Error</h1>', 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// ==================== WebSocket 服务器 ====================
const wss = new WebSocketServer({ server, maxPayload: 2 * 1024 * 1024 });

// 房间数据存储
const rooms = new Map();

// 访问代码验证 Map
const accessCodeMap = new Map();

// 生成房间ID (01-99)
let nextRoomNum = 1;

function generateRoomId() {
    const id = String(nextRoomNum).padStart(2, '0');
    nextRoomNum = (nextRoomNum % 99) + 1;
    return id;
}

// 创建房间
function createRoom(accessCode) {
    const roomId = generateRoomId();
    const room = {
        id: roomId,
        accessCode: accessCode,
        host: null,
        join: null,
        spectators: [],
        boardSize: 13,
        board: null,
        currentPlayer: 1,
        hostChar: null,
        joinChar: null,
        hostName: '',
        joinName: '',
        gameOver: false,
        passCount: 0,
        komi: 7.5,
        blackTerritory: 0,
        whiteTerritory: 0,
        history: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
        // 限时落子配置
        timeLimit: 0, // 0=不限时，单位秒
        blackTimeLeft: 0,
        whiteTimeLeft: 0,
        timerInterval: null,
        // 棋局保存
        gameRecord: [], // 完整棋局记录
        saved: false,
        // 悔棋配置
        undoCount: 0,
        hostUndoLeft: 0,
        joinUndoLeft: 0,
    };
    
    rooms.set(roomId, room);
    
    if (!accessCodeMap.has(accessCode)) {
        accessCodeMap.set(accessCode, []);
    }
    accessCodeMap.get(accessCode).push(roomId);
    
    return roomId;
}

// 获取房间
function getRoom(roomId) {
    return rooms.get(roomId);
}

// 保存棋局到文件
function saveGame(room) {
    if (room.saved || room.history.length < 2) return;
    
    const record = {
        roomId: room.id,
        boardSize: room.boardSize,
        hostChar: room.hostChar,
        joinChar: room.joinChar,
        winner: room.gameOver ? (room.blackTerritory + room.komi > room.whiteTerritory ? 'black' : 'white') : null,
        blackTerritory: room.blackTerritory,
        whiteTerritory: room.whiteTerritory,
        komi: room.komi,
        history: room.history.map(h => ({ board: h.board, currentPlayer: h.currentPlayer, passCount: h.passCount })),
        gameOver: room.gameOver,
        savedAt: new Date().toISOString(),
    };
    
    const filename = `${room.id}_${Date.now()}.json`;
    const filepath = path.join(GAMES_DIR, filename);
    
    try {
        fs.writeFileSync(filepath, JSON.stringify(record), 'utf-8');
        room.saved = true;
        console.log(`Game saved: ${filename}`);
    } catch (err) {
        console.error('Save failed:', err);
    }
}

// 获取已保存棋局列表
function getSavedGames() {
    try {
        const files = fs.readdirSync(GAMES_DIR).filter(f => f.endsWith('.json'));
        const games = [];
        
        for (const file of files) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(GAMES_DIR, file), 'utf-8'));
                games.push({
                    filename: file,
                    roomId: data.roomId,
                    boardSize: data.boardSize,
                    hostChar: data.hostChar,
                    joinChar: data.joinChar,
                    winner: data.winner,
                    blackTerritory: data.blackTerritory,
                    whiteTerritory: data.whiteTerritory,
                    komi: data.komi,
                    historyLength: data.history ? data.history.length : 0,
                    savedAt: data.savedAt,
                });
            } catch (e) {}
        }
        
        // 按保存时间倒序
        games.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        return games;
    } catch (err) {
        console.error('Read games failed:', err);
        return [];
    }
}

// 加载棋局
function loadGame(filename) {
    try {
        const filepath = path.join(GAMES_DIR, filename);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        return data;
    } catch (err) {
        console.error('Load game failed:', err);
        return null;
    }
}

// 删除棋局
function deleteGame(filename) {
    try {
        const filepath = path.join(GAMES_DIR, filename);
        fs.unlinkSync(filepath);
        return true;
    } catch (err) {
        console.error('Delete game failed:', err);
        return false;
    }
}

// 启动限时计时器
function startTimer(room) {
    if (!room.timeLimit || room.gameOver) return;
    
    // 初始化时间
    room.blackTimeLeft = room.timeLimit;
    room.whiteTimeLeft = room.timeLimit;
    
    if (room.timerInterval) clearInterval(room.timerInterval);
    
    room.timerInterval = setInterval(() => {
        if (room.gameOver) {
            clearInterval(room.timerInterval);
            room.timerInterval = null;
            return;
        }
        
        // 只倒计时当前玩家的时间
        if (room.currentPlayer === 1) {
            room.blackTimeLeft--;
            if (room.blackTimeLeft <= 0) {
                room.blackTimeLeft = 0;
                room.gameOver = true;
                clearInterval(room.timerInterval);
                room.timerInterval = null;
                broadcastToRoom(room.id, {
                    type: 'time-up',
                    loserName: room.hostName || '黑方',
                    message: `${room.hostName || '黑方'}超时判负！`,
                    showFlag: true
                });
            }
        } else {
            room.whiteTimeLeft--;
            if (room.whiteTimeLeft <= 0) {
                room.whiteTimeLeft = 0;
                room.gameOver = true;
                clearInterval(room.timerInterval);
                room.timerInterval = null;
                broadcastToRoom(room.id, {
                    type: 'time-up',
                    loserName: room.joinName || '白方',
                    message: `${room.joinName || '白方'}超时判负！`,
                    showFlag: true
                });
            }
        }
        
        broadcastToRoom(room.id, {
            type: 'timer-update',
            blackTimeLeft: room.blackTimeLeft,
            whiteTimeLeft: room.whiteTimeLeft,
            currentPlayer: room.currentPlayer,
            timeLimit: room.timeLimit
        });
    }, 1000);
}

// 停止计时器
function stopTimer(room) {
    if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
    }
}

// 清理空房间
function cleanupOrphanRooms() {
    const now = Date.now();
    for (const [roomId, room] of rooms) {
        if (now - room.lastActivity > ROOM_EXPIRY) {
            console.log(`Room ${roomId} expired`);
            broadcastToRoom(roomId, { type: 'room-closed', reason: 'expired' });
            stopTimer(room);
            const roomAccessCodes = accessCodeMap.get(room.accessCode) || [];
            const idx = roomAccessCodes.indexOf(roomId);
            if (idx > -1) roomAccessCodes.splice(idx, 1);
            rooms.delete(roomId);
            continue;
        }
        
        if (!room.host && !room.join && room.spectators.length === 0) {
            stopTimer(room);
            const roomAccessCodes = accessCodeMap.get(room.accessCode) || [];
            const idx = roomAccessCodes.indexOf(roomId);
            if (idx > -1) roomAccessCodes.splice(idx, 1);
            rooms.delete(roomId);
        }
    }
}

setInterval(cleanupOrphanRooms, 60 * 1000);

// 心跳检测
const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            ws.terminate();
            return;
        }
        ws.isAlive = false;
        ws.ping();
    });
}, PING_INTERVAL);

wss.on('close', () => clearInterval(pingInterval));

// 广播到房间内所有连接
function broadcastToRoom(roomId, message, excludeWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;

    const msg = JSON.stringify(message);
    
    if (room.host && room.host !== excludeWs && room.host.readyState === 1) {
        room.host.send(msg);
    }
    if (room.join && room.join !== excludeWs && room.join.readyState === 1) {
        room.join.send(msg);
    }
    for (const spec of room.spectators) {
        if (spec !== excludeWs && spec.readyState === 1) {
            spec.send(msg);
        }
    }
}

// 发送消息给特定连接
function sendTo(ws, message) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(message));
    }
}

// 初始化棋盘
function initBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

// ==================== WebSocket 连接处理 ====================
wss.on('connection', (ws) => {
    console.log('New connection');
    ws.roomId = null;
    ws.role = null;
    
    // 心跳保活
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch (e) {
            console.error('Invalid JSON:', data);
            return;
        }

        // Update last activity for room
        if (ws.roomId) {
            const room = rooms.get(ws.roomId);
            if (room) room.lastActivity = Date.now();
        }

        switch (msg.type) {
            case 'verify-code':
                handleVerifyCode(ws, msg);
                break;
            case 'create-room':
                handleCreateRoom(ws, msg);
                break;
            case 'join-room':
                handleJoinRoom(ws, msg);
                break;
            case 'spectate-room':
                handleSpectateRoom(ws, msg);
                break;
            case 'place-stone':
                handlePlaceStone(ws, msg);
                break;
            case 'pass-move':
                handlePassMove(ws, msg);
                break;
            case 'resign':
                handleResign(ws, msg);
                break;
            case 'score-confirm':
                handleScoreConfirm(ws, msg);
                break;
            case 'undo':
                handleUndo(ws, msg);
                break;
            case 'score-reject':
                handleScoreReject(ws, msg);
                break;
            case 'get-games':
                handleGetGames(ws, msg);
                break;
            case 'load-game':
                handleLoadGame(ws, msg);
                break;
            case 'ping':
                // 客户端心跳响应，更新最后活动时间
                if (ws.roomId) {
                    const room = rooms.get(ws.roomId);
                    if (room) room.lastActivity = Date.now();
                }
                break;
 
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
        if (ws.roomId) {
            const room = rooms.get(ws.roomId);
            if (room) {
                if (ws === room.host) {
                    stopTimer(room);
                    if (room.waitTimer) { clearTimeout(room.waitTimer); room.waitTimer = null; }
                    sendTo(room.join, { type: 'opponent-disconnect', message: '对手已断开连接' });
                    broadcastToRoom(ws.roomId, { type: 'room-closed', reason: 'host-disconnected' });
                    saveGame(room);
                    const roomAccessCodes = accessCodeMap.get(room.accessCode) || [];
                    const idx = roomAccessCodes.indexOf(ws.roomId);
                    if (idx > -1) roomAccessCodes.splice(idx, 1);
                    rooms.delete(ws.roomId);
                    broadcastRoomList(ACCESS_CODE);
                } else if (ws === room.join) {
                    stopTimer(room);
                    if (room.waitTimer) { clearTimeout(room.waitTimer); room.waitTimer = null; }
                    sendTo(room.host, { type: 'opponent-disconnect', message: '对手已断开连接' });
                    broadcastToRoom(ws.roomId, { type: 'room-closed', reason: 'join-disconnected' });
                    saveGame(room);
                    const roomAccessCodes = accessCodeMap.get(room.accessCode) || [];
                    const idx = roomAccessCodes.indexOf(ws.roomId);
                    if (idx > -1) roomAccessCodes.splice(idx, 1);
                    rooms.delete(ws.roomId);
                    broadcastRoomList(ACCESS_CODE);
                } else {
                    room.spectators = room.spectators.filter(s => s !== ws);
                    if (room.spectatorNames) {
                        room.spectatorNames.pop();
                    }
                    broadcastToRoom(ws.roomId, { type: 'spectator-left', count: room.spectators.length, names: room.spectatorNames || [] });
                }
            }
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// ==================== 消息处理函数 ====================

function handleVerifyCode(ws, msg) {
    const { code } = msg;
    
    if (code !== ACCESS_CODE) {
       sendTo(ws, { type: 'error', message: '密码错误' });
        return;
    }
    
    ws._verified = true;
    const roomIds = accessCodeMap.get(code) || [];
    const availableRooms = [];
    
    for (const roomId of roomIds) {
        const room = rooms.get(roomId);
        if (!room) continue;
        
        // 已结束的房间不显示在房间列表
        if (room.gameOver) continue;
        
        // 计算玩家数
        const playerCount = (room.host ? 1 : 0) + (room.join ? 1 : 0);
        const slots = 2; // 最大2名玩家
        
         availableRooms.push({
            roomId: roomId,
            hostChar: room.hostChar,
            joinChar: room.joinChar || null,
            boardSize: room.boardSize,
            spectatorCount: room.spectators.length,
            playerCount: playerCount,
            slots: slots,
            hasHost: !!room.host,
            hasJoin: !!room.join,
            timeLimit: room.timeLimit,
            gameOver: room.gameOver,
            gameStatus: room.gameOver ? '已结束' : (playerCount < 2 ? '等待加入' : '对局中'),
            hostName: room.hostName || '',
            joinName: room.joinName || '',
        });
    }
    
    // 获取已结束的房间
    const endedRooms = [];
    for (const roomId of roomIds) {
        const room = rooms.get(roomId);
        if (!room || !room.gameOver) continue;
        
        endedRooms.push({
            roomId: roomId,
            boardSize: room.boardSize,
            hostName: room.hostName || '',
            joinName: room.joinName || '',
            gameOver: true,
            blackTerritory: room.blackTerritory,
            whiteTerritory: room.whiteTerritory,
        });
    }
    
    sendTo(ws, {
        type: 'code-verified',
        availableRooms: availableRooms,
        endedRooms: endedRooms,
    });
    
    // 广播房间列表更新给所有已验证的玩家
    broadcastRoomList(code);
}

function broadcastRoomList(code) {
    const roomIds = accessCodeMap.get(code) || [];
    const availableRooms = [];
    
    for (const roomId of roomIds) {
        const room = rooms.get(roomId);
        if (!room) continue;
        
        // 已结束的房间不显示在房间列表
        if (room.gameOver) continue;
        
        const playerCount = (room.host ? 1 : 0) + (room.join ? 1 : 0);
        
         const spectatorNames = (room.spectatorNames || []).slice(0, 4);
        
        availableRooms.push({
            roomId: roomId,
            hostChar: room.hostChar,
            joinChar: room.joinChar || null,
            boardSize: room.boardSize,
            spectatorCount: room.spectators.length,
            spectatorNames: spectatorNames,
            playerCount: playerCount,
            slots: 2,
            hasHost: !!room.host,
            hasJoin: !!room.join,
            timeLimit: room.timeLimit,
            gameOver: room.gameOver,
            gameStatus: room.gameOver ? '已结束' : (playerCount < 2 ? '等待加入' : '对局中'),
            hostName: room.hostName || '',
            joinName: room.joinName || '',
        });
    }
    
    wss.clients.forEach((client) => {
        if (client.readyState === 1 && client._verified) {
            sendTo(client, {
                type: 'room-list-update',
                availableRooms: availableRooms,
            });
        }
    });
}

function handleCreateRoom(ws, msg) {
    const { boardSize, timeLimit, hostName, undoCount } = msg;
    
    // 创建新房间
    const roomId = createRoom(ACCESS_CODE);
    const room = rooms.get(roomId);
    
    room.host = ws;
    ws.role = 'host';
    ws.roomId = roomId;
    room.boardSize = boardSize || 13;
    room.timeLimit = timeLimit || 30;
    room.hostName = hostName || '';
    room.undoCount = undoCount || 0;
    room.hostUndoLeft = undoCount || 0;
    room.joinUndoLeft = undoCount || 0;
    room.board = initBoard(room.boardSize);
    room.currentPlayer = 1;
    
    // 如果有时限，启动计时器
    if (room.timeLimit > 0) {
        startTimer(room);
    }
    
    sendTo(ws, {
        type: 'room-created',
        roomId: roomId,
        role: 'host',
        char: room.hostChar,
        boardSize: room.boardSize,
        joinChar: room.joinChar,
        timeLimit: room.timeLimit,
        undoCount: room.undoCount,
        hostUndoLeft: room.hostUndoLeft,
        joinUndoLeft: room.joinUndoLeft,
        hostName: room.hostName,
        joinName: room.joinName,
        message: '对局已创建'
    });
    
    console.log(`Room ${roomId} created by host (timeLimit: ${room.timeLimit}s, undo: ${room.undoCount})`);
    
    broadcastRoomList(ACCESS_CODE);
}

function handleJoinRoom(ws, msg) {
    const { roomId, joinName } = msg;
    
    const room = getRoom(roomId);
    
    if (!room) {
        sendTo(ws, { type: 'error', message: '房间不存在' });
        return;
    }
    
    // 如果是房主重新加入，允许继续作为房主
    if (ws === room.host && ws.role === 'host') {
        sendTo(ws, {
            type: 'room-joined',
            roomId: roomId,
            role: 'host',
            boardSize: room.boardSize,
            hostName: room.hostName,
            joinName: room.joinName,
            timeLimit: room.timeLimit,
            undoCount: room.undoCount,
            hostUndoLeft: room.hostUndoLeft,
            joinUndoLeft: room.joinUndoLeft,
            message: '房间已恢复'
        });
        return;
    }
    
    // 如果是参与者重新加入，允许继续作为参与者
    if (ws === room.join && ws.role === 'join') {
        sendTo(ws, {
            type: 'room-joined',
            roomId: roomId,
            role: 'join',
            boardSize: room.boardSize,
            hostName: room.hostName,
            joinName: room.joinName,
            timeLimit: room.timeLimit,
            undoCount: room.undoCount,
            hostUndoLeft: room.hostUndoLeft,
            joinUndoLeft: room.joinUndoLeft,
            message: '房间已恢复'
        });
        return;
    }
    
    if (room.join) {
        // 房间已满，检查是否可以观战
        if (room.gameOver) {
            sendTo(ws, { type: 'error', message: '对局已结束' });
            return;
        }
        if (room.spectators.length >= 10) {
            sendTo(ws, { type: 'error', message: '观战人数已满' });
            return;
        }
        // 允许加入为观战者
        room.spectators.push(ws);
        ws.role = 'spectator';
        ws.roomId = roomId;
        
        sendTo(ws, {
            type: 'spectate-joined',
            roomId: roomId,
            role: 'spectator',
            boardSize: room.boardSize,
            board: room.board.map(r => [...r]),
            currentPlayer: room.currentPlayer,
            hostChar: room.hostChar,
            joinChar: room.joinChar,
            hostName: room.hostName,
            joinName: room.joinName,
            spectatorCount: room.spectators.length,
            timeLimit: room.timeLimit,
            blackTimeLeft: room.blackTimeLeft,
            whiteTimeLeft: room.whiteTimeLeft,
            message: '观战模式'
        });
        
        broadcastToRoom(roomId, { type: 'spectator-joined', count: room.spectators.length });
        console.log(`Spectator joined room ${roomId}`);
        return;
    }
    
    if (room.gameOver) {
        sendTo(ws, { type: 'error', message: '对局已结束' });
        return;
    }
    
    room.join = ws;
    ws.role = 'join';
    ws.roomId = roomId;
    room.joinName = joinName || '';
    
    // 启动300秒等待计时器（房主需在规定时间内落子）
    if (room.waitTimer) clearTimeout(room.waitTimer);
    room.waitTimer = setTimeout(() => {
        if (room.host && room.join && !room.gameOver) {
            // 房主超时未准备，自动开始对局
            stopTimer(room);
            room.gameOver = true;
            saveGame(room);
            broadcastToRoom(roomId, {
                type: 'time-up',
                winnerName: room.joinName || '白方',
                message: `${room.hostName || '黑方'}未在300秒内准备，${room.joinName || '白方'}获胜！`,
                showFlag: true
            });
            const roomAccessCodes = accessCodeMap.get(room.accessCode) || [];
            const idx = roomAccessCodes.indexOf(roomId);
            if (idx > -1) roomAccessCodes.splice(idx, 1);
            rooms.delete(roomId);
        }
    }, 300000); // 300秒
    
    sendTo(room.host, {
        type: 'player-joined',
        joinName: room.joinName,
        message: `${room.joinName || '对手'}已加入！请在300秒内落子开始对局`
    });
    
    sendTo(ws, {
        type: 'room-joined',
        roomId: roomId,
        role: 'join',
        boardSize: room.boardSize,
        hostName: room.hostName,
        timeLimit: room.timeLimit,
        undoCount: room.undoCount,
        hostUndoLeft: room.hostUndoLeft,
        joinUndoLeft: room.joinUndoLeft,
        joinName: room.joinName,
        message: '加入成功'
    });
    
    broadcastToRoom(roomId, {
        type: 'game-started',
       boardSize: room.boardSize,
        board: room.board.map(r => [...r]),
        currentPlayer: room.currentPlayer,
        hostName: room.hostName,
        joinName: room.joinName,
        timeLimit: room.timeLimit,
        undoCount: room.undoCount,
        hostUndoLeft: room.hostUndoLeft,
        joinUndoLeft: room.joinUndoLeft,
        blackTimeLeft: room.blackTimeLeft,
        whiteTimeLeft: room.whiteTimeLeft,
    });
    
    console.log(`Player joined room ${roomId}`);
    
    broadcastRoomList(ACCESS_CODE);
}

function handleSpectateRoom(ws, msg) {
    const { roomId, spectatorName } = msg;
    
    const room = getRoom(roomId);
    
    if (!room) {
        sendTo(ws, { type: 'error', message: '房间不存在' });
        return;
    }
    
    if (room.spectators.length >= 10) {
        sendTo(ws, { type: 'error', message: '观战人数已满' });
        return;
    }
    
    // 存储旁观者名字
    if (!room.spectatorNames) room.spectatorNames = [];
    room.spectatorNames.push(spectatorName || `观众${room.spectatorNames.length + 1}`);
    
    room.spectators.push(ws);
    ws.role = 'spectator';
    ws.roomId = roomId;
    
    sendTo(ws, {
        type: 'spectate-joined',
        roomId: roomId,
        role: 'spectator',
        boardSize: room.boardSize,
        board: room.board.map(r => [...r]),
        currentPlayer: room.currentPlayer,
        hostChar: room.hostChar,
        joinChar: room.joinChar,
        hostName: room.hostName,
        joinName: room.joinName,
        spectatorCount: room.spectators.length,
        timeLimit: room.timeLimit,
        blackTimeLeft: room.blackTimeLeft,
        whiteTimeLeft: room.whiteTimeLeft,
        spectatorNames: room.spectatorNames,
        message: '观战模式'
    });
    
    broadcastToRoom(roomId, { type: 'spectator-joined', count: room.spectators.length, names: room.spectatorNames });
    
   console.log(`Spectator joined room ${roomId}`);
    
    broadcastRoomList(ACCESS_CODE);
}

function handlePlaceStone(ws, msg) {
    const { roomId, row, col } = msg;
    const room = getRoom(roomId);
    
    if (!room || room.gameOver) return;
    if (ws.role === 'spectator') {
        sendTo(ws, { type: 'error', message: '观战者不能落子' });
        return;
    }
    
    const isHostTurn = (ws === room.host && room.currentPlayer === 1);
    const isJoinTurn = (ws === room.join && room.currentPlayer === 2);
    
    if (!isHostTurn && !isJoinTurn) {
        sendTo(ws, { type: 'error', message: '不是你的回合' });
        return;
    }
    
    if (room.board[row][col] !== 0) {
        sendTo(ws, { type: 'error', message: '位置已有棋子' });
        return;
    }
    
    // 清除等待计时器（房主已落子，对局开始）
    if (room.waitTimer) {
        clearTimeout(room.waitTimer);
        room.waitTimer = null;
    }
    
    // 保存历史状态
    room.history.push({
        board: room.board.map(r => [...r]),
        currentPlayer: room.currentPlayer,
        passCount: room.passCount,
        blackTimeLeft: room.blackTimeLeft,
        whiteTimeLeft: room.whiteTimeLeft,
    });
    
    // 记录到棋局
    room.gameRecord.push({
        type: 'place-stone',
        row, col,
        player: room.currentPlayer,
        timestamp: Date.now(),
    });
    
    room.board[row][col] = room.currentPlayer;
    room.passCount = 0;
    room.lastActivity = Date.now();
    
    const captured = removeDeadStones(room, row, col);
    
    if (captured === -1) {
        const prev = room.history.pop();
        room.board = prev.board;
        room.currentPlayer = prev.currentPlayer;
        room.passCount = prev.passCount;
        sendTo(ws, { type: 'error', message: '禁止自杀' });
        return;
    }
    
    // 落子后，重置刚刚落子玩家的时间为 timeLimit
    if (room.timeLimit > 0) {
        if (ws.role === 'host') {
            room.blackTimeLeft = room.timeLimit;
        } else {
            room.whiteTimeLeft = room.timeLimit;
        }
    }
    
    room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
    
    broadcastToRoom(roomId, {
        type: 'board-update',
        board: room.board.map(r => [...r]),
        currentPlayer: room.currentPlayer,
        passCount: room.passCount,
        captured: captured,
        row: row,
        col: col,
        playerRole: ws.role,
        blackTimeLeft: room.blackTimeLeft,
        whiteTimeLeft: room.whiteTimeLeft,
    });
}

function handlePassMove(ws, msg) {
    const roomId = msg.roomId;
    const room = getRoom(roomId);
    
    if (!room || room.gameOver) return;
    if (ws.role === 'spectator') return;
    
    room.passCount++;
    room.lastActivity = Date.now();
    
    room.history.push({
        board: room.board.map(r => [...r]),
        currentPlayer: room.currentPlayer,
        passCount: room.passCount - 1,
    });
    
    room.gameRecord.push({
        type: 'pass',
        player: ws.role,
        timestamp: Date.now(),
    });
    
    // 停手后，重置停手玩家的时间为 timeLimit
    if (room.timeLimit > 0) {
        if (ws.role === 'host') {
            room.blackTimeLeft = room.timeLimit;
        } else {
            room.whiteTimeLeft = room.timeLimit;
        }
    }
    
    room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
    
    broadcastToRoom(roomId, {
        type: 'pass-move',
        passCount: room.passCount,
        currentPlayer: room.currentPlayer,
        playerRole: ws.role,
        blackTimeLeft: room.blackTimeLeft,
        whiteTimeLeft: room.whiteTimeLeft
    });
    
    if (room.passCount >= 2) {
        calculateTerritory(room);
        saveGame(room);
        broadcastToRoom(roomId, {
            type: 'score-ready',
            blackTerritory: room.blackTerritory,
            whiteTerritory: room.whiteTerritory,
            komi: room.komi
        });
    }
}

function handleResign(ws, msg) {
    const roomId = msg.roomId;
    const room = getRoom(roomId);
    
    if (!room) return;
    if (ws.role === 'spectator') return;
    
    stopTimer(room);
    room.gameOver = true;
    
    saveGame(room);
    
    const loserName = (ws === room.host) ? (room.hostName || '黑方') : (room.joinName || '白方');
    const winnerName = (ws === room.host) ? (room.joinName || '白方') : (room.hostName || '黑方');
    
    broadcastToRoom(roomId, {
        type: 'game-end',
        winnerName: winnerName,
        loserName: loserName,
        message: `${loserName}认输判负`,
        showFlag: true
    });
}

function handleScoreConfirm(ws, msg) {
    const roomId = msg.roomId;
    const room = getRoom(roomId);
    
    if (!room) return;
    if (room.gameOver) return;
    
    // 第一次提议：服务器端使用成熟算法计算领地，发起方自动确认
    if (!room.scoreProposal || !room.scoreProposal.proposer) {
        const territory = calculateTerritoryServer(room);
        
        room.scoreProposal = {
            blackTerritory: territory.black,
            whiteTerritory: territory.white,
            proposer: ws.role
        };
        
        // 发起方自动确认
        if (ws === room.host) {
            room.scoreConfirmed = { host: true, join: false };
        } else if (ws === room.join) {
            room.scoreConfirmed = { host: false, join: true };
        } else {
            room.scoreConfirmed = { host: false, join: false };
        }
        
        broadcastToRoom(roomId, {
            type: 'score-proposal',
            blackTerritory: territory.black,
            whiteTerritory: territory.white,
            komi: room.komi,
            proposerRole: ws.role,
            hostConfirmed: room.scoreConfirmed.host,
            joinConfirmed: room.scoreConfirmed.join
        });
        return;
    }
    
    // 确认操作（非发起方确认）
    if (ws === room.host) {
        room.scoreConfirmed.host = true;
    } else if (ws === room.join) {
        room.scoreConfirmed.join = true;
    }
    
    // 广播确认状态
    broadcastToRoom(roomId, {
        type: 'score-confirm-status',
        hostConfirmed: !!room.scoreConfirmed.host,
        joinConfirmed: !!room.scoreConfirmed.join,
        blackTerritory: room.scoreProposal.blackTerritory,
        whiteTerritory: room.scoreProposal.whiteTerritory,
        komi: room.komi
    });
    
    // 双方都确认后生效
    if (room.scoreConfirmed.host && room.scoreConfirmed.join) {
        stopTimer(room);
        room.gameOver = true;
        room.blackTerritory = room.scoreProposal.blackTerritory;
        room.whiteTerritory = room.scoreProposal.whiteTerritory;
        
        saveGame(room);
        
        const blackTotal = room.blackTerritory + room.komi;
        const winner = blackTotal > room.whiteTerritory ? 'black' : 'white';
        const loser = winner === 'black' ? 'white' : 'black';
        const winnerName = winner === 'black' ? (room.hostName || '黑方') : (room.joinName || '白方');
        const loserName = loser === 'black' ? (room.hostName || '黑方') : (room.joinName || '白方');
        
        broadcastToRoom(roomId, {
            type: 'game-end',
            winnerName: winnerName,
            loserName: loserName,
            message: `${winnerName}获胜！${loserName}判负`,
            showFlag: true,
            blackTerritory: room.blackTerritory,
            whiteTerritory: room.whiteTerritory,
            blackTotal: blackTotal
        });
    }
}

function handleScoreReject(ws, msg) {
    const roomId = msg.roomId;
    const room = getRoom(roomId);
    
    if (!room || !room.scoreProposal) return;
    
    broadcastToRoom(roomId, {
        type: 'score-rejected',
        message: '对方拒绝了数子提议'
    });
    
    room.scoreProposal = null;
    room.scoreConfirmed = null;
}

function handleUndo(ws, msg) {
    const roomId = msg.roomId;
    const room = getRoom(roomId);
    
    if (!room || room.gameOver) return;
    if (ws.role === 'spectator') return;
    
    // 检查悔棋次数
    let undoLeft = 0;
    if (ws === room.host) {
        undoLeft = room.hostUndoLeft;
    } else if (ws === room.join) {
        undoLeft = room.joinUndoLeft;
    }
    
    if (undoLeft <= 0) {
        sendTo(ws, { type: 'error', message: '悔棋次数已用完' });
        return;
    }
    
    // 只能悔自己的棋，不能悔对方的棋
    const lastMove = room.history[room.history.length - 1];
    if (!lastMove) return;
    
    // 检查最后一步是否是自己下的
    const isLastMoveMine = (ws === room.host && lastMove.currentPlayer === 2) || 
                           (ws === room.join && lastMove.currentPlayer === 1);
    
    if (!isLastMoveMine) {
        sendTo(ws, { type: 'error', message: '只能悔自己的棋' });
        return;
    }
    
    // 执行悔棋：回退最后一步
    const prevState = room.history.pop();
    room.board = prevState.board;
    room.currentPlayer = prevState.currentPlayer;
    room.passCount = prevState.passCount || 0;
    
    if (ws === room.host) {
        room.hostUndoLeft--;
    } else {
        room.joinUndoLeft--;
    }
    
    broadcastToRoom(roomId, {
        type: 'board-update',
        board: room.board.map(r => [...r]),
        currentPlayer: room.currentPlayer,
        passCount: room.passCount,
        undoBy: ws.role,
        hostUndoLeft: room.hostUndoLeft,
        joinUndoLeft: room.joinUndoLeft,
        blackTimeLeft: room.blackTimeLeft,
        whiteTimeLeft: room.whiteTimeLeft,
    });
}

function handleGetGames(ws, msg) {
    const games = getSavedGames();
    sendTo(ws, { type: 'games-list', games: games });
}

function handleLoadGame(ws, msg) {
    const { filename } = msg;
    const data = loadGame(filename);
    
    if (data) {
        sendTo(ws, { type: 'game-loaded', game: data });
    } else {
        sendTo(ws, { type: 'error', message: '棋局不存在' });
    }
}

// ==================== 围棋规则函数 ====================
function removeDeadStones(room, lastRow, lastCol) {
    const color = room.board[lastRow][lastCol];
    const opponent = color === 1 ? 2 : 1;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const visited = new Set();
    
    let captured = 0;
    
    for (const [dr, dc] of dirs) {
        const nr = lastRow + dr, nc = lastCol + dc;
        if (nr < 0 || nr >= room.boardSize || nc < 0 || nc >= room.boardSize || room.board[nr][nc] !== opponent) continue;
        const key = nr * room.boardSize + nc;
        if (visited.has(key)) continue;
        
        const group = [], queue = [[nr, nc]];
        visited.add(key);
        let hasLiberty = false;
        
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            group.push([r, c]);
            for (const [dr2, dc2] of dirs) {
                const gr = r + dr2, gc = c + dc2;
                if (gr < 0 || gr >= room.boardSize || gc < 0 || gc >= room.boardSize) continue;
                if (room.board[gr][gc] === 0) { hasLiberty = true; break; }
                if (room.board[gr][gc] === opponent && !visited.has(gr * room.boardSize + gc)) {
                    visited.add(gr * room.boardSize + gc);
                    queue.push([gr, gc]);
                }
            }
            if (hasLiberty) break;
        }
        
        if (!hasLiberty) {
            for (const [r, c] of group) {
                room.board[r][c] = 0;
                captured++;
            }
        }
    }
    
    const selfKey = lastRow * room.boardSize + lastCol;
    if (!visited.has(selfKey)) {
        const sq = [[lastRow, lastCol]], selfVisited = new Set([selfKey]);
        let selfLiberty = false;
        while (sq.length > 0) {
            const [r, c] = sq.shift();
            for (const [dr2, dc2] of dirs) {
                const gr = r + dr2, gc = c + dc2;
                if (gr < 0 || gr >= room.boardSize || gc < 0 || gc >= room.boardSize) continue;
                if (room.board[gr][gc] === 0) { selfLiberty = true; break; }
                if (room.board[gr][gc] === color && !selfVisited.has(gr * room.boardSize + gc)) {
                    selfVisited.add(gr * room.boardSize + gc);
                    sq.push([gr, gc]);
                }
            }
            if (selfLiberty) break;
        }
        if (!selfLiberty) {
            return -1;
        }
    }
    
    return captured;
}

function calculateTerritory(room) {
    const visited = Array.from({ length: room.boardSize }, () => Array(room.boardSize).fill(false));
    let blackScore = 0, whiteScore = 0;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    
    // 第一阶段：计算棋盘上每颗活子的归属（中国规则：子+地）
    // 使用 flood fill 标记每个连通块及其气
    for (let r = 0; r < room.boardSize; r++) {
        for (let c = 0; c < room.boardSize; c++) {
            if (room.board[r][c] !== 0 && !visited[r][c]) {
                const color = room.board[r][c];
                // 找到这个棋子的连通块
                const group = [], queue = [[r, c]];
                visited[r][c] = true;
                let hasLiberty = false;
                const liberties = new Set();
                
                while (queue.length > 0) {
                    const [cr, cc] = queue.shift();
                    group.push([cr, cc]);
                    for (const [dr, dc] of dirs) {
                        const nr = cr + dr, nc = cc + dc;
                        if (nr < 0 || nr >= room.boardSize || nc < 0 || nc >= room.boardSize) continue;
                        if (room.board[nr][nc] === 0) {
                            hasLiberty = true;
                            liberties.add(nr * room.boardSize + nc);
                        } else if (room.board[nr][nc] === color && !visited[nr][nc]) {
                            visited[nr][nc] = true;
                            queue.push([nr, nc]);
                        }
                    }
                }
                
                // 有气的活子：这个连通块的所有棋子都算作该玩家的"子"
                if (hasLiberty) {
                    blackScore += group.length;
                }
            }
        }
    }
    
    // 重置 visited，用于计算空地
    for (let r = 0; r < room.boardSize; r++) {
        for (let c = 0; c < room.boardSize; c++) {
            visited[r][c] = false;
        }
    }
    
    // 第二阶段：计算空地归属（Flood Fill）
    for (let r = 0; r < room.boardSize; r++) {
        for (let c = 0; c < room.boardSize; c++) {
            if (room.board[r][c] !== 0 || visited[r][c]) continue;
            
            const region = [], queue = [[r, c]];
            visited[r][c] = true;
            let touchesBlack = false, touchesWhite = false;
            
            while (queue.length > 0) {
                const [cr, cc] = queue.shift();
                region.push([cr, cc]);
                for (const [dr, dc] of dirs) {
                    const nr = cr + dr, nc = cc + dc;
                    if (nr < 0 || nr >= room.boardSize || nc < 0 || nc >= room.boardSize) continue;
                    if (room.board[nr][nc] !== 0) {
                        if (room.board[nr][nc] === 1) touchesBlack = true;
                        else touchesWhite = true;
                        continue;
                    }
                    if (!visited[nr][nc]) {
                        visited[nr][nc] = true;
                        queue.push([nr, nc]);
                    }
                }
            }
            
            // 空地判给完全包围的一方
            if (touchesBlack && !touchesWhite) {
                blackScore += region.length;
            } else if (touchesWhite && !touchesBlack) {
                whiteScore += region.length;
            }
            // 双方都未完全包围的公气：不计入任何一方（和棋处理）
        }
    }
    
    room.blackTerritory = blackScore;
    room.whiteTerritory = whiteScore;
}

// 服务器端计算领地（用于数子确认时的权威结果）
function calculateTerritoryServer(room) {
    const visited = Array.from({ length: room.boardSize }, () => Array(room.boardSize).fill(false));
    let blackScore = 0, whiteScore = 0;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    
    // 第一阶段：计算活子数量
    for (let r = 0; r < room.boardSize; r++) {
        for (let c = 0; c < room.boardSize; c++) {
            if (room.board[r][c] !== 0 && !visited[r][c]) {
                const color = room.board[r][c];
                const group = [], queue = [[r, c]];
                visited[r][c] = true;
                let hasLiberty = false;
                
                while (queue.length > 0) {
                    const [cr, cc] = queue.shift();
                    group.push([cr, cc]);
                    for (const [dr, dc] of dirs) {
                        const nr = cr + dr, nc = cc + dc;
                        if (nr < 0 || nr >= room.boardSize || nc < 0 || nc >= room.boardSize) continue;
                        if (room.board[nr][nc] === 0) {
                            hasLiberty = true;
                        } else if (room.board[nr][nc] === color && !visited[nr][nc]) {
                            visited[nr][nc] = true;
                            queue.push([nr, nc]);
                        }
                    }
                }
                
                if (hasLiberty) {
                    if (color === 1) blackScore += group.length;
                    else whiteScore += group.length;
                }
            }
        }
    }
    
    // 重置 visited，用于计算空地
    for (let r = 0; r < room.boardSize; r++) {
        for (let c = 0; c < room.boardSize; c++) {
            visited[r][c] = false;
        }
    }
    
    // 第二阶段：计算空地归属
    for (let r = 0; r < room.boardSize; r++) {
        for (let c = 0; c < room.boardSize; c++) {
            if (room.board[r][c] !== 0 || visited[r][c]) continue;
            
            const region = [], queue = [[r, c]];
            visited[r][c] = true;
            let touchesBlack = false, touchesWhite = false;
            
            while (queue.length > 0) {
                const [cr, cc] = queue.shift();
                region.push([cr, cc]);
                for (const [dr, dc] of dirs) {
                    const nr = cr + dr, nc = cc + dc;
                    if (nr < 0 || nr >= room.boardSize || nc < 0 || nc >= room.boardSize) continue;
                    if (room.board[nr][nc] !== 0) {
                        if (room.board[nr][nc] === 1) touchesBlack = true;
                        else touchesWhite = true;
                        continue;
                    }
                    if (!visited[nr][nc]) {
                        visited[nr][nc] = true;
                        queue.push([nr, nc]);
                    }
                }
            }
            
            if (touchesBlack && !touchesWhite) {
                blackScore += region.length;
            } else if (touchesWhite && !touchesBlack) {
                whiteScore += region.length;
            }
        }
    }
    
    return { black: blackScore, white: whiteScore };
}

// ==================== 启动服务器 ====================
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
    console.log(`Access code: ${ACCESS_CODE}`);
    console.log(`Games saved to: ${GAMES_DIR}`);
});
