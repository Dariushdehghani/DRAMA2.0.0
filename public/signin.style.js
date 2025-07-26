function toggled(sheet) {
    if (sheet === 's') {
        document.getElementById('toggle_btn_s').classList.add('tbs')
        document.getElementById('toggle_btn_l').classList.remove('tbs')
        document.getElementById('signup_card').style.display = 'block';
        document.getElementById('login_card').style.display = 'none';
    } else {
        document.getElementById('toggle_btn_l').classList.add('tbs')
        document.getElementById('toggle_btn_s').classList.remove('tbs')
        document.getElementById('signup_card').style.display = 'none';
        document.getElementById('login_card').style.display = 'block';
    }
}

function emptyFound(p) {
    if( p.name > 0 ) {
        let n = document.getElementById('signup_name')
        n.style.backgroundColor = '#e20e0e62'
        n.style.borderColor = 'red'
    }
    if( p.email > 0 ) {
        let n = document.getElementById('signup_email')
        n.style.backgroundColor = '#e20e0e62'
        n.style.borderColor = 'red'
    }
    if( p.password > 0 ) {
        let n = document.getElementById('signup_password')
        n.style.backgroundColor = '#e20e0e62'
        n.style.borderColor = 'red'
    }
}

function emptyFoundL(p) {
    if( p.name > 0 ) {
        let n = document.getElementById('login_name')
        n.style.backgroundColor = '#e20e0e62'
        n.style.borderColor = 'red'
    }
    if( p.password > 0 ) {
        let n = document.getElementById('login_password')
        n.style.backgroundColor = '#e20e0e62'
        n.style.borderColor = 'red'
    }
}