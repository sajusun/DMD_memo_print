var ram = document.querySelector("#ram");
var cpu = document.querySelector("#cpu");
var totalRam = document.querySelector("#totalRam");
ipcRenderer.on('total-mem', (event, arg) => {
    totalRam.innerHTML = (arg / 1015).toFixed(2) + " GB";
});
ipcRenderer.on('mem', (event, arg) => {
    ram.innerHTML = 100 - (arg * 100).toFixed(2) + " %";
});
ipcRenderer.on('cpu', (event, arg) => {
    cpu.innerHTML = ((arg) * 100).toFixed(2) + " %";
});
setInterval(function() {
    ipcRenderer.send('osInfo');
}, 1000);