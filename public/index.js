socket.on('syntax_error', text => alert(text))

window.onload = () => {
    let data = localStorage.getItem('user');
    socket.emit('analyse_user_data', JSON.parse(data))
}

socket.on('analyse_request_accepted', () => {
    window.location.href = '/home'
})

function submit_signup() {
    let e = 0
    let name = document.getElementById('signup_name')
    let email = document.getElementById('signup_email')
    let password = document.getElementById('signup_password')

    name.style.borderColor = 'var(--color-2)'
    name.style.backgroundColor = '#ffcf9640'
    email.style.borderColor = 'var(--color-2)'
    email.style.backgroundColor = '#ffcf9640'
    password.style.borderColor = 'var(--color-2)'
    password.style.backgroundColor = '#ffcf9640'

    let empty = {
        name: 0,
        email: 0,
        password: 0
    }

    if(name.value.length < 8) {
        empty.name = 1
        e +=1
    }
    if(email.value.length < 8){
        empty.email = 1
        e +=1
    }
    if(password.value.length < 8){
        empty.password = 1
        e +=1
    }

    if (e > 0) {
        emptyFound(empty)
    } else {
        socket.emit('signup_request', {name: name.value, email: email.value, password: password.value})
    }
}

function submit_login() {
    let e = 0
    let name = document.getElementById('login_name')
    let password = document.getElementById('login_password')

    name.style.borderColor = 'var(--color-2)'
    name.style.backgroundColor = '#ffcf9640'
    password.style.borderColor = 'var(--color-2)'
    password.style.backgroundColor = '#ffcf9640'

    let empty = {
        name: 0,
        password: 0
    }

    if(name.value.length < 8) {
        empty.name = 1
        e +=1
    }
    if(password.value.length < 8){
        empty.password = 1
        e +=1
    }

    if (e > 0) {
        emptyFoundL(empty)
    } else {
        socket.emit('login_request', {name: name.value, password: password.value})
    }
}

socket.on('signed_in', data => {
    let json_data = JSON.stringify({username: data.username, email: data.email, password: data.password, key1: data.key1})
    localStorage.clear()
    localStorage.setItem('user', json_data)
    document.getElementById('mc1').style.display = 'none'
    document.getElementById('mc2').style.display = 'block'
})
