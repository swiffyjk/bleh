export function rain() {
    // clear old
    let rain_container_old = document.getElementById('rain-container');
    if (rain_container_old != undefined)
        document.body.removeChild(rain_container_old);

    // make anew
    let rain_container = document.createElement('div');
    rain_container.classList.add('rain-container');
    rain_container.setAttribute('id', 'rain-container');
    rain_container.innerHTML = (`
        <div class="rain" id="rain"></div>
        <div class="rain rain-back" id="rain-back"></div>
    `);
    document.body.appendChild(rain_container);

    let increment = 0;
    let drops = '';
    let subtle_drops = '';

    let rain_main = document.getElementById('rain');
    let rain_back = document.getElementById('rain-back');

    while (increment < 60) {
        // random numbers
        let randoms = [
            (Math.floor(Math.random() * (98 - 1 + 1) + 1)),
            (Math.floor(Math.random() * (5 - 2 + 1) + 2))
        ];

        increment += randoms[1];

        drops += '<div class="drop" style="left: ' + increment + '%; bottom: ' + (randoms[1] + randoms[1] - 1 + 280) + '%; animation-delay: 0.' + randoms[0] + 's; animation-duration: 0.5' + randoms[0] + 's;"><div class="stem" style="animation-delay: 0.' + randoms[0] + 's; animation-duration: 0.5' + randoms[0] + 's;"></div><div class="splat" style="animation-delay: 0.' + randoms[0] + 's; animation-duration: 0.5' + randoms[0] + 's;"></div></div>';
        subtle_drops += '<div class="drop" style="right: ' + increment + '%; bottom: ' + (randoms[1] + randoms[1] - 1 + 280) + '%; animation-delay: 0.' + randoms[0] + 's; animation-duration: 0.5' + randoms[0] + 's;"><div class="stem" style="animation-delay: 0.' + randoms[0] + 's; animation-duration: 0.5' + randoms[0] + 's;"></div><div class="splat" style="animation-delay: 0.' + randoms[0] + 's; animation-duration: 0.5' + randoms[0] + 's;"></div></div>';

        rain_main.innerHTML = drops;
        rain_back.innerHTML = subtle_drops;
    }
}

export function start_rain() {

    if (settings.rain)
        rain();
}