var currentPage = 'home'
var isFileUploaded = 0
var step = 0;
var switch1 = false
var selected_emp = []
var home_timeset_date = new Date()
const weekday_names = []
weekday_names['ش'] = 6
weekday_names['ی'] = 0
weekday_names['د'] = 1
weekday_names['س'] = 2
weekday_names['چ'] = 3
weekday_names['پ'] = 4
weekday_names['ج'] = 5

const weekday_numbers = []
weekday_numbers[6] = 'ش'
weekday_numbers[0] = 'ی'
weekday_numbers[1] = 'د'
weekday_numbers[2] = 'س'
weekday_numbers[3] = 'چ'
weekday_numbers[4] = 'پ'
weekday_numbers[5] = 'ج'

socket.on('syntax_error', err => alert(err))

window.onload = () => {
    let path = window.location.pathname
    if (!(path === '/home')) {
        const panel = path.toString().split('/')
        sidebar_clicked(panel[2])
        document.getElementById('back_arrow').style.display = 'block'
        currentPage = panel
    } else {
        sidebar_clicked('home')
    }

    let data = JSON.parse(localStorage.getItem('user'));
    socket.emit('analyse_user_data', data)
    socket.emit('search_for_rooms', data.company_name)
    if (data.company_name) {
        socket.emit('search_com_todos', { com:data.company_name, username:data.username })
    }
    user_daily_update()
    setup_routines()
    update_user_photo()

    // themrs setup
    if (localStorage.getItem('theme') === 'dark') {
        go_dark()
        document.getElementById('switch_theme_input').setAttribute('checked', '')
        switch1 = true
    } else {
        go_light()
    }

    change_theme(localStorage.getItem('theme_color'))

    document.getElementById('shamsi_date').innerHTML = getShDate('long', new Date())

    let input = document.querySelector('#jalaliInput')
    let calendar = document.querySelector('#calendar')
    calanderSetup(input, calendar)

    lucide.createIcons()

    document.getElementById('timeset-date').innerText = Intl.DateTimeFormat('en-IR-u-ca-persian', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date())

    document.querySelector('#jalaliInput').value = getShDate('numeric', new Date())

    socket.emit('fetch_routines')

    setTimeout(() => document.querySelector('.loading_scr').classList.add('disabled'), 500)
}

function setup_routines() {
    const data2 = localStorage.getItem('user_daily')
    let contxt = document.querySelector('#routines-ctx')
    if (data2) {
        let data = data2.split('po/d')
        for (let todojn of data) {
            const todo = JSON.parse(todojn)
            console.log(todo)
            if (todo.issue === 'routine') {
                const days = []
                console.log(todo)
                for (let day of todo.days) {
                    days.push(weekday_numbers[day])
                }
                contxt.innerHTML += `<div class="todocard" style="align-items: center;">
                                    <h4>${todo.title}</h4>
                                    <h4>${days}</h4>
                                    <i data-lucide="share" onclick='if (confirm("share this routine? anyone could see and interact.")) {share_routine(${todojn})};' ></i>
                                </div>`
            }
    }
    }
}

function home_timeset_prev() {
    home_timeset_date.setDate(home_timeset_date.getDate()-1)
    timeset_todo_reload()
}

function home_timeset_next() {
    home_timeset_date.setDate(home_timeset_date.getDate() + 1)
    timeset_todo_reload()
}

function getShDate(type, date) {
    const shamsi = new Intl.DateTimeFormat('en-IR-u-ca-persian', {
        year: 'numeric',
        month: type,
        day: 'numeric'
    }).format(date)
    return(shamsi)
}

function routine_done(routine) {
    if (routine.today_done[0] === 1 && new Date(routine.today_done[1]).getDate() === new Date().getDate() && new Date(routine.today_done[1]).getMonth() === new Date().getMonth()) {
        return true
    }
}

function timeset_todo_reload() {
    const no_todo = document.querySelector('.no-todo').classList.contains('disabled')
    if (no_todo) {
        document.getElementById('timeset-date').innerText = getShDate('long', home_timeset_date)
        let contxt = document.getElementById('todo-ctx')
        let data = localStorage.getItem('user_daily')
        if (!(data === null || data === undefined || data === '')) {
            contxt.innerHTML = ''
            let todos = data.split('po/d')
            for (let todojn of todos) {
                let todo = JSON.parse(todojn)
                if (todo.issue === 'todo' && new Date(todo.date).getDate() === new Date(home_timeset_date).getDate() && new Date(todo.date).getMonth() === new Date(home_timeset_date).getMonth() ) {
                    contxt.innerHTML += `<div class="todocard" style="height:fit-content;">
                                <h4 onclick='open_todo(${todojn})'>${todo.title}</h4>
                                <input type="checkbox" onclick='do_todo(${todojn})' ondblclick='undo_todo(${todojn})' ${todo.done == 1 ? 'checked' : ''}>
                            </div>`
                } else if (todo.issue === 'routine' && todo.days.indexOf(new Date().getDay()) >= 0 && new Date().getDate() === new Date(home_timeset_date).getDate() && new Date().getMonth() === new Date(home_timeset_date).getMonth()) {
                    contxt.innerHTML += `<div class="todocard" style="height:fit-content;">
                                <h4 onclick='open_routine(${todojn})'>${todo.title}</h4>
                                <input type="checkbox" onclick='do_routine(${todojn})' ondblclick='undo_routine(${todojn})' ${routine_done(todo) ? 'checked' : ''}>
                            </div>`
                } else if (todo.issue === 'routine' && todo.days.indexOf(new Date(home_timeset_date).getDay()) >= 0) {
                    contxt.innerHTML += `<div class="todocard" style="height:fit-content;">
                                <h4 onclick='open_routine(${todojn})'>${todo.title}</h4>
                            </div>`
                }
            }
        }
    } else user_daily_update();
}

function bigCalendar_change(idate) {
    let dateInp = idate.replace(/\s?AP$/, '').trim().split('/')
    const jy = Number(dateInp[2])
    const jm = Number(dateInp[0])-1
    const jd = Number(dateInp[1])
    const {gy, gm, gd} = jalaliToGregorian(jy, jm, jd)
    home_timeset_date = new Date(gy,gm,gd)
    timeset_todo_reload()
}

function show_calendar(inputid, calid) {
    let calendar = document.querySelector(calid)
    let input = document.querySelector(inputid)
    calendar.style.display = 'block'
    calanderSetup(input, calendar)
    document.querySelectorAll('#datepicker-calendar td').forEach(elem => {
        elem.addEventListener('click', () => {
            calendar.style.display = 'none'
        })
    })
    document.body.addEventListener('click', e => {
        if ((document.querySelector(calid).contains(e.target))) {
            document.querySelector(calid).style.display = 'none'
        }
    })
}

function show_menu() {
    document.getElementById('modals').style.display = 'flex'
    document.querySelector('.sidebar').classList.remove('mobile-none')
    document.querySelector('.sidebar').classList.add('mobile-flex')
}

function close_sidebar() {
    document.getElementById('modals').style.display = 'none'
    document.querySelector('.sidebar').classList.add('mobile-none')
    document.querySelector('.sidebar').classList.remove('mobile-flex')
}

function sidebar_clicked(btn) {
    close_sidebar()
    currentPage = btn
    document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'))
    document.getElementById(btn + '_sidebtn').classList.add('active')
    document.querySelectorAll('.content .panel').forEach(panel => {panel.classList.add('disabled')})
    document.querySelector('.content .' + btn + '-panel').classList.remove('disabled')
    if(btn === 'home') {
        document.querySelector('.planner-panel').classList.remove('disabled')
        document.querySelector('.share-panel').classList.remove('disabled')
        document.querySelector('.com-panel').classList.add('disabled')
        history.pushState(null, '', '/home')
        document.getElementById('routines_new_box').style.display = 'none'
        document.getElementById('back_arrow').style.display = 'none'
    }else if (btn === 'planner') {
        document.querySelectorAll('.planner-panel').forEach(elm => elm.classList.remove('disabled'))
        document.querySelector('.home-panel').classList.remove('disabled')
        history.pushState(null, '', '/home/planner')
        setup_routines()
    } else {
        history.pushState(null, '', `/home/${btn}`)
        document.getElementById('back_arrow').style.display = 'block'
    }
    if (btn === 'share') {
        socket.emit('fetch_routines')
    }
}

function toggle_dark_theme() {
    if (switch1) {
        switch1 = false
        go_light()
        localStorage.setItem('theme', 'light')
    } else {
        switch1 = true
        go_dark()
        localStorage.setItem('theme', 'dark')
    }
}

socket.on('analyse_request_not_accepted', () => {
    alert('not accepted')
    window.location.pathname = '/signin'
    localStorage.clear()
})

socket.on('analyse_request_accepted', data2 => {
    document.getElementById('username_ctx').innerHTML = data2.username
    localStorage.setItem('user', JSON.stringify(data2))
    localStorage.setItem('workers', data2.workers)
    if(data2.company_owner) {
        let com_sidebtn = document.getElementById('com_sidebtn')
        com_sidebtn.classList.remove('disabled_district')
        update_company()
    }
    if (data2.company_name) {
        document.getElementById('company_nsp').innerHTML = data2.company_name + ' company'
        document.getElementById('add-company-button').style.display = 'none'
    }
})

socket.on('new_routines_return', routines => {
    let ctx = document.getElementById('routines_new_box')
    if (routines && routines.length > 0) {
        routines.reverse()
        if (currentPage === 'share') {
            ctx.style.display = 'block'
        }
        ctx.innerHTML = ''
        for (let routinejn of routines) {
            let routine = JSON.parse(routinejn.data)
            const days = []
            for (let day of routine.days) {
                days.push(weekday_numbers[day])
            }
            ctx.innerHTML += `<div class="todocard" >
                                <h4>${routine.title}</h4>
                                <h4>${days}</h4>
                                <i data-lucide="diamond-plus" onclick='down_new_routine(${routinejn.data})'></i>
                            </div>`
        }
    }
    lucide.createIcons()
})

socket.on('com_todos_found', todos => {
    const contxt = document.getElementById('com-todos-ctx')
    contxt.innerHTML += '<h2>Company todos</h2>'
    for (let todo of todos) {
        contxt.innerHTML += `<div class="todocard" >
                                <h4>${todo.todo}</h4>
                            </div>`
    }
})

function new_room() {
    const roomname = document.getElementById("new_room_name_inp").value
    const user = JSON.parse(localStorage.getItem('user'))
    if (roomname && user.company_owner) {
        const company = user.company_name
        socket.emit('create_room', ({ roomname, company }))
        document.getElementById('modals').style.display = 'none'
        document.getElementById('new-room-modal').style.display = 'none'
    }
}

socket.on('room_added', ({id, roomname, company}) => {
    document.getElementById('rooms_ctx').innerHTML += `<div class="room_box shine" >
                            <h3>${roomname}</h3>
                                <a href="/rooms/?room=${id}&roomname=${roomname}"><i data-lucide="link" ></i></a>
                            </div>`
})

socket.on('rooms_return', rooms => {
    rooms.forEach(room => {
        document.getElementById('rooms_ctx').innerHTML += `<div class="room_box shine" >
                            <h3>${room.roomname}</h3>
                                <a href="/rooms/?room=${room.roomid}&roomname=${room.roomname}"><i data-lucide="link" ></i></a>
                            </div>`
    })
})

function new_todo_file() {
    let back = document.getElementById("modals")
    back.classList.remove("disabled_district")
    back.style.display = 'flex'
    let modal = document.getElementById("add-todo-modal")
    modal.classList.remove("disabled_district")
    modal.style.display = 'flex'
    document.getElementById('datepicker-jalali-input').value = getShDate('numeric', new Date())
}

function new_room_btn() {
    let back = document.getElementById("modals")
    back.classList.remove("disabled_district")
    back.style.display = 'flex'
    let modal = document.getElementById("new-room-modal")
    modal.classList.remove("disabled_district")
    modal.style.display = 'flex'
}

function go_set_todo_group() {
    let back = document.getElementById("modals")
    back.classList.remove("disabled_district")
    back.style.display = 'flex'
    let modal = document.getElementById("new-todo-group-modal")
    modal.classList.remove("disabled_district")
    modal.style.display = 'flex'
    let weekday_bar = document.querySelector('#routine_days_selecment_bar')
    weekday_bar.innerHTML = ''
    let weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
    for (wd of weekdays) {
        weekday_bar.innerHTML += `<label class="weekday-checkbox-con">
      <input type="checkbox" id='selecment_weekday${wd}' class="weekday-checkbox-inp" >
      <span class="weekday-checkbox-spn">${wd}</span>
    </label>`
    }
}

function down_new_routine(routine) {
    const new_r = {
        issue: 'routine',
        today_done: [0],
        title: routine.title,
        description: routine.description,
        days: routine.days
    }
    const new_routine_j = JSON.stringify(new_r)
    const last_routines = localStorage.getItem('user_daily')
    const new_routine = last_routines ? last_routines + 'po/d' + new_routine_j : new_routine_j
    localStorage.setItem('user_daily', new_routine)
    timeset_todo_reload()
}

function add_new_routine() {
    const title = document.getElementById('todo_group_name_inp').value
    const description = document.getElementById('todo_group_desc_inp').value
    const last_routines = localStorage.getItem('user_daily')
    let selected_days = []
    const selectment_buttons = document.querySelectorAll('.weekday-checkbox-con input')
    for (let sb of selectment_buttons) {
        if (sb.checked) {
            selected_days.push(weekday_names[sb.id.replace('selecment_weekday', '')])
        }
    }
    const new_r = {
        issue: 'routine',
        today_done: [0],
        title,
        description,
        days: selected_days
    }
    const new_routine_j = JSON.stringify(new_r)
    const new_routine = last_routines ? last_routines + 'po/d' + new_routine_j : new_routine_j
    localStorage.setItem('user_daily', new_routine)
    close_new_routine_win()
    timeset_todo_reload()
}

function addit_to_file() {
    let title = document.getElementById('new-todo-name-inp').value
    let description = document.getElementById('new-todo-description').value
    let dateInp = document.getElementById('datepicker-jalali-input').value.replace(/\s?AP$/, '').trim().split('/')
    let last_data = localStorage.getItem('user_daily')
    if (/^[a-zA-z0-9_, .:;-]+$/.test(title) && /^[a-zA-z0-9_, .:;-]+$/.test(description) || /^[a-zA-z0-9_, .:;-]+$/.test(title) && description == '') {
        const jy = Number(dateInp[2])
        const jm = Number(dateInp[0])-1
        const jd = Number(dateInp[1])
        const {gy, gm, gd} = jalaliToGregorian(jy, jm, jd)
        const date = new Date(gy,gm,gd)
        let new_d = {
            issue: 'todo',
            done: 0,
            title,
            description,
            date
        }
        let new_data_json = JSON.stringify(new_d)
        let new_data =last_data ? last_data + 'po/d' + new_data_json : new_data_json;
        localStorage.setItem('user_daily', new_data)
        close_add_todo_window()
        timeset_todo_reload()
    } else {
        alert('some special characters are not allowed! (like \',",/ and ...)')
    }
}

function download_userdaily_file() {
    if (confirm('your ativities will be downloaded as a file and will no longer be available.')) {
        const filename = new Date() + '.DRAMAFile.json'
        const data = localStorage.getItem('user_daily')
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        if (confirm('is it downloaded?')) {
            localStorage.removeItem('user_daily')
            localStorage.removeItem('user_ideas')
            window.location.reload()
        } else {
            alert('we did not deleted your activity, try to download it again.')
        }
    }
}

function del_userdaily_file() {
    if (confirm('are you sure you want to delete the cache?')) {
        localStorage.removeItem('user_daily')
        localStorage.removeItem('user_ideas')
        window.location.reload()
    }
}

function last_file_loaded(elem) {
    if (confirm('if you do this, your last data will be deleted')) {
        let name_modified = elem.files[0].name.split('.')
        if (name_modified[name_modified.length -1] === 'json' && name_modified[name_modified.length -2] === 'DRAMAFile'){
            let reader = new FileReader()
            reader.onloadend = () => {
                localStorage.removeItem('user_daily')
                localStorage.setItem('user_daily', JSON.stringify(JSON.parse(reader.result)))
                window.location.reload()
            }
            reader.readAsText(elem.files[0])
        }
    }
}

function share_routine(routine) {
    socket.emit('share_routine', {routine, user: JSON.parse(localStorage.getItem('user')).username})
    alert('done!')
}

function logout_user_account() {
    if (confirm('are you sure you want to log out? if you do, all of your data will be deleted')) {
        localStorage.clear()
        window.location.href = '/signin'
    }
}

function close_add_todo_window() {
    document.querySelector('#new-todo-name-inp').value = ''
    document.querySelector('#new-todo-description').value = ''
    document.getElementById('add-todo-modal').style.display = 'none'
    document.getElementById('modals').style.display = 'none'
}

function close_new_routine_win() {
    document.querySelector('#todo_group_name_inp').value = ''
    document.querySelector('#todo_group_desc_inp').value = ''
    document.getElementById('new-todo-group-modal').style.display = 'none'
    document.getElementById('modals').style.display = 'none'
}

function user_daily_update() {
    let data = localStorage.getItem('user_daily')
    if (data === null || data === undefined || data === '') {
        console.log('nothing to show')
        document.querySelector(".no-todo").classList.remove('disabled')
        document.querySelector(".planner-panel").classList.add('disabled_district')
    } else {
        let saved = data.split('po/d')
        document.querySelector('.no-todo').classList.add('disabled')
        document.querySelector(".planner-panel").classList.remove("disabled_district")
        let contxt = document.getElementById('todo-ctx')
        contxt.innerHTML = ''
        for (let y of saved) {
            let x = JSON.parse(y)
            if (x.issue === 'todo' && new Date(x.date).getDate() === new Date().getDate()) {
                contxt.innerHTML += `<div class="todocard" style="height:fit-content;">
                            <h4 onclick='open_todo(${y})'>${x.title}</h4>
                            <input type="checkbox" onclick='do_todo(${y})' ondblclick='undo_todo(${y})' ${x.done == 1 ? 'checked' : ''}>
                        </div>`
            }  else if (x.issue === 'routine' && x.days.indexOf(new Date().getDay()) >= 0) {
                contxt.innerHTML += `<div class="todocard" style="height:fit-content;">
                            <h4 onclick='open_routine(${y})'>${x.title}</h4>
                            <input type="checkbox" onclick='do_routine(${y})' ondblclick='undo_routine(${y})' ${routine_done(x) ? 'checked' : ''}>
                        </div>`
            }
        }
    }
}  

// because of this scripts were used a lot, i changed them to a function, it changes the object that is saved in localStorage as json
/**
 * 
 * @param {*} item_key the key of local storage that you want to open
 * @param {*} split_key the word that you have set to seperate JSON OBJs
 * @param {*} verification_obj the obj you want to change
 * @param {*} change_wanted_key the work you wanna do with
 * @param {*} wanted_value the value you want to set
 */
function change_memorized_items(item_key, split_key, verification_obj, change_wanted_key, wanted_value) {
    let local = localStorage.getItem(item_key)
    let data_arr = local.split(split_key)
    let data_array = []
    for (let x in data_arr) {
        let data = JSON.parse(data_arr[x])
        if (data.title === verification_obj.title) {
            if (change_wanted_key === 'done') {
                data.done = wanted_value
            } else if (change_wanted_key === 'del') {
                continue
            } else {
                data.today_done = wanted_value
            }
        }
        data_array.push(JSON.stringify(data))
    }
    // back datas into json
    let data_array_json = '';
    for (let i of data_array) {
        if (data_array[0] === i) {
            data_array_json = data_array[0]
        } else {
            data_array_json += split_key + i
        }
    }
    localStorage.setItem(item_key, data_array_json)
}

function do_todo(todo) {
    change_memorized_items('user_daily', 'po/d', todo, 'done', 1)
    timeset_todo_reload()
}

function undo_todo(todo) {
    change_memorized_items('user_daily', 'po/d', todo, 'done', 0)
    timeset_todo_reload()
}

function do_routine(routine) {
    console.log(routine)
    change_memorized_items('user_daily', 'po/d', routine, 'today_done', [1, new Date()])
    timeset_todo_reload()
}

function undo_routine(routine) {
    change_memorized_items('user_daily', 'po/d', routine, 'today_done', [0])
    timeset_todo_reload()
}

function open_todo(todo) {
    document.getElementById('modals').style.display = 'flex'
    document.getElementById('show-todo-modal').style.display = 'flex'
    document.getElementById('todo-show-title').innerText = todo.title
    document.getElementById('todo-show-descript').innerText = todo.description
    document.getElementById('todo-show-time').innerText = getShDate('long',new Date(todo.date))
}

function open_routine(routine) {
    document.getElementById('modals').style.display = 'flex'
    document.getElementById('show-todo-modal').style.display = 'flex'
    document.getElementById('todo-show-title').innerText = routine.title
    document.getElementById('todo-show-descript').innerText = routine.description
    let days = []
    routine.days.forEach(day => days.push(weekday_numbers[day]))
    document.getElementById('todo-show-time').innerText = days + ' (routine)'
}

function open_theme_menu() {
    document.getElementById('modals').style.display = 'flex'
    document.getElementById('themes-modal').style.display = 'flex'
    let ctx = document.getElementById('themecolors-ctx')
    ctx.innerHTML = ''
    for (let color of colors) {
        let btn = document.createElement('button')
        btn.style = `width:1rem;height:1rem;background:${color};`
        btn.addEventListener('click', (event) => {
            change_theme(event.target.style.backgroundColor)
            localStorage.setItem('theme_color', color)
        })
        ctx.appendChild(btn)
    }
}

function pphoto_choosed(e) {
    let file = e.target.files[0];
    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const size = Math.min(img.width, img.height)
            const startX = (img.width - size) / 2
            const startY = (img.height - size) / 2
            const targetSize = 300
            canvas.width = targetSize
            canvas.height = targetSize
            ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
            document.getElementById('profile-pic-preview').src = compressedDataUrl
            sessionStorage.setItem('profilePic', compressedDataUrl)
            document.getElementById('modals').style.display = 'flex'
            document.getElementById('profile-pic-change-modal').style.display = 'flex'
        }
    }
    if (file) {
        reader.readAsDataURL(file)
    }
}

function close_change_profile_pic_window() {
    document.getElementById('modals').style.display = 'none'
    document.getElementById('profile-pic-change-modal').style.display = 'none'
    sessionStorage.removeItem('profilePic')
}

function change_profile_pic() {
    document.getElementById('modals').style.display = 'none'
    document.getElementById('profile-pic-change-modal').style.display = 'none'
    localStorage.setItem('profilePic', sessionStorage.getItem('profilePic'))
    sessionStorage.removeItem('profilePic')
    update_user_photo()
}

function update_user_photo() {
    console.log('updating photo...')
    let pic = localStorage.getItem('profilePic')
    if (pic) {
        document.querySelectorAll('.profile_photo').forEach(img => img.src = pic)
    }
}

function open_add_contact_page() {
    document.getElementById('modals').style.display = 'flex'
    let ctx = document.getElementById('new-worker-modal')
    ctx.style.display = 'flex'
}

function close_all_modals(event) {
    if (event.target && event.target.id === 'modals') {
        document.getElementById('modals').style.display = 'none'
        document.querySelectorAll('#modals .modal').forEach(modal => modal.style.display = 'none')
        document.getElementById('themes-modal').style.display = 'none'
        close_sidebar()
    }
}

function close_theme_change_win() {
    document.getElementById('modals').style.display = 'none'
    document.getElementById('themes-modal').style.display = 'none'
}

function update_company() {
    let workers = JSON.parse(localStorage.getItem('workers'))
    let emp_list = document.getElementById('emp-list')
    if (workers) {
        for (let w of workers) {
            emp_list.innerHTML += `<div class="emp-card">
                                            <h4>${w}</h4>
                                            <input type="checkbox" onclick="toggle_emp_selecment(this.checked, '${w}')">
                                        </div>` 
        }
    }
}

function search_workers_m() {
    let worker_name = document.getElementById('new-worker-search').value
    socket.emit('search_contact_name', {data:worker_name, type:'worker_search'})
}

socket.on('worker_found', contacts => {
    let context = document.getElementById('workers-list')
    context.innerHTML = ''
    for (let con of contacts) {
        context.innerHTML += `<div class="user-box">
                        <h3>${con.username}</h3>
                        <button onclick="add_worker('${con.username}')" class="button_type2" >invite</button>
                    </div>`
    }
})

function add_worker(worker) {
    const data = localStorage.getItem('workers')
    const com = JSON.parse(localStorage.getItem('user')).company_name
    let workers = JSON.parse(data)
    if (data && workers) {
        if (workers.indexOf(worker) < 0) {
            workers.push(worker)
            let json = JSON.stringify(workers)
            localStorage.setItem('workers', json)
        } else {
            alert('The worker already exists, if not, please reload')
            return;
        }
    } else {
        let json = JSON.stringify([worker])
        localStorage.setItem('workers', json)
    }
    socket.emit('add_worker', {worker, com})
}

function toggle_emp_selecment(isselected, em_name) {
    if (isselected) {
        selected_emp.push(em_name)
    } else {
        let index = selected_emp.indexOf(em_name)
        if (index > -1) {
            selected_emp.splice(index, 1)
        }
    }
    document.getElementById('vcl').innerText = selected_emp.length + ' participants selected'
}

function send_company_todo() {
    if (selected_emp.length > 0) {
        let todo = document.getElementById('company_todo_inp').value
        const company = JSON.parse(localStorage.getItem('user')).company_name
        const receivers = JSON.stringify(selected_emp)
        socket.emit('add_company_todo', {company, todo, receivers})
        document.getElementById('company_todo_inp').value = ''
    } else {
        alert('Select some workers first')
    }
}

socket.on('syntax_error', alert => {
    alert(alert)
})