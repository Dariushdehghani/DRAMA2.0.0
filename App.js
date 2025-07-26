const express = require('express')
const App = express()
const http = require('http')
const server = http.createServer(App)
const { Server } = require('socket.io')
const io = new Server(server)
const localhost = 56470;
const  {  v4 : uuidv4  }  =  require ( 'uuid' ) ;

//data base
const sqlite = require("sqlite3").verbose();
db = new sqlite.Database('./data/data.sqlite')

App.get('/', (_, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

App.get('/signin', (_, res) => {
    res.sendFile(__dirname + '/public/signin.html')
})

App.get('/home', (_, res) => {
    res.sendFile(__dirname + '/public/home.html')
})

App.use('/npm', express.static(__dirname + '/node_modules'))

App.get('/home/*', (_, res) => {
    res.sendFile(__dirname + '/public/home.html')
})

App.get('/DRAMACOM-signin', (_, res) => {
    res.sendFile(__dirname + '/public/dramacom.html')
})

App.get('/rooms', (_, res) => {
    res.sendFile(__dirname + '/public/video_conference.html')
})

App.use(express.static('public'))

const rooms = {}

io.on('connection', socket => {
    console.log('new user, id:' + socket.id)
    socket.on('add_peer_id', ({id, user}) => {
        if (id, user) {
            db.run(`UPDATE users SET key2 = '${id}' , online = 'true' WHERE username = '${user.username}' AND password = '${user.password}'`)
        }
    })
    socket.on('signup_request', arg => {
        if (arg.name.length > 8 && arg.email.length > 8 && arg.password.length > 8) {
            db.get(`SELECT count(*) from users where username = '${arg.name}'`, (err, data) => {
                if (err) {
                    console.log('error line 30')
                } else if (data['count(*)'] > 0) {
                    socket.emit('syntax_error', 'This username exists, please try something else')
                } else {
                    db.run(`INSERT INTO users (key1, key3, username, email, password, online) VALUES ('${socket.id}', '${key3}', '${arg.name}', '${arg.email}', '${arg.password}', 'true' )`)
                    socket.emit('signed_in', {key1: socket.id, username: arg.name, email: arg.email, password: arg.password })
                    console.log(arg.name)
                }
            })
        } else {
            socket.emit('syntax_error', 'heh,heh,heh, the security is higher than you ;)')
        }
    })
    socket.on('login_request', arg => {
        if (arg.name.length > 8 && arg.password.length > 8) {
            db.get(`SELECT *, count(*) FROM users WHERE username = '${arg.name}' AND password = '${arg.password}'`, (err, data) => {
                if(err) {
                    console.log('error in logging in:' + err)
                } else if (data.online === 'true') {
                    socket.emit('syntax_error', 'a user is using this account now')
                }
                 else if (data['count(*)'] > 0) {
                    db.run(`UPDATE users SET key1 = '${socket.id}' , online = 'true' WHERE username = '${arg.name}' AND password = '${arg.password}'`)
                    socket.emit('signed_in', {key1: socket.id, key3: data.key3, username: data.username, email: data.email, password: data.password })
                } else {
                    socket.emit('syntax_error', 'the username or the password is incorrect')
                }
            })
        }
    })
    socket.on('analyse_user_data', data => {
        if (data === null || data === undefined) {
            socket.emit('analyse_request_not_accepted')
        } else {
            db.get(`SELECT count(*) from users WHERE username = '${data.username}' AND email = '${data.email}' AND password = '${data.password}'`, (err, c) => {
                if(err) {
                    console.log('err:' + err)
                } else if (c['count(*)'] < 1) {
                    socket.emit('analyse_request_not_accepted')
                } else {
                    db.run(`UPDATE users SET key1 = '${socket.id}' , online = 'true' WHERE username = '${data.username}' AND password = '${data.password}'`)
                    db.get(`SELECT count(*), name, email, workers FROM companies WHERE owner = '${data.username}'`, (err, com) => {
                        if (err) {
                            console.log('err: ' + err)
                        } else if (com['count(*)'] > 0) {
                            socket.emit('analyse_request_accepted', {username:data.username, email:data.email, password:data.password, key1:data.key1, key2:data.key2, key3:data.key3, company_owner:true, company_name:com.name, company_email:com.email, workers: com.workers})
                        } else {
                            db.get(`SELECT com FROM users WHERE username = '${data.username}'`, (err, data2) => {
                                if (err) {
                                    console.log(err)
                                } else if (!data) {
                                    socket.emit('analyse_request_accepted', data)
                                } else if (data2.com) {
                                        const comname = data2.com.split(',')[0];
                                        socket.emit('analyse_request_accepted', {username:data.username, email:data.email, password:data.password, company_owner:false, company_name:comname, key1:data.key1, key2:data.key2, key3:data.key3})
                                }
                            })
                        }
                    })
                }
            })
        }
    })
    socket.on('search_contact_name', ({data, type}) => {
        if (data === null || data === undefined || data === '') {
            socket.emit('syntax_error', 'what?')
        } else {
            db.all("SELECT username, email, key3 FROM users WHERE username LIKE ?", [`%${data}%`], (err, contact) => {
                if (err) {
                    console.log('err: ' + err)
                } else if (contact.length < 1) {
                    socket.emit('syntax_error', 'No one with this name could be found')
                } else if (type === 'worker_search') {
                    socket.emit('worker_found', contact)
                }
            })
        }
    })
    socket.on('add-com', ({comname, comemail, owner}) => {
        db.get(`SELECT count(*) FROM companies WHERE name = '${comname}' OR owner = '${owner}'`, (err, data) => {
            if(err) {
                console.log('err: ' + err)
            } else if (data['count(*)'] > 0)  {
                socket.emit('syntax_error', "the company already exists or you already own a company Account")
            } else {
                const comid = uuidv4()
                db.run(`INSERT INTO companies (id, name, owner, email) VALUES ('${comid}', '${comname}', '${owner}', '${comemail}')`)
                db.run(`UPDATE users SET com = '${comname},true' WHERE username = '${owner}'`)
                socket.emit('com-added')
            }
        })
    })
    socket.on('add_worker', ({worker, com}) => {
        db.get(`SELECT workers FROM companies WHERE name = '${com}'`, (err, data) => {
            if (err) {
                console.log(err)
            } else {
                console.log("data: ",data)
                if (data.workers) {
                    let workers = JSON.parse(data.workers)
                    if (workers.indexOf(worker) < 0) {
                        workers.push(worker)
                        let json = JSON.stringify(workers)
                        db.run(`UPDATE companies SET workers = '${json}' WHERE name = '${com}'`)
                    } else {
                        socket.emit('syntax_error', 'the user is added before')
                    }
                } else {
                    let json = JSON.stringify([worker])
                    db.run(`UPDATE companies SET workers = '${json}' WHERE name = '${com}'`)
                }
                db.run(`UPDATE users SET com = '${com},false' WHERE username = '${worker}'`)
            }
        })
    })
    socket.on('add_company_todo', ({company, todo, receivers}) => {
        db.run(`INSERT INTO com_todos (company, todo, receivers) VALUES ('${company}', '${todo}', '${receivers}')`)
    })
    socket.on('search_com_todos', ({com, username}) => {
        db.all(`SELECT * FROM com_todos WHERE company = '${com}'`, (err, data) => {
            if (err) {
                return Error(err)
            } else {
                if (data.length > 0) {
                    console.log(data)
                    socket.emit('com_todos_found', data)
                }
            }
        })
    })
    socket.on('share_routine', ({routine, user}) => {
        if (routine && user) {
            title = routine.title
            db.run(`INSERT INTO routines (title, data, creator) VALUES ('${title}', '${JSON.stringify(routine)}', '${user}')`)
        }
    })
    socket.on('fetch_routines', () => {
        db.all('SELECT * FROM routines', (err, data) => {
            if(err) {
                console.log(err)
            } else {
                socket.emit('new_routines_return', data)
            }
        })
    })
    socket.on('create_room', ({ roomname, company }) => {
        if (roomname && company) {
            db.get(`SELECT count(*), owner FROM companies WHERE name = '${company}'`, (err, data) => {
                if (err) {
                    console.log('ERR:' + err)
                    return;
                } 

                if (data['count(*)'] <= 0) {
                    socket.emit('syntax_error', 'company not found')
                } else {
                    const id = uuidv4()
                    db.run(`INSERT INTO rooms (roomid, roomname, company, owner) VALUES ('${id}', '${roomname}', '${company}', '${data.owner}')`)
                    socket.emit('room_added', {id, roomname, company})
                    db.get(`SELECT workers FROM companies WHERE name = '${company}'` , (err, data) => {
                        if (err) {
                            return Error('db-err on create-room:' + err)
                        }
                        if (data) {
                            const workers = JSON.parse(data.workers)
                            for (let w of workers) {
                                db.get(`SELECT key1 FROM users WHERE username = '${w}'`, (err, data) => {
                                    if (err) {
                                        return Error('db-err on create-room2:' + err)
                                    }
                                    if (data) {
                                        io.to(data.key1).emit('room_added', { id, roomname, company } )
                                    }
                                })
                            }
                        }
                    })
                }
            })
        }
    })
    socket.on('search_for_rooms', com => {
        if (com) {
            db.all(`SELECT * FROM rooms WHERE company = '${com}'`, (err, data) => {
                if (err) {
                    return Error('db-err on search_for_rooms:' + err)
                } 
                if (data.length > 0) {
                    socket.emit('rooms_return', data)
                }
            })
        }
    })
    socket.on("join-room", ({room}) => {
        if (room) {
            if(room === 'global' ) {
                socket.join(room);
                if (!rooms[room]) rooms[room] = new Set();
                rooms[room].add(socket.id);
                socket.to(room).emit("user-joined-room", {id: socket.id,});
            } else {
                db.get(`SELECT count(*) FROM rooms WHERE roomid = '${room}'`, (err, data) => {
                    console.log(data)
                    if (err) {
                        return Error('join-room db-err')
                    }
                    if (data['count(*)'] > 0) {
                        socket.join(room);
                        if (!rooms[room]) rooms[room] = new Set();
                        rooms[room].add(socket.id);
                        socket.to(room).emit("user-joined-room", {id: socket.id,});
                    } else {
                        socket.emit('room_not_found')
                    }
                })
            }
        }
    });
    socket.on("offer", ({ to, offer }) => {
        io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
        io.to(to).emit("answer", { from: socket.id, answer });
    });
    socket.on("ice-candidate", ({ to, candidate }) => {
        io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });
    socket.on('disconnect', () => {
        db.get(`UPDATE users SET online = 'false' WHERE key1 = '${socket.id}'`)
    })
})


server.listen(localhost, () => {
    console.log('we are serving the server now, url: http://localhost:' + localhost)
})

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (key1 char, key2 char, key3 char, username char, email char, password char, online text, com text)')
    db.run('CREATE TABLE IF NOT EXISTS companies (id char, name text, owner char, email char, workers int)')
    db.run('CREATE TABLE IF NOT EXISTS com_todos (company text, todo text, receivers char)')
    db.run('CREATE TABLE IF NOT EXISTS routines (title char, data char, creator char)')
    db.run('CREATE TABLE IF NOT EXISTS rooms (roomid text, roomname text, company text, owner char)')
    db.run(`UPDATE users SET online = 'false' `)
})