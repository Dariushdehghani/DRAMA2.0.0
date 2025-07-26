const colors = [
    '#de3939',
    '#32a852',
    '#009dff',
    '#ff00dd',
    '#9d00ff',
    '#39de39',
    '#e6520e',
    '#ffa200',
    '#3939de',
    '#600000'
]

// these lines are pasted from dra project in react
function change_theme(selected_color) {
    let root = document.querySelector(':root');
    root.style.setProperty('--primary-color', selected_color)
}

function go_dark() {
    let root = document.querySelector(':root');
    let r = root.style
    r.setProperty('--sidebar-color', '#111')
    r.setProperty('--bg-color', '#1a1a1a')
    r.setProperty('--text-color', '#ddd')
    r.setProperty('--box-color', '#2a2a2a')
}

function go_light() {
    let root = document.querySelector(':root');
    let r = root.style
    r.setProperty('--sidebar-color', '#ccc')
    r.setProperty('--bg-color', '#eee')
    r.setProperty('--text-color', 'black')
    r.setProperty('--box-color', '#ddd')
}