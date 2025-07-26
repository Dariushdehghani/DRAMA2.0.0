function isJalaliLeapYear(jy) {
    const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
    1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    let bl = breaks.length;
    let jp = breaks[0];
    let jm, jump, leap, n, i;

    for (i = 1; i < bl; i++) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
    }
    n = jy - jp;
    if (jump - n < 6) n = n - jump + Math.floor((jump + 4) / 33) * 33;
    leap = (((n + 1) % 33) - 1) % 4;
    if (leap === -1) leap = 4;
    return leap === 0;
}

function getJalaliMonthLength(year, month) {
    if (month < 6) return 31;
    if (month < 11) return 30;
    return isJalaliLeapYear(year) ? 30 : 29;
}

function jalaliToGregorian(jy, jm, jd) {
    let gy;
    if (jy > 979) {
    gy = 1600;
    jy -= 979;
    } else {
    gy = 621;
    jy -= 0;
    }

    let days = (365 * jy) + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd;
    const jdm = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
    days += jdm[jm - 1];

    gy += 400 * Math.floor(days / 146097);
    days %= 146097;

    if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    }

    gy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
    }

    let gd = days + 1;
    const sal_a = [0,31,(gy % 4 === 0 && gy % 100 !== 0 || gy % 400 === 0) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];

    let gm = 0;
    for (let i = 1; i <= 12; i++) {
    if (gd <= sal_a[i]) {
        gm = i;
        break;
    }
    gd -= sal_a[i];
    }

    return { gy, gm, gd };
}

function getWeekdayOfJalaliFirstDay(jy, jm) {
    const { gy, gm, gd } = jalaliToGregorian(jy, jm + 1, 1);
    const date = new Date(gy, gm - 1, gd);
    const weekday = date.getDay(); // Sunday = 0
    return (weekday + 1) % 7; // Saturday = 0
}

function formatJalali(jy, jm, jd) {
    const { gy, gm, gd } = jalaliToGregorian(jy, jm + 1, jd);
    const date = new Date(gy, gm - 1, gd);
    return new Intl.DateTimeFormat('en-IR-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
    }).format(date);
}

function isFriday(jy, jm, jd) {
    const { gy, gm, gd } = jalaliToGregorian(jy, jm + 1, jd);
    const date = new Date(gy, gm - 1, gd);
    const weekday = date.getDay()
    return weekday == 5
}

function calanderSetup(input, calendar){    
    const jalaliMonths = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    const intlDate = new Intl.DateTimeFormat('en-IR-u-ca-persian', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).format(new Date()).replace('AP','').split('/')

    let currentYear = intlDate[2];
    let currentMonth = intlDate[0]-1; // خرداد (0-indexed)
    let currentDay = intlDate[1]

    function renderCalendar() {
        calendar.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'header';

        const prev = document.createElement('span');
        prev.innerHTML = '<i data-lucide="chevron-left"></i>';

        const next = document.createElement('span');
        next.innerHTML = '<i data-lucide="chevron-right"></i>';

        const returnb = document.createElement('span');
        returnb.innerHTML = '<i data-lucide="rotate-cw"></i>'

        const title = document.createElement('span');
        title.textContent = `${jalaliMonths[currentMonth]} ${currentYear}`;

        header.appendChild(prev);
        header.appendChild(returnb)
        header.appendChild(title);
        header.appendChild(next);
        calendar.appendChild(header);

        const table = document.createElement('table');
        const daysRow = document.createElement('tr');
        ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].forEach(d => {
        const th = document.createElement('th');
        th.textContent = d;
        daysRow.appendChild(th);
        });
        daysRow.className = 'daysRow'
        table.appendChild(daysRow);

        let row = document.createElement('tr');
        const startDay = getWeekdayOfJalaliFirstDay(currentYear, currentMonth);

        for (let i = 0; i < startDay; i++) {
            row.appendChild(document.createElement('td'));
        }

        const days = getJalaliMonthLength(currentYear, currentMonth);

        for (let d = 1; d <= days; d++) {
        const cell = document.createElement('td');
        cell.textContent = d;
        cell.classList.add('calendar_cell')
        if (d == intlDate[1] && currentMonth == intlDate[0]-1 && currentYear == intlDate[2]) {
            cell.classList.add('selected')
        }
        if (isFriday(currentYear, currentMonth, d)) {
            cell.classList.add('closeday')
        }
        cell.addEventListener('click', () => {
            const formatted = formatJalali(currentYear, currentMonth, d);
            input.value = formatted;
            if (calendar.id === 'calendar') {
                bigCalendar_change(formatted)
            }
            for (let i of document.querySelectorAll('.calendar_cell')) {
                i.classList.remove('selected')
            }
            cell.classList.add('selected')
        });
        row.appendChild(cell);
        if (row.children.length === 7) {
            table.appendChild(row);
            row = document.createElement('tr');
        }
        }

        if (row.children.length > 0) {
        table.appendChild(row);
        }

        calendar.appendChild(table);

        prev.onclick = () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
        lucide.createIcons()
        };

        next.onclick = () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
        lucide.createIcons()
        };

        returnb.onclick = () => {
            currentMonth = intlDate[0]-1
            currentYear = intlDate[2]
            currentDay = intlDate[1]
            renderCalendar()
            lucide.createIcons()
        }
    }
    renderCalendar()
    lucide.createIcons()
}