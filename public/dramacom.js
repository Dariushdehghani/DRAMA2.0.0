window.onload = () => {
    let data = localStorage.getItem('user');
    socket.emit('analyse_user_data', JSON.parse(data))
}

socket.on('analyse_request_not_accepted', () => {
    alert('not accepted')
    window.location.pathname = '/signin'
    localStorage.clear()
})

socket.on('analyse_request_accepted', data => {
    document.getElementById('username').innerHTML = 'as '+data.username
})

function add_company() {
    const comname = document.getElementById('comname').value
    const comemail = document.getElementById('comemail').value
    const owner = JSON.parse(localStorage.getItem('user')).username
    if (!(comname ===''|| comemail === '')) {
        socket.emit('add-com', {comname, comemail, owner})
    }
}

socket.on('com-added', () => {
    window.location.pathname = '/home'
})